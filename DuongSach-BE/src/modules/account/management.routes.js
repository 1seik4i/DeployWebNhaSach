import { Router } from "express";
import { searchText } from '../../utils/input.validation.js';
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { prisma } from "../../config/database.js";
import { authenticate } from "../../middlewares/auth.js";
import { authorize } from "../../middlewares/rbac.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { audit, parse, text, transaction, uuid } from "../../utils/contract.js";
import { validatePassword } from "../auth/security-policy.js";

const router = Router();
const admin = [authenticate, authorize("admin")];
const run = (fn) =>
  asyncHandler(async (r, s) => ApiResponse.success(s, await fn(r)));
const safeUser = {
  id: true,
  code: true,
  fullName: true,
  email: true,
  phone: true,
  primaryRole: true,
  status: true,
  avatarUrl: true,
  createdAt: true,
  lastActiveAt: true,
  lockReason: true,
};
const password = z.string().min(8).max(72);
const contactName = z.string().trim().min(2).max(160).regex(/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u, "Họ tên chỉ được chứa chữ cái và dấu câu hợp lệ");
const contactEmail = z.string().trim().email().max(200).transform(value => value.toLowerCase());
const contactPhone = z.string().trim().transform(value => value.replace(/[\s.-]/g, "")).pipe(z.string().regex(/^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/, "Số điện thoại Việt Nam không hợp lệ"));
const userInput = z
  .object({
    fullName: contactName,
    email: contactEmail,
    phone: z.union([contactPhone, z.literal("")]).optional(),
    role: z.enum(["admin", "partner"]),
    status: z.enum(["active", "locked", "pending_verification"]).optional(),
    avatarUrl: z.string().max(2000).optional().nullable(),
    password: password.optional(),
  })
  .strict();
