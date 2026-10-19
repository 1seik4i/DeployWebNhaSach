import { Router } from "express";
import { imageSource, supportPhone, queryInteger } from '../../utils/input.validation.js';
import { managedContentData } from './content.validation.js';
import { z } from "zod";
import { prisma } from "../../config/database.js";
import { authenticate } from "../../middlewares/auth.js";
import { authorize } from "../../middlewares/rbac.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { isFeedbackContact } from "../../utils/feedbackContact.js";
import { audit, parse, text, transaction, uuid } from "../../utils/contract.js";
import {
  decorateContentWithReadCounts,
  recordNewsArticleRead,
} from "./content-analytics.service.js";
import { getLiveOnlineCount, setVisitStatsProvider, broadcastVisitStats } from "../../services/websocket.service.js";

const router = Router(),
  admin = [authenticate, authorize("admin")];
const run = (fn) =>
  asyncHandler(async (r, s) => ApiResponse.success(s, await fn(r)));
const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
function vietnamDateParts(value = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: VIETNAM_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}
function databaseDate(year, month, day = 1) {
  return new Date(Date.UTC(year, month - 1, day));
}
const publicLimits = new Map();
function limit(r, s, next) {
  const now = Date.now(),
    key = `${r.ip}:${r.route?.path || r.path}:${uuid.safeParse(r.body?.sessionId).success ? r.body.sessionId : ''}`;
  let row = publicLimits.get(key);
  if (!row || row.until < now) {
    row = { until: now + 60000, count: 0 };
    publicLimits.set(key, row);
  }
  if (++row.count > 20)
    return next(new ApiError(429, "Vui lòng thử lại sau", "RATE_LIMITED"));
  if (publicLimits.size > 10000)
    for (const [k, v] of publicLimits)
      if (v.until < now) publicLimits.delete(k);
  next();
}
router.post(
  "/public/feedbacks",
  limit,
  run(async (r) => {
    const data = parse(
      z.object({
        rating: z.number().int().min(1).max(5),
        comments: z.string().max(10000).optional(),
        contactEmail: z.string().trim().max(254).refine(isFeedbackContact, {
          message: 'Vui lòng nhập email hợp lệ hoặc số điện thoại Việt Nam đúng định dạng (ví dụ: 0912345678 hoặc +84912345678).',
        }).optional(),
        targetScope: z
          .enum(["entire", "heritage", "booth", "facility"])
          .default("entire"),
        boothId: uuid.optional(),
        heritageId: uuid.optional(),
        eventId: uuid.optional(),
        targetName: text.optional(),
        fullName: z.string().trim().min(1).max(160).optional(),
        source: z
          .enum(["qr_general", "qr_heritage", "web_landing"])
          .default("web_landing"),
      }),
      r.body,
    );
    if (data.targetScope === "booth" && !data.boothId)
      throw ApiError.validation("Cần chọn gian hàng");
    if (data.targetScope === "heritage" && !data.heritageId)
      throw ApiError.validation("Cần chọn di sản");
    if (
      data.eventId &&
      !(await prisma.event.findFirst({
        where: { id: data.eventId, isDeleted: false, status: { in: ["published", "ongoing", "completed"] } },
      }))
    )
      throw ApiError.notFound("Không tìm thấy sự kiện");
    if (
      data.boothId &&
      !(await prisma.booth.findFirst({
        where: { id: data.boothId, isDeleted: false },
      }))
    )
      throw ApiError.notFound();
    if (
      data.heritageId &&
      !(await prisma.heritage.findFirst({
        where: { id: data.heritageId, isDeleted: false, status: "published" },
      }))
    )
      throw ApiError.notFound();
    const row = await prisma.feedback.create({
      data: { ...data, contactEmail: data.contactEmail || null },
    });
    return { id: row.id, status: row.status };
  }),
);
router.post(
  "/public/event-suggestions",
  limit,
  run((r) =>
    prisma.eventSuggestion.create({
      data: parse(
        z
          .object({
            fullName: z.string().trim().min(2).max(160).regex(/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u),
            phone: z.string().trim().transform(value => value.replace(/[\s.-]/g, '')).pipe(z.string().regex(/^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/)),
            content: z.string().trim().min(10).max(10000),
          })
          .strict(),
        r.body,
      ),
      select: { id: true, status: true, createdAt: true },
    }),
  ),
);
router.get(
  "/admin/event-suggestions",
  ...admin,
  run(() =>
    prisma.eventSuggestion.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ),
);
router.patch(
  "/admin/event-suggestions/:id",
  ...admin,
  run((r) =>
    transaction(async (tx) => {
      const id = parse(uuid, r.params.id),
        data = parse(
          z
            .object({
              status: z.enum([
                "new",
                "contacted",
                "approved",
                "rejected",
                "closed",
              ]),
              internalNote: z.string().max(10000).optional(),
            })
            .strict(),
          r.body,
        );
      const row = await tx.eventSuggestion.update({ where: { id }, data });
      await audit(tx, r.user, "update", "EventSuggestion", id, data);
      return row;
    }),
  ),
);
router.post(
  "/public/visits",
  limit,
  run(async (r) => {
    const { sessionId } = parse(z.object({ sessionId: uuid }).strict(), r.body);
    const now = new Date();
    const current = vietnamDateParts(now);
    const day = databaseDate(current.year, current.month, current.day);
    await prisma.siteVisit.upsert({
      where: { sessionId_day: { sessionId, day } },
      create: { sessionId, day, lastSeenAt: now },
      update: { lastSeenAt: now },
    });
    void broadcastVisitStats();
    return { recorded: true };
  }),
);
router.get(
  "/public/visit-stats",
  run(async () => {
    return getPublicVisitStats();
  }),
);
router.get(
  "/admin/visit-stats",
  ...admin,
  run(async (r) => {
    const now = new Date();
    const current = vietnamDateParts(now);
    const query = parse(z.object({
      year: queryInteger(2000, 9999).optional(),
      month: queryInteger(1, 12).optional(),
    }), r.query);
    const year = query.year ?? current.year;
    const month = query.month;
    const start = month ? databaseDate(year, month) : query.year ? databaseDate(year, 1) : databaseDate(current.year, current.month, current.day - 29);
    const end = month ? databaseDate(year, month + 1) : query.year ? databaseDate(year + 1, 1) : databaseDate(current.year, current.month, current.day + 1);
    const [todayVisits, monthVisits, totalVisits, daily, monthly] = await Promise.all([
      prisma.siteVisit.count({ where: { day: databaseDate(current.year, current.month, current.day) } }),
      prisma.siteVisit.count({ where: { day: { gte: databaseDate(current.year, current.month), lt: databaseDate(current.year, current.month + 1) } } }),
      prisma.siteVisit.count(),
      prisma.siteVisit.groupBy({ by: ['day'], where: { day: { gte: start, lt: end } }, _count: true }),
      prisma.siteVisit.groupBy({ by: ['day'], where: { day: { gte: databaseDate(year, 1), lt: databaseDate(year + 1, 1) } }, _count: true }),
    ]);
    const counts = new Map(daily.map(row => [row.day.toISOString().slice(0, 10), row._count]));
    const dailyVisits = [];
    for (let date = new Date(start); date < end; date.setUTCDate(date.getUTCDate() + 1)) {
      const key = date.toISOString().slice(0, 10);
      dailyVisits.push({ date: key, count: counts.get(key) ?? 0 });
    }
    const monthlyStats = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, year, count: 0 }));
    for (const row of monthly) monthlyStats[row.day.getUTCMonth()].count += row._count;
    const liveAdminWsCount = getLiveOnlineCount();
    return { onlineCount: liveAdminWsCount, todayVisits, monthVisits, totalVisits, generatedAt: now.toISOString(), dailyVisits, monthlyStats, selectedMonth: month ?? null, selectedYear: year, onlineWindowSeconds: ONLINE_WINDOW_MS / 1000, definition: 'one-session-per-Vietnam-calendar-day' };
  }),
);
router.get(
  "/admin/dashboard",
  ...admin,
  run(async () => {
    const day = new Date(
      new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }) +
        "T00:00:00+07:00",
    );
    const [
      users,
      eventCount,
      openEventCount,
      boothCount,
      activityCount,
      todayActivityCount,
      audits,
      visits,
      pendingBooks,
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ["primaryRole"],
        where: { isDeleted: false },
        _count: true,
      }),
      prisma.event.count({ where: { isDeleted: false } }),
      prisma.event.count({
        where: {
          isDeleted: false,
          status: { in: ["published", "ongoing"] },
          endAt: { gte: new Date() },
        },
      }),
      prisma.booth.count({ where: { isDeleted: false } }),
      prisma.activity.count(),
      prisma.activity.count({
        where: {
          startAt: { gte: day, lt: new Date(day.getTime() + 86400000) },
        },
      }),
      prisma.auditLog.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
        select: { createdAt: true },
      }),
      prisma.siteVisit.count(),
      prisma.bookSubmission.count({ where: { status: "PENDING" } }),
    ]);
    const counts = {};
    for (const a of audits) {
      const date = a.createdAt.toLocaleDateString("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
      });
      counts[date] = (counts[date] || 0) + 1;
    }

    // Luôn sinh đủ 7 ngày liên tiếp (từ 6 ngày trước đến hôm nay) để biểu đồ chuẩn 7 cột
    const sevenDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toLocaleDateString("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
      });
      sevenDays.push(dateStr);
    }

    const auditByDay = sevenDays.map((date) => ({
      date,
      count: counts[date] || 0,
    }));

    return {
      userCount: users.reduce((n, r) => n + r._count, 0),
      usersByRole: Object.fromEntries(
        users.map((r) => [r.primaryRole, r._count]),
      ),
      eventCount,
      openEventCount,
      boothCount,
      activityCount,
      todayActivityCount,
      auditByDay,
      totalVisits: visits,
      pendingBooks,
    };
  }),
);
const general = z
  .object({
    systemName: text,
    slogan: z.string().max(500),
    logoUrl: imageSource,
    supportEmail: z.string().trim().email().max(254).or(z.literal("")),
    supportPhone,
    physicalAddress: z.string().max(500),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  })
  .strict();
