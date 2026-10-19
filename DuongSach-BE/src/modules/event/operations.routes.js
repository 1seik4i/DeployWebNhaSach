import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
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
  quantity,
  text,
  transaction,
  uuid,
} from "../../utils/contract.js";
import { ProposalService } from "../proposal/proposal.service.js";
import { eventTiming } from "./event-time.js";
import { publicEventWhere } from "./visibility.js";
import { eventImageInput, proposalMetadata } from '../../utils/eventImage.js';
import { checkIndependentSchedule } from './independent-event.js';

const router = Router(),
  admin = [authenticate, authorize("admin")],
  partner = [authenticate, authorize("partner")];
const run = (fn) =>
  asyncHandler(async (r, s) => ApiResponse.success(s, await fn(r)));
const eventFilter = (r) =>
  r.query.eventId ? { eventId: parse(uuid, r.query.eventId) } : {};
const activityInput = z.object({
  eventId: uuid,
  title: text,
  titleEn: text.optional(),
  kind: z.enum([
    "talkshow",
    "workshop",
    "launch",
    "exhibition",
    "minigame",
    "signing",
  ]),
  locationId: uuid,
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
  capacity: quantity.optional().default(1),
  description: z.string().max(20000).optional(),
  speaker: text.optional(),
  imageUrl: eventImageInput,
});
export async function checkSchedule(tx, data) {
  const event = await tx.event.findFirst({
    where: { id: data.eventId, isDeleted: false },
  });
  const location = await tx.location.findFirst({
    where: { id: data.locationId, isDeleted: false },
  });
  if (!event || !location)
    throw ApiError.notFound("Không tìm thấy sự kiện hoặc địa điểm");
  const startAt = new Date(data.startAt),
    endAt = new Date(data.endAt);
  if (
    startAt >= endAt ||
    startAt < event.startAt ||
    endAt > event.endAt
  )
    throw ApiError.validation(
      "Thời gian không phù hợp với sự kiện",
    );
  if (
    !(await tx.eventLocation.findUnique({
      where: {
        eventId_locationId: { eventId: event.id, locationId: location.id },
      },
    }))
  )
    throw ApiError.validation("Địa điểm chưa được gán cho sự kiện");
  return { ...data, startAt, endAt };
}
for (const role of ["admin", "partner"])
  router.get(
    `/${role}/event-locations`,
    authenticate,
    authorize(role),
    run(async (r) => {
      const rows = await prisma.location.findMany({
        where: {
          isDeleted: false,
          ...(r.query.eventId
            ? {
                eventLocations: {
                  some: { eventId: parse(uuid, r.query.eventId) },
                },
              }
            : {}),
        },
        orderBy: { name: "asc" },
      });
      return rows.map((l) => ({
        id: l.id,
        name: l.name,
        capacity: l.capacity,
      }));
    }),
  );
