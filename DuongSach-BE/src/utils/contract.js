import { z } from "zod";
import { ApiError } from "./ApiError.js";
import { prisma } from "../config/database.js";

export const uuid = z.string().uuid();
export const text = z.string().trim().min(1).max(200);
export const quantity = z.number().int().min(0).max(2147483647);
export function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success)
    throw ApiError.validation(
      result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    );
  return result.data;
}
export function audit(tx, user, action, targetType, targetId, afterData) {
  return tx.auditLog.create({
    data: {
      actorId: user.id,
      actorRole: user.primaryRole,
      action,
      targetType,
      targetId,
      ...(afterData === undefined
        ? {}
        : { afterData: JSON.parse(JSON.stringify(afterData)) }),
    },
  });
}
// Retry serialization conflicts; never repeat a transaction with external side effects.
export async function transaction(work) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: "Serializable",
        maxWait: 10000,
        timeout: 15000,
      });
    } catch (error) {
      if (error.code !== "P2034" || attempt >= 2) throw error;
    }
  }
}
export async function organization(userId, db = prisma) {
  const member = await db.organizationMember.findFirst({
    where: { userId, organization: { isDeleted: false } },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
  if (member) return member.organization;

  // Fallback: check stall assignment to find or link organization
  const stallUser = await db.userStallAssignment.findFirst({
    where: { userId },
    include: { stall: true, user: true },
  });
  if (stallUser?.stall) {
    let org = await db.organization.findFirst({
      where: {
        isDeleted: false,
        OR: [
          { name: { contains: stallUser.stall.name, mode: "insensitive" } },
          { name: { contains: stallUser.stall.code, mode: "insensitive" } },
        ],
      },
    });
    if (!org) {
      org = await db.organization.create({
        data: {
          name: stallUser.stall.name,
          shortDesc: `Đơn vị vận hành ${stallUser.stall.name} (${stallUser.stall.code})`,
          email: `${stallUser.stall.code.toLowerCase()}@partner.duongsach.vn`,
          representativeName: stallUser.user?.fullName || stallUser.stall.name,
          phone: stallUser.user?.phone || '02839316289',
          isVerified: true,
        },
      });
    }
    await db.organizationMember.create({
      data: {
        organizationId: org.id,
        userId,
        roleInOrg: "owner",
      },
    }).catch(() => {});
    return org;
  }


  throw ApiError.forbidden("Tài khoản chưa được phân công tổ chức");
}