const settingsSchema = z
  .object({
    general: general.optional(),
    security: z
      .object({
        minPasswordLength: z.number().int().min(8).max(64),
        requireSpecialChar: z.boolean(),
        maxFailedAttempts: z.number().int().min(3).max(20),
        sessionTimeoutMinutes: z.number().int().min(5).max(120),
        twoFactorEnabled: z.literal(false),
      })
      .strict()
      .optional(),
    notifications: z
      .object({
        sendWelcomeEmail: z.literal(false),
        alertOnFailedLogins: z.literal(false),
        notifyRoleChanges: z.boolean(),
        dailyDigestEmail: z.literal(false),
      })
      .strict()
      .optional(),
  })
  .strict();
router.get(
  "/admin/settings",
  ...admin,
  run(() =>
    prisma.setting.findMany({
      where: { key: { in: ["admin.system", "events.retentionDays"] } },
    }),
  ),
);
router.put(
  "/admin/settings",
  ...admin,
  run((r) =>
    transaction(async (tx) => {
      const input = parse(
        z
          .object({
            "admin.system": settingsSchema.optional(),
            "events.retentionDays": z
              .number()
              .int()
              .min(0)
              .max(3650)
              .optional(),
          })
          .strict(),
        r.body,
      );
      for (const [key, value] of Object.entries(input))
        await tx.setting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        });
      await audit(tx, r.user, "config", "Setting", null, input);
      return tx.setting.findMany({
        where: { key: { in: Object.keys(input) } },
      });
    }),
  ),
);
router.get(
  "/public/site-config",
  run(async () => {
    const row = await prisma.setting.findUnique({
      where: { key: "admin.system" },
    });
    return row?.value?.general || {};
  }),
);
const contentSchema = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .max(200),
    kind: z.enum(["journey", "organization", "news", "footer"]),
    title: text,
    data: managedContentData,
    status: z.enum(["draft", "published", "hidden"]).default("draft"),
  })
  .strict();