router.put(
  "/admin/events/:id/locations",
  ...admin,
  run((r) =>
    transaction(async (tx) => {
      const eventId = parse(uuid, r.params.id),
        { locationIds } = parse(
          z.object({ locationIds: z.array(uuid).max(100) }).strict(),
          r.body,
        );
      await tx.eventLocation.deleteMany({ where: { eventId } });
      await tx.eventLocation.createMany({
        data: [...new Set(locationIds)].map((locationId) => ({
          eventId,
          locationId,
        })),
      });
      await audit(tx, r.user, "update", "Event", eventId, { locationIds });
      return { success: true };
    }),
  ),
);
router.put(
  "/admin/events/:id/settings",
  ...admin,
  run((r) =>
    transaction(async (tx) => {
      const eventId = parse(uuid, r.params.id);
      const event = await tx.event.findFirst({ where: { id: eventId, isDeleted: false } });
      if (!event) throw ApiError.notFound();
      const input = parse(
        z.object({
          boothRequestDeadline: z.string().date().nullable().optional(),
          proposalDeadline: z.string().date().nullable().optional(),
          participantRegDeadline: z.string().date().nullable().optional(),
          boothCancelCutoff: z.string().date().nullable().optional(),
        }).strict(),
        r.body,
      );
      const toDeadline = (value) => value ? new Date(`${value}T23:59:59+07:00`) : null;
      const data = {
        ...(input.boothRequestDeadline !== undefined ? { boothRequestDeadline: toDeadline(input.boothRequestDeadline) } : {}),
        ...(input.proposalDeadline !== undefined ? { proposalDeadline: toDeadline(input.proposalDeadline) } : {}),
        ...(input.participantRegDeadline !== undefined ? { participantRegDeadline: toDeadline(input.participantRegDeadline) } : {}),
        ...(input.boothCancelCutoff !== undefined ? { boothCancelCutoff: toDeadline(input.boothCancelCutoff) } : {}),
      };
      const settings = await tx.eventSettings.upsert({
        where: { eventId },
        create: { eventId, ...data },
        update: data,
      });
      await audit(tx, r.user, "update", "EventSettings", eventId, input);
      return settings;
    }),
  ),
);
for (const action of [
  "publish",
  "unpublish",
  "cancel",
  "duplicate",
  "broadcast",
])
  router.post(
    `/admin/events/:id/${action}`,
    ...admin,
    run((r) =>
      transaction(async (tx) => {
        const id = parse(uuid, r.params.id),
          event = await tx.event.findFirst({ where: { id, isDeleted: false } });
        if (!event) throw ApiError.notFound();
        if (action === "broadcast") {
          const { message } = parse(
            z.object({ message: z.string().trim().min(1).max(5000) }),
            r.body,
          );
          const members = await tx.organizationMember.findMany({
            where: {
              organization: {
                applications: { some: { eventId: id, status: "approved" } },
              },
            },
          });
          const registrations = await tx.eventRegistration.findMany({
            where: { eventId: id, leftAt: null },
            select: { userId: true },
          });
          const ids = [
            ...new Set([...members, ...registrations].map((m) => m.userId)),
          ];
          await tx.notification.createMany({
            data: ids.map((userId) => ({
              userId,
              title: event.title,
              message,
              kind: "event",
            })),
          });
          await audit(tx, r.user, "broadcast", "Event", id);
          return { sent: ids.length };
        }
        if (action === "duplicate") {
          const {
            id: oldId,
            createdAt,
            updatedAt,
            slug,
            publishedAt,
            cancelledAt,
            cancelReason,
            ...data
          } = event;
          const copy = await tx.event.create({
            data: {
              ...data,
              title: `${event.title.slice(0, 185)} (bản sao)`,
              slug: `${slug.slice(0, 150)}-${crypto.randomUUID()}`,
              status: "draft",
              createdBy: r.user.id,
              visibility: "internal",
              publicUntil: null,
            },
          });
          const locations = await tx.eventLocation.findMany({
            where: { eventId: id },
          });
          await tx.eventLocation.createMany({
            data: locations.map((l) => ({
              eventId: copy.id,
              locationId: l.locationId,
            })),
          });
          await audit(tx, r.user, "create", "Event", copy.id);
          return copy;
        }
        if (event.status === "cancelled")
          throw ApiError.conflict("Sự kiện đã hủy");
        const data =
          action === "publish"
            ? { status: "published", publishedAt: new Date(), visibility: "public" }
            : action === "unpublish"
              ? { status: "draft", visibility: "internal" }
              : {
                  status: "cancelled",
                  cancelledAt: new Date(),
                  cancelReason: parse(text, r.body.reason),
                };
        const row = await tx.event.update({ where: { id }, data });
        await audit(tx, r.user, action, "Event", id);
        return row;
      }),
    ),
  );
