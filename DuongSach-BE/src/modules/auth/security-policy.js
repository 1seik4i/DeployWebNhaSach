import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/ApiError.js";
export async function securityPolicy() {
  const row = await prisma.setting.findUnique({
    where: { key: "admin.system" },
  });
  return {
    minPasswordLength: 8,
    requireSpecialChar: false,
    maxFailedAttempts: 5,
    sessionTimeoutMinutes: 15,
    ...row?.value?.security,
  };
}
export async function validatePassword(value) {
  const policy = await securityPolicy();
  if (
    typeof value !== "string" ||
    value.length < policy.minPasswordLength ||
    Buffer.byteLength(value, "utf8") > 72 ||
    (policy.requireSpecialChar && !/[^\p{L}\p{N}\s]/u.test(value))
  )
    throw ApiError.validation(
      `Mật khẩu cần ít nhất ${policy.minPasswordLength} ký tự${policy.requireSpecialChar ? " và một ký tự đặc biệt" : ""}, tối đa 72 byte`,
    );
}
