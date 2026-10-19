import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/database.js";
import { authenticate } from "../../middlewares/auth.js";
import { authorize } from "../../middlewares/rbac.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  audit,
  organization,
  parse,
  text,
  transaction,
  uuid,
} from "../../utils/contract.js";
import { checkSchedule } from "../event/operations.routes.js";
import { eventOpenForPartnerParticipation } from '../event/partner-participation.js';

const router = Router(),
  admin = [authenticate, authorize("admin")],
  partner = [authenticate, authorize("partner")];
const run = (fn) =>
  asyncHandler(async (r, s) => ApiResponse.success(s, await fn(r)));
const eventFilter = (r) =>
  r.query.eventId ? { eventId: parse(uuid, r.query.eventId) } : {};
async function openEvent(tx, eventId, deadline) {
  const event = await tx.event.findFirst({
    where: {
      id: eventId,
      isDeleted: false,
      status: { in: ["published", "ongoing"] },
      endAt: { gt: new Date() },
    },
    include: { settings: true },
  });
  if (!event) throw ApiError.conflict("Sự kiện không còn nhận đăng ký");
  if (event.settings?.[deadline] && event.settings[deadline] < new Date())
    throw ApiError.conflict("Đã hết hạn đăng ký");
  return event;
}
async function notifyOrg(tx, orgId, title, message, link = "/partner/booths") {
  const users = await tx.organizationMember.findMany({
    where: { organizationId: orgId },
  });
  await tx.notification.createMany({
    data: users.map((u) => ({
      userId: u.userId,
      title,
      message,
      kind: "booth",
      link,
    })),
  });
}

async function notifyAdmins(tx, title, message, link = "/admin") {
  const admins = await tx.user.findMany({
    where: {
      isDeleted: false,
      OR: [
        { primaryRole: "admin" },
        { userRoles: { some: { role: { code: "admin" } } } },
      ],
    },
    select: { id: true },
  });
  if (admins.length > 0) {
    await tx.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        title,
        message,
        kind: "system",
        link,
      })),
    });
  }
}
router.get(
  "/partner/event-applications",
  ...partner,
  run(async (r) => {
    const org = await organization(r.user.id);
    return prisma.partnerApplication.findMany({
      where: { organizationId: org.id },
      include: { event: { include: { venue: true } }, organization: true },
      orderBy: { createdAt: "desc" },
    });
  }),
);
router.post(
  "/partner/event-applications",
  ...partner,
  run((r) =>
    transaction(async (tx) => {
      const { eventId } = parse(z.object({ eventId: uuid }).strict(), r.body),
        org = await organization(r.user.id, tx);
      await eventOpenForPartnerParticipation(tx, eventId);
      const row = await tx.partnerApplication.create({
        data: {
          eventId,
          organizationId: org.id,
          status: "submitted",
          submittedAt: new Date(),
        },
      });
      await audit(tx, r.user, "create", "PartnerApplication", row.id);
      await notifyAdmins(tx, "Đơn đăng ký sự kiện mới", `Đối tác "${org.name}" vừa nộp hồ sơ đăng ký tham gia sự kiện.`, "/admin?tab=event-applications");
      return row;
    }),
  ),
);
router.get(
  "/admin/partner-applications",
  ...admin,
  run((r) =>
    prisma.partnerApplication.findMany({
      where: eventFilter(r),
      include: { organization: true, event: true },
      orderBy: { createdAt: "desc" },
    }),
  ),
);
for (const action of ["approve", "reject"])
  router.post(
    `/admin/partner-applications/:id/${action}`,
    ...admin,
    run((r) =>
      transaction(async (tx) => {
        const id = parse(uuid, r.params.id),
          row = await tx.partnerApplication.findUnique({ where: { id } });
        if (!row) throw ApiError.notFound();
        if (!["submitted", "need_changes"].includes(row.status))
          throw ApiError.conflict("Đơn đã được xử lý");
        const note =
          action === "reject" ? parse(text, r.body.note) : r.body.note || null;
        const result = await tx.partnerApplication.update({
          where: { id },
          data: {
            status: action === "approve" ? "approved" : "rejected",
            reviewNote: note,
            reviewedBy: r.user.id,
            reviewedAt: new Date(),
          },
        });
        await audit(tx, r.user, action, "PartnerApplication", id);
        await notifyOrg(
          tx,
          row.organizationId,
          "Kết quả đăng ký sự kiện",
          note || "Đơn đăng ký đã được duyệt",
          "/partner/events",
        );
        return result;
      }),
    ),
  );