const hash = (token) => crypto.createHash("sha256").update(token).digest("hex");
async function resetToken(tx, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  await tx.passwordReset.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
  await tx.passwordReset.create({
    data: {
      userId,
      tokenHash: hash(token),
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  return { resetToken: token, expiresInMinutes: 60 };
}
router.get(
  "/admin/users",
  ...admin,
  run((r) =>
    prisma.user.findMany({
      where: {
        isDeleted: false,
        ...(r.query.role
          ? {
              primaryRole: parse(
                z.enum(["admin", "partner"]),
                r.query.role,
              ),
            }
          : {}),
        ...(r.query.search
          ? {
              OR: ["fullName", "email"].map((k) => ({
                [k]: { contains: parse(searchText, r.query.search), mode: "insensitive" },
              })),
            }
          : {}),
      },
      select: {
        ...safeUser,
        stallAssignment: {
          select: {
            stall: {
              select: { imageUrl: true }
            }
          }
        },
        orgMembers: {
          select: {
            organization: {
              select: { logoUrl: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    }).then(users => users.map(u => ({
      ...u,
      avatarUrl: u.avatarUrl || u.stallAssignment?.stall?.imageUrl || u.orgMembers?.[0]?.organization?.logoUrl || null,
      stallAssignment: undefined,
      orgMembers: undefined,
    }))),
  ),
);
router.post(
  "/admin/users",
  ...admin,
  run(async (r) => {
    const { role, password: initial, ...data } = parse(userInput, r.body);
    if (initial) await validatePassword(initial);
    const passwordHash = await bcrypt.hash(
      initial || crypto.randomBytes(32).toString("hex"),
      12,
    );
    return transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          ...data,
          primaryRole: role,
          status: data.status || "active",
          passwordHash,
        },
        select: safeUser,
      });
      const roleRow = await tx.role.findUnique({ where: { code: role } });
      if (roleRow)
        await tx.userRoleAssignment.create({
          data: { userId: user.id, roleId: roleRow.id },
        });
      if (role === "partner")
        await tx.organization.create({
          data: {
            name: data.fullName,
            representativeName: data.fullName,
            email: data.email,
            phone: data.phone || "",
            members: { create: { userId: user.id, roleInOrg: "owner" } },
          },
        });
      await audit(tx, r.user, "create", "User", user.id);
      return { ...user, ...(!initial ? await resetToken(tx, user.id) : {}) };
    });
  }),
);
async function updateUser(r, statusOnly = false) {
  const id = parse(uuid, r.params.id);
  const input = parse(
    statusOnly
      ? z
          .object({
            status: z.enum(["active", "locked"]),
            reason: z.string().trim().max(2000).optional(),
          })
          .strict().refine(data => data.status !== 'locked' || !!data.reason, { path: ['reason'], message: 'Vui lòng nhập lý do khóa tài khoản' })
      : userInput.omit({ password: true }).partial(),
    r.body,
  );
  return transaction(async (tx) => {
    const old = await tx.user.findUnique({ where: { id } });
    if (!old || old.isDeleted) throw ApiError.notFound();
    if (
      old.primaryRole === "admin" &&
      ((input.role && input.role !== "admin") ||
        (input.status && input.status !== "active"))
    ) {
      if (
        (await tx.user.count({
          where: { primaryRole: "admin", status: "active", isDeleted: false },
        })) <= 1
      )
        throw ApiError.conflict(
          "Không được khóa hoặc hạ quyền Admin cuối cùng",
        );
    }
    const { role, reason, ...fields } = input;
    const row = await tx.user.update({
      where: { id },
      data: {
        ...fields,
        ...(role ? { primaryRole: role } : {}),
        ...(statusOnly
          ? { lockReason: input.status === "locked" ? reason || null : null }
          : {}),
      },
      select: safeUser,
    });
    if (role && role !== old.primaryRole) {
      await tx.userRoleAssignment.deleteMany({ where: { userId: id } });
      const target = await tx.role.findUnique({ where: { code: role } });
      if (target)
        await tx.userRoleAssignment.create({
          data: { userId: id, roleId: target.id },
        });
      await tx.userStallAssignment.deleteMany({ where: { userId: id } });
      const settings = await tx.setting.findUnique({
        where: { key: "admin.system" },
      });
      if (settings?.value?.notifications?.notifyRoleChanges)
        await tx.notification.create({
          data: {
            userId: id,
            title: "Quyền tài khoản đã thay đổi",
            message: `Vai trò mới: ${role}`,
            kind: "role",
          },
        });
    }
    if (old.primaryRole === "partner" && (!role || role === "partner") && (fields.email !== undefined || fields.phone !== undefined || fields.fullName !== undefined)) {
      await tx.organization.updateMany({
        where: { members: { some: { userId: id, roleInOrg: "owner" } }, isDeleted: false },
        data: {
          ...(fields.email !== undefined ? { email: fields.email } : {}),
          ...(fields.phone !== undefined ? { phone: fields.phone } : {}),
          ...(fields.fullName !== undefined ? { representativeName: fields.fullName } : {}),
        },
      });
    }
    if (input.status === "locked" || (role && role !== old.primaryRole))
      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    await audit(tx, r.user, "update", "User", id, input);
    return row;
  });
}
router.patch(
  "/admin/users/:id",
  ...admin,
  run((r) => updateUser(r)),
);
router.patch(
  "/admin/users/:id/status",
  ...admin,
  run((r) => updateUser(r, true)),
);
router.post(
  "/admin/users/:id/reset-password",
  ...admin,
  run((r) =>
    transaction(async (tx) => {
      const id = parse(uuid, r.params.id);
      if (!(await tx.user.findFirst({ where: { id, isDeleted: false } })))
        throw ApiError.notFound();
      const result = await resetToken(tx, id);
      await audit(tx, r.user, "reset-password", "User", id);
      return result;
    }),
  ),
);
router.get(
  "/admin/users/:id/stall-assignment",
  ...admin,
  run((r) =>
    prisma.userStallAssignment.findUnique({
      where: { userId: parse(uuid, r.params.id) },
      include: { stall: true },
    }),
  ),
);
router.put(
  "/admin/users/:id/stall-assignment",
  ...admin,
  run((r) =>
    transaction(async (tx) => {
      const userId = parse(uuid, r.params.id),
        data = parse(
          z
            .object({
              stallId: uuid.nullable(),
              expectedVersion: z.number().int().min(0).optional(),
            })
            .strict(),
          r.body,
        );
      const user = await tx.user.findFirst({
        where: { id: userId, isDeleted: false, primaryRole: "partner" },
      });
      if (!user)
        throw ApiError.validation(
          "Chỉ phân công gian hàng cho tài khoản partner",
        );
      const old = await tx.userStallAssignment.findUnique({
        where: { userId },
      });
      if (
        data.expectedVersion !== undefined &&
        data.expectedVersion !== (old?.version || 0)
      )
        throw ApiError.conflict("Phân công đã thay đổi");
      if (
        data.stallId &&
        !(await tx.booth.findFirst({
          where: { id: data.stallId, isDeleted: false },
        }))
      )
        throw ApiError.notFound("Không tìm thấy gian hàng");
      const result = data.stallId
        ? await tx.userStallAssignment.upsert({
            where: { userId },
            create: { userId, stallId: data.stallId },
            update: { stallId: data.stallId, version: { increment: 1 } },
            include: { stall: true },
          })
        : (await tx.userStallAssignment.deleteMany({ where: { userId } }),
          null);
      await audit(tx, r.user, "update", "UserStallAssignment", userId, {
        stallId: data.stallId,
      });
      return result;
    }),
  ),
);
const limits = new Map();
function resetLimit(r, s, next) {
  const key = r.ip,
    now = Date.now();
  let item = limits.get(key);
  if (!item || item.until < now) {
    item = { count: 0, until: now + 600000 };
    limits.set(key, item);
  }
  if (++item.count > 10)
    return next(new ApiError(429, "Vui lòng thử lại sau", "RATE_LIMITED"));
  if (limits.size > 10000)
    for (const [k, v] of limits) if (v.until < now) limits.delete(k);
  next();
}
router.post(
  "/auth/forgot-password",
  resetLimit,
  run(async (r) => {
    parse(z.object({ email: z.string().email() }), r.body);
    // Delivery requires a configured mail provider; do not pretend a message was sent.
    throw new ApiError(
      503,
      "Vui lòng liên hệ Admin để nhận liên kết đặt lại mật khẩu.",
      "PASSWORD_DELIVERY_UNAVAILABLE",
    );
  }),
);
router.post(
  "/auth/reset-password",
  resetLimit,
  run(async (r) => {
    const data = parse(
      z
        .object({ token: z.string().min(32).max(200), newPassword: password })
        .strict(),
      r.body,
    );
    await validatePassword(data.newPassword);
    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    return transaction(async (tx) => {
      const row = await tx.passwordReset.findUnique({
        where: { tokenHash: hash(data.token) },
        include: { user: true },
      });
      if (
        !row ||
        row.usedAt ||
        row.expiresAt < new Date() ||
        row.user.isDeleted ||
        row.user.status !== "active"
      )
        throw ApiError.badRequest("Liên kết không hợp lệ hoặc đã hết hạn");
      await tx.passwordReset.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      });
      await tx.user.update({
        where: { id: row.userId },
        data: { passwordHash, passwordChangedAt: new Date() },
      });
      await tx.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return { success: true };
    });
  }),
);
for (const [path, roles] of [
  ["/auth/change-password", ["admin", "partner"]],
  ["/admin/profile/password", ["admin"]],
  ["/partner/password", ["partner"]],
]) {
  router.post(
    path,
    authenticate,
    authorize(...roles),
    run(async (r) => {
      const data = parse(
        z
          .object({
            currentPassword: z.string().max(72),
            newPassword: password,
          })
          .strict(),
        r.body,
      );
      await validatePassword(data.newPassword);
      const old = await prisma.user.findUnique({ where: { id: r.user.id } });
      if (!(await bcrypt.compare(data.currentPassword, old.passwordHash)))
        throw ApiError.badRequest("Mật khẩu hiện tại không đúng");
      const passwordHash = await bcrypt.hash(data.newPassword, 12);
      return transaction(async (tx) => {
        const changed = await tx.user.updateMany({
          where: { id: r.user.id, passwordHash: old.passwordHash },
          data: { passwordHash, passwordChangedAt: new Date() },
        });
        if (!changed.count) throw ApiError.conflict("Mật khẩu đã thay đổi");
        await tx.refreshToken.updateMany({
          where: { userId: r.user.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        await audit(tx, r.user, "change-password", "User", r.user.id);
        return { success: true };
      });
    }),
  );
}
for (const role of ["admin", "partner"]) {
  router.get(
    `/${role}/notifications`,
    authenticate,
    authorize(role),
    run((r) =>
      prisma.notification.findMany({
        where: { userId: r.user.id },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ),
  );
  router.patch(
    `/${role}/notifications/read-all`,
    authenticate,
    authorize(role),
    run((r) =>
      prisma.notification.updateMany({
        where: { userId: r.user.id, isRead: false },
        data: { isRead: true },
      }),
    ),
  );
  router.patch(
    `/${role}/notifications/:id/read`,
    authenticate,
    authorize(role),
    run(async (r) => {
      const result = await prisma.notification.updateMany({
        where: { id: parse(uuid, r.params.id), userId: r.user.id },
        data: { isRead: true },
      });
      if (!result.count) throw ApiError.notFound();
      return { success: true };
    }),
  );
}
router.get(
  "/admin/audit-logs",
  ...admin,
  run(() =>
    prisma.auditLog.findMany({
      include: {
        actor: {
          select: { id: true, fullName: true, email: true, primaryRole: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ),
);
export default router;