function withoutEmbeddedReadCounts(payload) {
  if (!Array.isArray(payload?.data?.articles)) return payload;
  return {
    ...payload,
    data: {
      ...payload.data,
      articles: payload.data.articles.map((article) => ({ ...article, views: 0 })),
    },
  };
}
router.get(
  "/public/content",
  run(async (r) => {
    const rows = await prisma.contentEntry.findMany({
      where: {
        status: "published",
        ...(r.query.kind
          ? {
              kind: parse(
                z.enum(["journey", "organization", "news", "footer"]),
                r.query.kind,
              ),
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
    return decorateContentWithReadCounts(rows);
  }),
);
router.get(
  "/public/content/:slug",
  run(async (r) => {
    const row = await prisma.contentEntry.findFirst({
      where: { slug: r.params.slug, status: "published" },
    });
    if (!row) throw ApiError.notFound();
    return decorateContentWithReadCounts(row);
  }),
);
router.post(
  "/public/news/:articleId/read",
  run((r) => {
    const articleId = parse(z.string().trim().min(1).max(200), r.params.articleId);
    const { sessionId } = parse(z.object({ sessionId: uuid }).strict(), r.body);
    return recordNewsArticleRead({ articleId, sessionId });
  }),
);
router.get(
  "/admin/content",
  ...admin,
  run(async () => {
    const rows = await prisma.contentEntry.findMany({ orderBy: { updatedAt: "desc" } });
    return decorateContentWithReadCounts(rows);
  }),
);
router.post(
  "/admin/content",
  ...admin,
  run((r) =>
    transaction(async (tx) => {
      const row = await tx.contentEntry.create({
        data: withoutEmbeddedReadCounts(parse(contentSchema, r.body)),
      });
      await audit(tx, r.user, "create", "ContentEntry", row.id);
      return row;
    }),
  ),
);
router.patch(
  "/admin/content/:id",
  ...admin,
  run((r) =>
    transaction(async (tx) => {
      const id = parse(uuid, r.params.id),
        parsed = parse(
          contentSchema
            .partial()
            .extend({ expectedVersion: z.number().int().positive() }),
          r.body,
        ),
        { expectedVersion, ...rawData } = parsed,
        data = withoutEmbeddedReadCounts(rawData);
      const changed = await tx.contentEntry.updateMany({
        where: { id, version: expectedVersion },
        data: { ...data, version: { increment: 1 } },
      });
      if (!changed.count) throw ApiError.conflict("Nội dung đã thay đổi");
      await audit(tx, r.user, "update", "ContentEntry", id);
      const saved = await tx.contentEntry.findUnique({ where: { id } });
      return decorateContentWithReadCounts(saved, tx);
    }),
  ),
);
export default router;

async function getPublicVisitStats() {
  const now = new Date();
  const current = vietnamDateParts(now);
  const today = databaseDate(current.year, current.month, current.day);
  const monthStart = databaseDate(current.year, current.month);
  const nextMonthStart = databaseDate(current.year, current.month + 1);
  const [todayVisits, monthVisits, totalVisits] = await Promise.all([
    prisma.siteVisit.count({ where: { day: today } }),
    prisma.siteVisit.count({ where: { day: { gte: monthStart, lt: nextMonthStart } } }),
    prisma.siteVisit.count(),
  ]);
  const liveWsCount = getLiveOnlineCount();
  return {
    onlineCount: liveWsCount,
    todayVisits,
    monthVisits,
    totalVisits,
    onlineWindowSeconds: ONLINE_WINDOW_MS / 1000,
    generatedAt: now.toISOString(),
    definition: "one-session-per-Vietnam-calendar-day",
  };
}

setVisitStatsProvider(getPublicVisitStats);
