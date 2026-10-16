import { prisma } from "../../config/database.js";
export async function publicEventWhere() {
  const setting = await prisma.setting.findUnique({
    where: { key: "events.retentionDays" },
  });
  const days = Number.isInteger(setting?.value) ? setting.value : 30;
  const now = new Date();
  return {
    isDeleted: false,
    visibility: "public",
    status: { in: ["published", "ongoing", "completed"] },
    OR: [
      { publicUntil: { gte: now } },
      {
        publicUntil: null,
        endAt: { gte: new Date(now.getTime() - days * 86400000) },
      },
    ],
  };
}
