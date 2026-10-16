import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../../src/config/env.js";
import { prisma } from "../../src/config/database.js";
import { createApp } from "../../src/app.js";

const app = createApp();
const sessionId = crypto.randomUUID();
const onlineSessionId = crypto.randomUUID();

afterAll(async () => {
  await prisma.siteVisit.deleteMany({ where: { sessionId: { in: [sessionId, onlineSessionId] } } });
  await prisma.$disconnect();
});

describe("public site visit analytics", () => {
  it("protects admin analytics and returns 30 consecutive Vietnam dates with real counts", async () => {
    const denied = await request(app).get('/api/admin/visit-stats');
    expect(denied.status).toBe(401);
    const user = await prisma.user.findFirst({ where: { primaryRole: 'admin', status: 'active', isDeleted: false } });
    expect(user).not.toBeNull();
    const token = jwt.sign({ userId: user.id, passwordVersion: user.passwordChangedAt?.getTime() }, config.jwt.accessSecret, { expiresIn: '5m' });
    const response = await request(app).get('/api/admin/visit-stats').set('Authorization', `Bearer ${token}`);
    expect(response.status, JSON.stringify(response.body)).toBe(200);
    const stats = response.body.data;
    expect(stats.dailyVisits).toHaveLength(30);
    const today = stats.dailyVisits.at(-1);
    expect(today.count).toBe(stats.todayVisits);
    for (let index = 0; index < stats.dailyVisits.length; index++) {
      const row = stats.dailyVisits[index];
      expect(row.count).toBe(await prisma.siteVisit.count({ where: { day: new Date(`${row.date}T00:00:00Z`) } }));
      if (index) expect(new Date(row.date) - new Date(stats.dailyVisits[index - 1].date)).toBe(86400000);
    }
    expect(stats.totalVisits).toBe(await prisma.siteVisit.count());
  });
  it("persists one daily visit, refreshes its heartbeat, and returns all counters", async () => {
    const first = await request(app).post("/api/public/visits").send({ sessionId });
    expect(first.status, JSON.stringify(first.body)).toBe(200);

    const stored = await prisma.siteVisit.findMany({ where: { sessionId } });
    expect(stored).toHaveLength(1);
    const previousHeartbeat = stored[0].lastSeenAt;

    const second = await request(app).post("/api/public/visits").send({ sessionId });
    expect(second.status, JSON.stringify(second.body)).toBe(200);
    const refreshed = await prisma.siteVisit.findMany({ where: { sessionId } });
    expect(refreshed).toHaveLength(1);
    expect(refreshed[0].lastSeenAt.getTime()).toBeGreaterThanOrEqual(previousHeartbeat.getTime());

    const response = await request(app).get("/api/public/visit-stats");
    expect(response.status, JSON.stringify(response.body)).toBe(200);
    expect(response.body.data).toEqual(expect.objectContaining({
      onlineCount: expect.any(Number),
      todayVisits: expect.any(Number),
      monthVisits: expect.any(Number),
      totalVisits: expect.any(Number),
      onlineWindowSeconds: 300,
      definition: "one-session-per-Vietnam-calendar-day",
    }));
    expect(response.body.data.onlineCount).toBeGreaterThanOrEqual(1);
    expect(response.body.data.todayVisits).toBeGreaterThanOrEqual(1);
    expect(response.body.data.monthVisits).toBeGreaterThanOrEqual(1);
    expect(response.body.data.totalVisits).toBeGreaterThanOrEqual(1);
  });
  it("counts an active browser session once even when it has rows for two days", async () => {
    const baseline = await request(app).get("/api/public/visit-stats");
    expect(baseline.status, JSON.stringify(baseline.body)).toBe(200);

    const now = new Date();
    const previousDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    await prisma.siteVisit.create({
      data: { sessionId: onlineSessionId, day: previousDay, lastSeenAt: now },
    });
    const recorded = await request(app).post("/api/public/visits").send({ sessionId: onlineSessionId });
    expect(recorded.status, JSON.stringify(recorded.body)).toBe(200);

    const response = await request(app).get("/api/public/visit-stats");
    expect(response.status, JSON.stringify(response.body)).toBe(200);
    expect(response.body.data.onlineCount).toBe(baseline.body.data.onlineCount + 1);
  });
});