router.get(
  "/admin/activities",
  ...admin,
  run((r) =>
    prisma.activity.findMany({
      where: eventFilter(r),
      include: {
        location: true,
        organization: true,
        _count: { select: { attendanceSessions: true } },
      },
      orderBy: { startAt: "asc" },
    }),
  ),
);
router.post(
  "/admin/activities",
  ...admin,
  run((r) =>
    transaction(async (tx) => {
      const data = await checkSchedule(
        tx,
        parse(activityInput.strict(), r.body),
      );
      const row = await tx.activity.create({
        data: { ...data, status: "draft", createdBy: r.user.id },
      });
      await audit(tx, r.user, "create", "Activity", row.id);
      return row;
    }),
  ),
);
router.patch(
  "/admin/activities/:id",
  ...admin,
  run((r) =>
    transaction(async (tx) => {
      const id = parse(uuid, r.params.id),
        old = await tx.activity.findUnique({ where: { id } });
      if (!old) throw ApiError.notFound();
      const input = parse(
        activityInput.omit({ eventId: true }).partial().strict(),
        r.body,
      );
      const checked = await checkSchedule(tx, { ...old, ...input });
      const row = await tx.activity.update({
        where: { id },
        data: { ...input, startAt: checked.startAt, endAt: checked.endAt },
      });
      await audit(tx, r.user, "update", "Activity", id);
      return row;
    }),
  ),
);
router.delete(
  "/admin/activities/:id",
  ...admin,
  run((r) =>
    transaction(async (tx) => {
      const id = parse(uuid, r.params.id);
      const activity = await tx.activity.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              registrations: true,
              attendanceSessions: true,
              attendances: true,
              ratings: true,
            },
          },
        },
      });
      if (!activity) throw ApiError.notFound();

      const hasParticipantHistory = Object.values(activity._count).some(
        (count) => count > 0,
      );
      if (hasParticipantHistory)
        throw ApiError.conflict(
          "Không thể xóa hoạt động đã có đăng ký, điểm danh hoặc đánh giá",
        );

      await tx.activityChangeRequest.deleteMany({ where: { activityId: id } });
      await tx.activityCancellationRequest.deleteMany({ where: { activityId: id } });
      if (activity.proposalId)
        await tx.activityProposal.updateMany({
          where: { id: activity.proposalId, publishedActivityId: id },
          data: { publishedActivityId: null },
        });
      await tx.activity.delete({ where: { id } });
      await audit(tx, r.user, "delete", "Activity", id, {
        title: activity.title,
      });
      return { id, deleted: true };
    }),
  ),
);
router.post(
  "/admin/activities/:id/publish",
  ...admin,
  run((r) =>
    transaction(async (tx) => {
      const id = parse(uuid, r.params.id),
        old = await tx.activity.findUnique({ where: { id } });
      if (!old) throw ApiError.notFound();
      if (!["draft", "approved"].includes(old.status))
        throw ApiError.conflict(
          "Không thể công bố hoạt động ở trạng thái hiện tại",
        );
      await checkSchedule(tx, old);
      const row = await tx.activity.update({
        where: { id },
        data: { status: "published", publishedAt: new Date() },
      });
      await audit(tx, r.user, "publish", "Activity", id);
      return row;
    }),
  ),
);
router.get(
  "/admin/activity-proposals",
  ...admin,
  run(async (r) => (await ProposalService.list(r.query)).data),
);
router.delete(
  "/admin/activity-proposals/:id",
  ...admin,
  run((r) =>
    transaction(async (tx) => {
      const id = parse(uuid, r.params.id);
      const proposal = await tx.activityProposal.findUnique({
        where: { id },
        include: {
          activities: {
            include: {
              _count: {
                select: {
                  registrations: true,
                  attendanceSessions: true,
                  attendances: true,
                  ratings: true,
                },
              },
            },
          },
        },
      });
      if (!proposal) throw ApiError.notFound();

      if (proposal.activities.some((activity) => Object.values(activity._count).some((count) => count > 0))) {
        throw ApiError.conflict("Không thể xóa đề xuất đã có đăng ký, điểm danh hoặc đánh giá");
      }

      for (const activity of proposal.activities) {
        await tx.activityChangeRequest.deleteMany({ where: { activityId: activity.id } });
        await tx.activityCancellationRequest.deleteMany({ where: { activityId: activity.id } });
      }
      await tx.activity.deleteMany({ where: { proposalId: id } });
      await tx.activityReview.deleteMany({ where: { proposalId: id } });
      await tx.proposalDevice.deleteMany({ where: { proposalId: id } });
      await tx.activityProposal.delete({ where: { id } });
      await audit(tx, r.user, "delete", "ActivityProposal", id, { title: proposal.title });
      return { id, deleted: true };
    }),
  ),
);
router.post(
  "/admin/activity-proposals/:id/create-activity",
  ...admin,
  run((r) =>
    transaction(async (tx) => {
      const id = parse(uuid, r.params.id),
        proposal = await tx.activityProposal.findUnique({ where: { id } });
      if (!proposal) throw ApiError.notFound();
      if (
        proposal.status !== "approved" ||
        (await tx.activity.findFirst({ where: { proposalId: id } }))
      )
        throw ApiError.conflict("Đề xuất chưa duyệt hoặc đã có hoạt động");
      const {
        eventId,
        title,
        titleEn,
        kind,
        locationId,
        startAt,
        endAt,
        capacity,
        description,
        speaker,
        organizationId,
      } = proposal;
      await checkSchedule(tx, proposal);
      const row = await tx.activity.create({
        data: {
          eventId,
          title,
          titleEn,
          kind,
          locationId,
          startAt,
          endAt,
          capacity,
          description,
          speaker,
          organizationId,
          proposalId: id,
          imageUrl: proposalMetadata(proposal.managementNotes).imageUrl || null,
          status: "draft",
          createdBy: r.user.id,
        },
      });
      await tx.activityProposal.update({
        where: { id },
        data: { publishedActivityId: row.id },
      });
      await audit(tx, r.user, "create", "Activity", row.id);
      return row;
    }),
  ),
);
for (const [action, method] of [
  ["approve", "approve"],
  ["reject", "reject"],
  ["request-supplement", "requestSupplement"],
])
  router.post(
    `/admin/activity-proposals/:id/${action}`,
    ...admin,
    run((r) => {
      parse(uuid, r.params.id);
      if (action === "request-supplement") parse(text, r.body.note);
      return ProposalService[method](r.params.id, r.body, r.user);
    }),
  );
