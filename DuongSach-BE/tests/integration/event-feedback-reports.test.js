import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../src/config/database.js";
import { config } from "../../src/config/env.js";
import { createApp } from "../../src/app.js";

const app = createApp();
const suffix = crypto.randomUUID();
let event;
let admin;
let partner;
let organization;

const token = (user) => jwt.sign({ userId: user.id }, config.jwt.accessSecret, { expiresIn: "1h" });

beforeAll(async () => {
  [admin, partner] = await Promise.all(["admin", "partner"].map((role) => prisma.user.create({
    data: { fullName: `${role}-${suffix}`, email: `${role}-${suffix}@example.test`, passwordHash: "unused", primaryRole: role, status: "active" },
  })));
  organization = await prisma.organization.create({
    data: { name: `Tổ chức ${suffix}`, representativeName: "Đại diện", email: `org-${suffix}@example.test`, phone: "0900000000", isVerified: true },
  });
  await prisma.organizationMember.create({ data: { organizationId: organization.id, userId: partner.id, roleInOrg: "owner" } });
  event = await prisma.event.create({
    data: { title: `Sự kiện ${suffix}`, slug: `event-feedback-${suffix}`, startAt: new Date("2026-10-01T00:00:00Z"), endAt: new Date("2026-10-31T00:00:00Z"), status: "published" },
  });
  await prisma.partnerApplication.create({ data: { eventId: event.id, organizationId: organization.id, status: "approved", step: 1 } });
});

afterAll(async () => {
  if (event) await prisma.feedback.deleteMany({ where: { eventId: event.id } });
  if (organization) await prisma.partnerApplication.deleteMany({ where: { organizationId: organization.id } });
  if (event) await prisma.event.delete({ where: { id: event.id } });
  if (organization) await prisma.organization.delete({ where: { id: organization.id } });
  await prisma.user.deleteMany({ where: { id: { in: [admin?.id, partner?.id].filter(Boolean) } } });
  await prisma.$disconnect();
});

describe("event feedback reports", () => {
  it("persists a public review and returns the same review to admin and partner reports", async () => {
    const submitted = await request(app).post("/api/public/feedbacks").send({
      eventId: event.id,
      targetScope: "entire",
      targetName: event.title,
      fullName: "Bạn đọc kiểm thử",
      rating: 4,
      comments: "Không gian tốt, cần thêm ghế ngồi.",
      source: "web_landing",
    });
    expect(submitted.status, JSON.stringify(submitted.body)).toBe(200);

    for (const [role, user] of [["admin", admin], ["partner", partner]]) {
      const report = await request(app)
        .get(`/api/${role}/reports?eventId=${event.id}`)
        .set("Authorization", `Bearer ${token(user)}`);
      expect(report.status, JSON.stringify(report.body)).toBe(200);
      expect(report.body.data.ratingCount).toBe(1);
      expect(report.body.data.averageRating).toBe(4);
      expect(report.body.data.feedbacks[0]).toEqual(expect.objectContaining({
        rating: 4,
        authorName: "Bạn đọc kiểm thử",
        comment: "Không gian tốt, cần thêm ghế ngồi.",
        source: "event",
      }));
    }
  });
});