router.get(
  "/partner/booths",
  ...partner,
  run(async (r) => {
    const org = await organization(r.user.id),
      where = eventFilter(r);
    const booths = await prisma.booth.findMany({
      where: { isDeleted: false },
      include: {
        location: true,
        assignments: {
          where: { ...where, status: "active" },
          include: {
            organization: { select: { id: true, name: true } },
            event: { select: { id: true, title: true } },
          },
        },
        requests: {
          where: { ...where, organizationId: org.id, status: "pending" },
        },
      },
      orderBy: { code: "asc" },
    });
    return booths.map((b) => {
      const a = b.assignments[0];
      return {
        id: b.id,
        code: b.code,
        name: b.name,
        zone: b.location.zone || "",
        areaName: b.areaName || "",
        dimensions: b.dimensions || "",
        status:
          b.opStatus === "unavailable"
            ? "unavailable"
            : a
              ? "assigned"
              : b.requests.length
                ? "on_hold"
                : "available",
        assignedOrgId: a?.organizationId,
        assignedOrgName: a?.organization.name,
        imageUrl: b.imageUrl || "",
        description: b.description || "",
        categories: b.category ? [b.category] : [],
        relatedEventId: a?.eventId || r.query.eventId || "",
        relatedEventTitle: a?.event.title || "",
      };
    });
  }),
);
router.post(
  "/partner/booth-requests",
  ...partner,
  run((r) =>
    transaction(async (tx) => {
      const { eventId, boothId } = parse(
          z.object({ eventId: uuid, boothId: uuid }).strict(),
          r.body,
        ),
        org = await organization(r.user.id, tx),
        event = await openEvent(tx, eventId, "boothRequestDeadline");
      if (
        !(await tx.partnerApplication.findFirst({
          where: { eventId, organizationId: org.id, status: "approved" },
        }))
      )
        throw ApiError.forbidden("Tổ chức chưa được duyệt tham gia");
      const booth = await tx.booth.findFirst({
        where: { id: boothId, isDeleted: false, opStatus: "operational" },
      });
      if (!booth) throw ApiError.notFound("Gian hàng không khả dụng");
      if (
        !(await tx.eventLocation.findUnique({
          where: {
            eventId_locationId: { eventId, locationId: booth.locationId },
          },
        }))
      )
        throw ApiError.validation("Gian hàng chưa được gán cho sự kiện");
      const overlap = {
        event: { startAt: { lt: event.endAt }, endAt: { gt: event.startAt } },
      };
      if (
        (await tx.boothAssignment.findFirst({
          where: { boothId, status: "active", ...overlap },
        })) ||
        (await tx.boothRequest.findFirst({
          where: { boothId, status: "pending", ...overlap },
        }))
      )
        throw ApiError.conflict("Gian hàng đã có yêu cầu hoặc đã được phân bổ");
      const count =
        (await tx.boothAssignment.count({
          where: { eventId, organizationId: org.id, status: "active" },
        })) +
        (await tx.boothRequest.count({
          where: { eventId, organizationId: org.id, status: "pending" },
        }));
      if (count >= (event.settings?.maxBoothsPerPartner || 1))
        throw ApiError.conflict("Đã đạt giới hạn gian hàng");
      const row = await tx.boothRequest.create({
        data: { eventId, boothId, organizationId: org.id },
      });
      await audit(tx, r.user, "create", "BoothRequest", row.id);
      await notifyAdmins(tx, "Yêu cầu đăng ký gian hàng mới", `Đối tác "${org.name}" vừa gửi yêu cầu đăng ký gian hàng ${booth.name} (${booth.code}).`, "/admin?tab=booths");
      return row;
    }),
  ),
);
for (const action of ["approve", "reject"])
  router.post(
    `/admin/booth-requests/:id/${action}`,
    ...admin,
    run((r) =>
      transaction(async (tx) => {
        const id = parse(uuid, r.params.id),
          row = await tx.boothRequest.findUnique({
            where: { id },
            include: { event: true },
          });
        if (!row) throw ApiError.notFound();
        if (row.status !== "pending")
          throw ApiError.conflict("Yêu cầu đã được xử lý");
        if (action === "approve") {
          if (
            await tx.boothAssignment.findFirst({
              where: {
                boothId: row.boothId,
                status: "active",
                event: {
                  startAt: { lt: row.event.endAt },
                  endAt: { gt: row.event.startAt },
                },
              },
            })
          )
            throw ApiError.conflict("Gian hàng đã được phân bổ");
          await tx.boothAssignment.create({
            data: {
              boothId: row.boothId,
              eventId: row.eventId,
              organizationId: row.organizationId,
              assignedBy: r.user.id,
            },
          });
        }
        const note = action === "reject" ? parse(text, r.body.note) : null;
        const result = await tx.boothRequest.update({
          where: { id },
          data: {
            status: action === "approve" ? "approved" : "rejected",
            reviewNote: note,
            reviewedBy: r.user.id,
            reviewedAt: new Date(),
          },
        });
        await notifyOrg(
          tx,
          row.organizationId,
          "Kết quả đăng ký gian hàng",
          note || "Gian hàng đã được phân bổ",
        );
        await audit(tx, r.user, action, "BoothRequest", id);
        return result;
      }),
    ),
  );