router.get(
  "/partner/assets",
  ...partner,
  run(() =>
    prisma.asset.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, totalQuantity: true },
    }),
  ),
);
router.get(
  "/partner/schedule",
  ...partner,
  run(async (r) => {
    const org = await organization(r.user.id);
    const publicWhere = await publicEventWhere();
    const [events, activities] = await Promise.all([
      prisma.event.findMany({
        where: {
          ...publicWhere,
          ...(r.query.eventId ? { id: parse(uuid, r.query.eventId) } : {}),
        },
        include: { venue: true },
        orderBy: { startAt: "asc" },
      }),
      prisma.activity.findMany({
        where: {
          organizationId: org.id,
          status: { not: "cancelled" },
          ...eventFilter(r),
        },
        include: { event: true, location: true },
        orderBy: { startAt: "asc" },
      }),
    ]);
    const base = (item, id, location, categoryTag, imageUrl) => {
      const timing = eventTiming(item);
      return ({
      id,
      title: item.title,
      titleEn: item.titleEn || undefined,
      theme: item.theme || undefined,
      dateRange: timing.dateRange,
      startDate: timing.startDate,
      endDate: timing.endDate,
      startAt: item.startAt,
      endAt: item.endAt,
      location: location || "",
      status: timing.displayStatus,
      statusLabelVi: timing.statusLabelVi,
      isOngoingToday: timing.isOngoingToday,
      imageUrl: imageUrl || "",
      description: item.description || "",
      boothOccupancy: "0",
      boothsCount: 0,
      maxBooths: 0,
      activitiesCount: 0,
      registrationsCount: 0,
      attendanceRate: 0,
      averageRating: 0,
      isPublished: true,
      timeStr: timing.timeStr,
      badgeColor: timing.displayStatus === "happening" ? "#047857" : "#0E7490",
      categoryTag,
    });
    };
    return [
      ...events.map((event) =>
        base(
          event,
          `event:${event.id}`,
          event.venue?.name,
          event.theme || "Sự kiện",
          event.coverImageUrl,
        ),
      ),
      ...activities.filter(activity => !events.some(event =>
        event.id === activity.eventId && event.title === activity.title &&
        new Date(event.startAt).getTime() === new Date(activity.startAt).getTime() &&
        new Date(event.endAt).getTime() === new Date(activity.endAt).getTime()
      )).map((activity) => ({
        ...base(
          activity,
          `act:${activity.id}`,
          activity.location?.name,
          activity.kind,
          activity.imageUrl || activity.event?.coverImageUrl,
        ),
        hostOrgName: org.name,
        speaker: activity.speaker || undefined,
        expectedAttendees: String(activity.capacity),
      })),
    ].sort((a, b) => {
      const priority = { happening: 0, upcoming: 1, completed: 2 };
      return (priority[a.status] ?? 3) - (priority[b.status] ?? 3)
        || new Date(a.startAt) - new Date(b.startAt);
    });
  }),
);
const proposalInclude = {
  event: {
    include: {
      registrations: {
        include: { user: { select: { id: true, fullName: true, phone: true } } },
      },
      publicRegistrations: true,
    },
  },
  location: true,
  devices: true,
  organization: {
    include: {
      boothAssignments: {
        include: { booth: true },
      },
    },
  },
};
const mapProposal = (p) => {
  // A proposal may only display the booth assigned to this organization in
  // the same event. Never fall back to a booth from another event.
  const boothAssignment = p.organization?.boothAssignments?.find(
    (ba) => ba.eventId === p.eventId && ba.status === "active",
  );
  const booth = boothAssignment?.booth;
  const startTime = p.startAt
    ? p.startAt.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" })
    : "";
  const endTime = p.endAt
    ? p.endAt.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" })
    : "";
  let meta = {};
  try {
    if (p.managementNotes?.startsWith("{")) meta = JSON.parse(p.managementNotes);
  } catch {}
  return {
    ...p,
    category: p.kind ? p.kind.charAt(0).toUpperCase() + p.kind.slice(1) : "Workshop",
    date: p.startAt ? p.startAt.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "",
    time: startTime && endTime ? `${startTime} – ${endTime}` : "",
    duration: p.startAt && p.endAt ? `${Math.round((p.endAt - p.startAt) / 60000)} phút` : "",
    location: p.location?.name || "",
    eventName: p.event?.title || "",
    registeredCount: (p.event?.registrations?.length || 0) + (p.event?.publicRegistrations || []).reduce((sum, row) => sum + row.attendeesCount, 0),
    requiredEquipments: p.devices?.map((d) => d.name) || [],
    imageUrl: meta.imageUrl || p.imageUrl || p.event?.coverImageUrl || "",
    boothCode: booth?.code || "",
    boothName: booth?.name || "",
    orgName: p.organization?.name || "",
    schedule: meta.schedule || [
      { id: "1", time: `${startTime || "09:00"} – ${endTime || "10:30"}`, title: p.title, description: p.description || "", speaker: p.speaker || "" },
    ],
    documents: meta.documents || [],
  };
};
router.get(
  "/partner/activity-proposals",
  ...partner,
  run(async (r) => {
    const org = await organization(r.user.id);
    return (
      await prisma.activityProposal.findMany({
        where: { organizationId: org.id, ...eventFilter(r) },
        include: proposalInclude,
        orderBy: [{ updatedAt: "desc" }, { submittedAt: "desc" }],
      })
    ).map(mapProposal);
  }),
);
const proposalInput = activityInput.extend({
  targetAudience: z.string().max(2000).optional(),
  contactPerson: text.optional(),
  contactPhone: z.string().max(20).optional(),
  devices: z
    .array(
      z.object({ assetId: uuid.optional(), name: text, quantity: quantity }),
    )
    .max(100)
    .optional(),
});
async function saveProposal(r, id) {
  return transaction(async (tx) => {
    const org = await organization(r.user.id, tx),
      old = id
        ? await tx.activityProposal.findFirst({
            where: { id: parse(uuid, id), organizationId: org.id },
            include: proposalInclude,
          })
        : null;
    if (id && !old) throw ApiError.notFound();
    const { devices, schedule, documents, ...input } = r.body || {};
    const cleanInput = parse(
      id
        ? proposalInput.omit({ eventId: true }).partial()
        : proposalInput,
      { ...input, ...(devices ? { devices } : {}) },
    );
    const checked = old && proposalMetadata(old.managementNotes).standaloneEvent
      ? await checkIndependentSchedule(tx, { ...old, ...cleanInput })
      : await checkSchedule(tx, { ...old, ...cleanInput });
    if (!id) {
      const settings = await tx.eventSettings.findUnique({
        where: { eventId: checked.eventId },
      });
      if (settings?.proposalDeadline && settings.proposalDeadline < new Date())
        throw ApiError.conflict("Đã hết hạn đề xuất");
      if (
        !(await tx.partnerApplication.findFirst({
          where: {
            organizationId: org.id,
            eventId: checked.eventId,
            status: "approved",
          },
        }))
      )
        throw ApiError.forbidden("Tổ chức chưa được duyệt tham gia sự kiện");
    }

    let meta = {};
    try {
      if (old?.managementNotes?.startsWith("{")) meta = JSON.parse(old.managementNotes);
    } catch {}
    if (cleanInput.imageUrl !== undefined) meta.imageUrl = cleanInput.imageUrl;
    if (schedule !== undefined) meta.schedule = parse(z.array(z.object({
      id: text, time: text, title: text, description: z.string().max(20000).optional(), speaker: z.string().max(200).optional(),
    }).strict()).max(500), schedule);
    if (documents !== undefined) meta.documents = parse(z.array(z.object({
      id: text, name: text, size: z.string().max(100).optional().default(''), uploadedAt: z.string().max(100).optional(),
      url: z.string().max(10000000).refine(value => {
        try { if (['https:', 'http:'].includes(new URL(value).protocol)) return true; } catch {}
        return /^data:(application\/(pdf|zip|octet-stream|msword|vnd\.[a-z0-9.+-]+)|image\/(png|jpeg|webp|gif)|text\/plain);base64,[A-Za-z0-9+/=\r\n]+$/i.test(value);
      }, 'Liên kết tài liệu không hợp lệ').optional(),
    }).strict()).max(100), documents);

    const data = {
      ...(cleanInput.title !== undefined ? { title: cleanInput.title } : {}),
      ...(cleanInput.titleEn !== undefined ? { titleEn: cleanInput.titleEn } : {}),
      ...(cleanInput.description !== undefined ? { description: cleanInput.description } : {}),
      ...(cleanInput.capacity !== undefined ? { capacity: cleanInput.capacity } : {}),
      ...(cleanInput.targetAudience !== undefined ? { targetAudience: cleanInput.targetAudience } : {}),
      ...(cleanInput.speaker !== undefined ? { speaker: cleanInput.speaker } : {}),
      ...(cleanInput.contactPerson !== undefined ? { contactPerson: cleanInput.contactPerson } : {}),
      ...(cleanInput.contactPhone !== undefined ? { contactPhone: cleanInput.contactPhone } : {}),
      ...(cleanInput.locationId !== undefined ? { locationId: cleanInput.locationId } : {}),
      ...(cleanInput.kind !== undefined ? { kind: cleanInput.kind } : {}),
      ...(checked.startAt ? { startAt: checked.startAt } : {}),
      ...(checked.endAt ? { endAt: checked.endAt } : {}),
      status: old?.status === 'need_revision' ? 'pending' : old ? old.status : "pending",
      ...(Object.keys(meta).length > 0 ? { managementNotes: JSON.stringify(meta) } : {}),
      ...(devices
        ? { devices: { ...(id ? { deleteMany: {} } : {}), create: devices } }
        : {}),
    };
    const row = id
      ? await tx.activityProposal.update({
          where: { id },
          data,
          include: proposalInclude,
        })
      : await tx.activityProposal.create({
          data: { ...data, eventId: checked.eventId, organizationId: org.id },
          include: proposalInclude,
        });
    if (old?.publishedActivityId) {
      await tx.activity.update({ where: { id: old.publishedActivityId }, data: {
        title: row.title, titleEn: row.titleEn, description: row.description, speaker: row.speaker,
        ...(cleanInput.imageUrl !== undefined ? { imageUrl: cleanInput.imageUrl } : {}),
        startAt: row.startAt, endAt: row.endAt, locationId: row.locationId, capacity: row.capacity,
      } });
    }
    await audit(
      tx,
      r.user,
      id ? "update" : "create",
      "ActivityProposal",
      row.id,
    );
    const adminUsers = await tx.user.findMany({
      where: {
        isDeleted: false,
        OR: [
          { primaryRole: "admin" },
          { userRoles: { some: { role: { code: "admin" } } } },
        ],
      },
      select: { id: true },
    });
    if (adminUsers.length > 0) {
      await tx.notification.createMany({
        data: adminUsers.map((a) => ({
          userId: a.id,
          title: id ? "Đề xuất hoạt động cập nhật" : "Đề xuất hoạt động mới",
          message: `Đối tác "${org.name}" vừa ${id ? "cập nhật" : "gửi"} đề xuất hoạt động "${row.title}".`,
          kind: "system",
          link: "/admin?tab=activities",
        })),
      });
    }
    return mapProposal(row);
  });
}
router.post(
  "/partner/activity-proposals",
  ...partner,
  run((r) => saveProposal(r)),
);
router.patch(
  "/partner/activity-proposals/:id",
  ...partner,
  run((r) => saveProposal(r, r.params.id)),
);
router.get(
  "/partner/activity-proposals/:id/participants",
  ...partner,
  run(async (r) => {
    const org = await organization(r.user.id),
      p = await prisma.activityProposal.findFirst({
        where: { id: parse(uuid, r.params.id), organizationId: org.id },
      });
    if (!p) throw ApiError.notFound();
    const [actRows, eventRows, publicRows] = await Promise.all([
      prisma.activityRegistration.findMany({
        where: { activity: { proposalId: p.id, organizationId: org.id } },
        include: { user: { select: { id: true, fullName: true, phone: true } } },
      }),
      p.eventId
        ? prisma.eventRegistration.findMany({
            where: { eventId: p.eventId },
            include: { user: { select: { id: true, fullName: true, phone: true } } },
            orderBy: { joinedAt: "desc" },
          })
        : [],
      p.eventId ? prisma.publicEventRegistration.findMany({ where: { eventId: p.eventId }, orderBy: { createdAt: 'desc' } }) : [],
    ]);
    const items = [];
    const seenUsers = new Set();
    for (const x of actRows) {
      if (x.user) {
        seenUsers.add(x.userId);
        items.push({
          id: x.id,
          fullName: x.user.fullName,
          phone: x.user.phone || "",
          ticketCode: x.registrationCode,
          status: x.status,
        });
      }
    }
    for (const x of eventRows) {
      if (x.user && !seenUsers.has(x.userId)) {
        seenUsers.add(x.userId);
        items.push({
          id: x.id,
          fullName: x.user.fullName,
          phone: x.user.phone || "",
          ticketCode: `EVT-${x.id.slice(0, 8).toUpperCase()}`,
          status: x.leftAt ? "attended" : "registered",
        });
      }
    }
    return [...items.map(row => ({ ...row, attendeesCount: 1 })), ...publicRows.map(row => ({ id: row.id, fullName: row.fullName, phone: row.phone, ticketCode: row.registrationCode, status: 'registered', attendeesCount: row.attendeesCount }))];
  }),
);
router.post(
  "/partner/activity-proposals/:id/requests",
  ...partner,
  run((r) =>
    transaction(async (tx) => {
      const org = await organization(r.user.id, tx),
        id = parse(uuid, r.params.id),
        data = parse(
          z
            .object({
              kind: z.enum(["change", "cancellation"]),
              reason: z.string().trim().min(1).max(5000),
            })
            .strict(),
          r.body,
        );
      const p = await tx.activityProposal.findFirst({
        where: { id, organizationId: org.id },
      });
      if (!p) throw ApiError.notFound();
      const activity = await tx.activity.findFirst({
        where: { proposalId: id, organizationId: org.id },
      });
      if (!activity)
        throw ApiError.conflict(
          "Đề xuất chưa tạo hoạt động; hãy sửa đề xuất trực tiếp",
        );
      const model =
        data.kind === "change"
          ? "activityChangeRequest"
          : "activityCancellationRequest";
      if (
        await tx[model].findFirst({
          where: { activityId: activity.id, status: "pending" },
        })
      )
        throw ApiError.conflict("Đã có yêu cầu đang chờ");
      const row = await tx[model].create({
        data: {
          activityId: activity.id,
          requestedBy: r.user.id,
          reason: data.reason,
        },
      });
      await audit(tx, r.user, "create", model, row.id);
      return row;
    }),
  ),
);
export default router;
