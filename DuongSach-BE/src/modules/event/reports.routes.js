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
  transaction,
  uuid,
} from "../../utils/contract.js";
const router = Router();
const run = (fn) =>
  asyncHandler(async (r, s) => ApiResponse.success(s, await fn(r)));
for (const role of ["admin", "partner"])
  router.get(
    `/${role}/reports`,
    authenticate,
    authorize(role),
    run(async (r) => {
      const org = role === "partner" ? await organization(r.user.id) : null,
        eventId = r.query.eventId ? parse(uuid, r.query.eventId) : undefined;
      const partnerEvents = org ? await prisma.event.findMany({
        where: { isDeleted: false, status: { not: 'draft' }, OR: [
          { applications: { some: { organizationId: org.id, status: 'approved' } } },
          { proposals: { some: { organizationId: org.id, status: 'approved' } } },
        ] },
        select: { id: true, title: true }, orderBy: { startAt: 'desc' },
      }) : null;
      if (org && eventId && !partnerEvents.some(event => event.id === eventId)) {
        throw ApiError.forbidden('Chỉ được xem báo cáo sự kiện của đối tác đã được duyệt');
      }
      const activities = await prisma.activity.findMany({
        where: {
          ...(org ? { organizationId: org.id } : {}),
          ...(eventId ? { eventId } : org ? { eventId: { in: partnerEvents.map(event => event.id) } } : {}),
        },
        include: {
          registrations: { select: { status: true } },
          ratings: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              user: { select: { fullName: true } },
            },
          },
        },
      });
      const registrations = activities.flatMap((a) => a.registrations),
        activityRatings = activities.flatMap((activity) =>
          activity.ratings.map((rating) => ({
            id: rating.id,
            rating: rating.rating,
            comment: rating.comment,
            createdAt: rating.createdAt,
            authorName: rating.user.fullName,
            activityName: activity.title,
            source: "activity",
          })),
        ),
        attended = registrations.filter((a) => a.status === "attended").length;
      const event = eventId
        ? await prisma.event.findUnique({ where: { id: eventId } })
        : null;
      const accessibleEvents = partnerEvents || (eventId ? [] : await prisma.event.findMany({
        where: { isDeleted: false, ...(org ? { applications: { some: { organizationId: org.id, status: 'approved' } } } : {}) },
        select: { id: true },
      }));
      const reportEventIds = eventId ? [eventId] : [...new Set([...activities.map(activity => activity.eventId), ...accessibleEvents.map(row => row.id)])];
      const publicTotals = await prisma.publicEventRegistration.aggregate({ where: { eventId: { in: reportEventIds } }, _sum: { attendeesCount: true } });
      const publicParticipants = publicTotals._sum.attendeesCount || 0;
      const eventRatings = reportEventIds.length
        ? await prisma.feedback.findMany({
            where: { eventId: { in: reportEventIds } },
            select: { id: true, rating: true, comments: true, fullName: true, createdAt: true },
            orderBy: { createdAt: "desc" },
          })
        : [];
      const feedbacks = [
        ...activityRatings,
        ...eventRatings.map((feedback) => ({
          id: feedback.id,
          rating: feedback.rating,
          comment: feedback.comments,
          createdAt: feedback.createdAt,
          authorName: feedback.fullName,
          activityName: null,
          source: "event",
        })),
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const ratings = feedbacks.map((feedback) => feedback.rating);
      return {
        ...(org ? { availableEvents: partnerEvents } : {}),
        eventId: eventId || "",
        eventName: event?.title || "Tất cả sự kiện",
        totalParticipants: registrations.length + publicParticipants,
        attended,
        pending: registrations.filter((a) => a.status === "registered").length + publicParticipants,
        cancelled: registrations.filter((a) => a.status === "cancelled").length,
        totalActivities: activities.length,
        totalBooths: await prisma.boothAssignment.count({
          where: {
            status: "active",
            ...(org ? { organizationId: org.id } : {}),
            ...(eventId ? { eventId } : {}),
            ...(org && !eventId ? { eventId: { in: partnerEvents.map(event => event.id) } } : {}),
          },
        }),
        attendanceRate: registrations.length + publicParticipants
          ? Number(((100 * attended) / (registrations.length + publicParticipants)).toFixed(2))
          : 0,
        averageRating: ratings.length
          ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(2))
          : 0,
        ratingCount: ratings.length,
        activityStats: activities.map((a) => ({
          name: a.title,
          count: a.registrations.length,
        })),
        ratingDistribution: [5, 4, 3, 2, 1].map((stars) => {
          const count = ratings.filter((rating) => rating === stars).length;
          return {
            stars: role === "partner" ? String(stars) : stars,
            count,
            percent: ratings.length ? Number(((100 * count) / ratings.length).toFixed(2)) : 0,
          };
        }),
        feedbacks: feedbacks.map((feedback) => ({
          ...feedback,
          createdAt: feedback.createdAt.toISOString(),
        })),
      };
    }),
  );
router.post(
  "/partner/attendance/scan",
  authenticate,
  authorize("partner"),
  run((r) =>
    transaction(async (tx) => {
      const { qrToken } = parse(z.object({ qrToken: uuid }).strict(), r.body),
        org = await organization(r.user.id, tx);
      const registration = await tx.activityRegistration.findUnique({
        where: { qrToken },
        include: {
          activity: { include: { event: true } },
          user: { select: { fullName: true, status: true, isDeleted: true } },
        },
      });
      if (!registration || registration.activity.organizationId !== org.id)
        throw ApiError.notFound("Không tìm thấy vé trong phạm vi tổ chức");
      const a = registration.activity,
        now = new Date();
      if (
        registration.user.isDeleted ||
        registration.user.status !== "active" ||
        a.event.isDeleted ||
        !["published", "ongoing"].includes(a.event.status) ||
        registration.qrRevokedAt ||
        registration.status === "cancelled" ||
        a.qrRevokedAt ||
        !["published", "ongoing"].includes(a.status) ||
        now < a.startAt ||
        now > a.endAt
      )
        throw ApiError.conflict("Vé hoặc thời gian điểm danh không hợp lệ");
      const existing = await tx.attendance.findUnique({
        where: { registrationId: registration.id },
      });
      if (!existing) {
        await tx.attendance.create({
          data: {
            registrationId: registration.id,
            activityId: a.id,
            userId: registration.userId,
          },
        });
        await tx.activityRegistration.update({
          where: { id: registration.id },
          data: { status: "attended" },
        });
        await audit(
          tx,
          r.user,
          "checkin",
          "ActivityRegistration",
          registration.id,
        );
      }
      return {
        id: registration.id,
        activityId: a.id,
        activityTitle: a.title,
        participantName: registration.user.fullName,
        ticketCode: registration.registrationCode,
        scanTime: now.toISOString(),
        status: existing ? "already_scanned" : "success",
      };
    }),
  ),
);
export default router;