async function ownBooth(tx, user, id) {
  const boothId = parse(uuid, id),
    org = await organization(user.id, tx);
  const assigned = await tx.userStallAssignment.findFirst({
    where: { userId: user.id, stallId: boothId },
  });
  const eventAssigned = await tx.boothAssignment.findFirst({
    where: { boothId, organizationId: org.id, status: "active" },
  });
  if (!assigned && !eventAssigned)
    throw ApiError.notFound("Gian hàng không thuộc phạm vi của bạn");
  const booth = await tx.booth.findFirst({
    where: { id: boothId, isDeleted: false },
  });
  if (!booth) throw ApiError.notFound();
  return { booth, assignment: eventAssigned };
}
const content = (b) => ({
  name: b.name,
  description: b.description || "",
  dimensions: b.dimensions || "",
  areaName: b.areaName || "",
  openHours: b.openHours || "08:00 - 22:00",
  imageUrl: b.imageUrl || b.content?.images?.[0]?.url || "",
  categories: b.content?.categories || (b.category ? [b.category] : []),
  images:
    b.content?.images ||
    (b.imageUrl
      ? [{ id: b.id, url: b.imageUrl, caption: b.imageAlt || "" }]
      : []),
  documents: b.content?.documents || [],
});
router.get(
  "/partner/booths/:id/content",
  ...partner,
  run(async (r) =>
    content((await ownBooth(prisma, r.user, r.params.id)).booth),
  ),
);
router.patch(
  "/partner/booths/:id/content",
  ...partner,
  run((r) =>
    transaction(async (tx) => {
      const { booth } = await ownBooth(tx, r.user, r.params.id);
      const data = parse(
        z
          .object({
            name: text.optional(),
            dimensions: z.string().max(40).optional(),
            areaName: z.string().max(80).optional(),
            description: z.string().max(20000).optional(),
            openHours: z.string().max(100).optional(),
            imageUrl: z.string().max(3000000).optional(),
            categories: z.array(text).max(30).optional(),
            images: z
              .array(
                z.object({
                  id: z.string().max(200),
                  url: z.string().max(3000000),
                  caption: z.string().max(200),
                }),
              )
              .max(20)
              .optional(),
            documents: z
              .array(
                z.object({
                  id: z.string().max(200),
                  name: text,
                  size: z.string().max(50),
                  dataUrl: z.string().max(3000000).optional(),
                }),
              )
              .max(20)
              .optional(),
          })
          .strict(),
        r.body,
      );
      const extra = { ...booth.content };
      for (const key of ["categories", "images", "documents"])
        if (data[key] !== undefined) extra[key] = data[key];
      const nextImageUrl =
        data.imageUrl !== undefined
          ? data.imageUrl
          : data.images
          ? data.images[0]?.url || null
          : undefined;
      const result = await tx.booth.update({
        where: { id: booth.id },
        data: {
          name: data.name !== undefined ? data.name : undefined,
          areaName: data.areaName !== undefined ? data.areaName : undefined,
          description: data.description,
          openHours: data.openHours !== undefined ? data.openHours : undefined,
          content: extra,
          ...(nextImageUrl !== undefined
            ? {
                imageUrl: nextImageUrl,
                imageAlt: data.images?.[0]?.caption || booth.imageAlt || null,
              }
            : {}),
        },
      });
      await audit(tx, r.user, "update", "Booth", booth.id);
      return content(result);
    }),
  ),
);
router.patch(
  "/admin/booths/:id/map-position",
  ...admin,
  run((r) =>
    transaction(async (tx) => {
      const id = parse(uuid, r.params.id),
        { x, y } = parse(
          z
            .object({
              x: z.number().min(0).max(100),
              y: z.number().min(0).max(100),
            })
            .strict(),
          r.body,
        );
      const booth = await tx.booth.findFirst({
        where: { id, isDeleted: false },
      });
      if (!booth) throw ApiError.notFound();
      await tx.location.update({
        where: { id: booth.locationId },
        data: { mapX: x, mapY: y },
      });
      await audit(tx, r.user, "update", "Booth", id, { x, y });
      return { id, x, y };
    }),
  ),
);
router.post(
  "/partner/booths/:id/requests",
  ...partner,
  run((r) =>
    transaction(async (tx) => {
      const { assignment } = await ownBooth(tx, r.user, r.params.id);
      if (!assignment)
        throw ApiError.conflict(
          "Gian hàng được phân công cố định; liên hệ Admin để thay đổi",
        );
      const data = parse(
        z
          .object({
            kind: z.enum(["change", "cancellation"]),
            reason: z.string().trim().min(1).max(5000),
            targetBoothId: uuid.optional(),
          })
          .strict(),
        r.body,
      );
      if (data.kind === "change" && !data.targetBoothId)
        throw ApiError.validation("Cần chọn gian hàng đích");
      const model =
        data.kind === "change"
          ? "boothChangeRequest"
          : "boothCancellationRequest";
      const row = await tx[model].create({
        data: {
          ...(data.kind === "change"
            ? {
                currentAssignmentId: assignment.id,
                targetBoothId: data.targetBoothId,
              }
            : { assignmentId: assignment.id }),
          requestedBy: r.user.id,
          reason: data.reason,
        },
      });
      await audit(tx, r.user, "create", model, row.id);
      return row;
    }),
  ),
);
for (const [path, model] of [
  ["booth-change-requests", "boothChangeRequest"],
  ["booth-cancellation-requests", "boothCancellationRequest"],
  ["activity-change-requests", "activityChangeRequest"],
  ["activity-cancellation-requests", "activityCancellationRequest"],
]) {
  router.get(
    `/admin/${path}`,
    ...admin,
    run(() =>
      prisma[model].findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    ),
  );
  router.patch(
    `/admin/${path}/:id/status`,
    ...admin,
    run((r) =>
      transaction(async (tx) => {
        const id = parse(uuid, r.params.id),
          { status, note, replacement } = parse(
            z
              .object({
                status: z.enum(["approved", "rejected"]),
                note: z.string().trim().min(1).max(5000),
                replacement: z
                  .object({
                    locationId: uuid.optional(),
                    startAt: z.string().datetime({ offset: true }).optional(),
                    endAt: z.string().datetime({ offset: true }).optional(),
                  })
                  .optional(),
              })
              .strict(),
            r.body,
          ),
          row = await tx[model].findUnique({ where: { id } });
        if (!row) throw ApiError.notFound();
        if (row.status !== "pending")
          throw ApiError.conflict("Yêu cầu đã được xử lý");
        if (status === "approved") {
          if (model === "boothChangeRequest") {
            const a = await tx.boothAssignment.findUnique({
              where: { id: row.currentAssignmentId },
              include: { event: true },
            });
            if (!a || a.status !== "active")
              throw ApiError.conflict("Phân bổ không còn hoạt động");
            if (
              await tx.boothAssignment.findFirst({
                where: {
                  boothId: row.targetBoothId,
                  status: "active",
                  event: {
                    startAt: { lt: a.event.endAt },
                    endAt: { gt: a.event.startAt },
                  },
                },
              })
            )
              throw ApiError.conflict("Gian hàng đích đã được phân bổ");
            if (
              !(await tx.booth.findFirst({
                where: {
                  id: row.targetBoothId,
                  isDeleted: false,
                  opStatus: "operational",
                },
              }))
            )
              throw ApiError.notFound();
            await tx.boothAssignment.update({
              where: { id: a.id },
              data: {
                status: "released",
                releasedAt: new Date(),
                releaseReason: row.reason,
                qrRevokedAt: new Date(),
              },
            });
            const replacement = await tx.boothAssignment.create({
              data: {
                boothId: row.targetBoothId,
                eventId: a.eventId,
                organizationId: a.organizationId,
                assignedBy: r.user.id,
              },
            });
            await tx[model].update({
              where: { id },
              data: { resultAssignmentId: replacement.id },
            });
          } else if (model === "boothCancellationRequest")
            await tx.boothAssignment.update({
              where: { id: row.assignmentId },
              data: {
                status: "released",
                releasedAt: new Date(),
                releaseReason: row.reason,
                qrRevokedAt: new Date(),
              },
            });
          else if (model === "activityCancellationRequest")
            await tx.activity.update({
              where: { id: row.activityId },
              data: {
                status: "cancelled",
                cancelledAt: new Date(),
                cancelReason: row.reason,
                qrRevokedAt: new Date(),
              },
            });
          else {
            const activity = await tx.activity.findUnique({
              where: { id: row.activityId },
            });
            if (!activity || activity.status === "cancelled")
              throw ApiError.conflict("Hoạt động không còn khả dụng");
            if (
              !replacement &&
              !row.targetLocationId &&
              !row.newStartAt &&
              !row.newEndAt
            )
              throw ApiError.validation(
                "Cần cung cấp lịch hoặc địa điểm thay thế",
              );
            const data = await checkSchedule(
              tx,
              {
                ...activity,
                locationId:
                  replacement?.locationId ||
                  row.targetLocationId ||
                  activity.locationId,
                startAt:
                  replacement?.startAt || row.newStartAt || activity.startAt,
                endAt: replacement?.endAt || row.newEndAt || activity.endAt,
              },
              activity.id,
            );
            await tx.activity.update({
              where: { id: activity.id },
              data: {
                locationId: data.locationId,
                startAt: data.startAt,
                endAt: data.endAt,
              },
            });
          }
        }
        const result = await tx[model].update({
          where: { id },
          data: {
            status,
            reviewNote: note,
            reviewedBy: r.user.id,
            reviewedAt: new Date(),
          },
        });
        await audit(tx, r.user, status, model, id);
        return result;
      }),
    ),
  );
}
export default router;
