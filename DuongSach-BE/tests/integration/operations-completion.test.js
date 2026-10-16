import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "../../src/config/database.js";
import { config } from "../../src/config/env.js";
import { createApp } from "../../src/app.js";
const app = createApp(),
  prefix = `flow-${crypto.randomUUID()}`;
let admin,
  partner,
  org,
  venue,
  location,
  booth,
  event,
  application,
  boothRequest,
  proposal,
  activity,
  entry,
  suggestion;
const call = (method, path, user, data) => {
  let q = request(app)[method]("/api" + path);
  if (user)
    q = q.set(
      "Authorization",
      `Bearer ${jwt.sign({ userId: user.id }, config.jwt.accessSecret, { expiresIn: "1h" })}`,
    );
  return data === undefined ? q : q.send(data);
};
const ok = (r) => {
  expect(r.status, JSON.stringify(r.body)).toBe(200);
  return r.body.data;
};
const start = new Date(Date.now() + 86400000),
  end = new Date(Date.now() + 2 * 86400000);
beforeAll(async () => {
  const passwordHash = await bcrypt.hash("Test-pass-123!", 4);
  admin = await prisma.user.create({
    data: {
      fullName: prefix,
      email: `admin-${prefix}@example.test`,
      primaryRole: "admin",
      status: "active",
      passwordHash,
    },
  });
  partner = await prisma.user.create({
    data: {
      fullName: prefix,
      email: `partner-${prefix}@example.test`,
      primaryRole: "partner",
      status: "active",
      passwordHash,
    },
  });
  org = await prisma.organization.create({
    data: {
      name: prefix,
      representativeName: prefix,
      email: partner.email,
      phone: "0901234567",
      members: { create: { userId: partner.id } },
    },
  });
  venue = await prisma.venue.create({
    data: { name: prefix, facility: prefix, capacity: 100 },
  });
  location = await prisma.location.create({
    data: {
      venueId: venue.id,
      name: prefix,
      code: "FLOW",
      kind: "booth",
      capacity: 100,
      mapX: 10,
      mapY: 20,
    },
  });
  booth = await prisma.booth.create({
    data: {
      locationId: location.id,
      code: crypto.randomUUID().slice(0, 20),
      name: prefix,
    },
  });
});
afterAll(async () => {
  if (event) {
    await prisma.activityReview.deleteMany({
      where: { proposal: { eventId: event.id } },
    });
    await prisma.activity.deleteMany({ where: { eventId: event.id } });
    await prisma.activityProposal.deleteMany({ where: { eventId: event.id } });
    await prisma.boothRequest.deleteMany({ where: { eventId: event.id } });
    await prisma.boothAssignment.deleteMany({ where: { eventId: event.id } });
    await prisma.partnerApplication.deleteMany({
      where: { eventId: event.id },
    });
    await prisma.eventLocation.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
  }
  if (entry) await prisma.contentEntry.delete({ where: { id: entry.id } });
  if (suggestion)
    await prisma.eventSuggestion.delete({ where: { id: suggestion.id } });
  await prisma.booth.delete({ where: { id: booth.id } });
  await prisma.location.delete({ where: { id: location.id } });
  await prisma.venue.delete({ where: { id: venue.id } });
  await prisma.organizationMember.deleteMany({
    where: { organizationId: org.id },
  });
  await prisma.organization.delete({ where: { id: org.id } });
  await prisma.auditLog.deleteMany({
    where: { actorId: { in: [admin.id, partner.id] } },
  });
  await prisma.notification.deleteMany({
    where: { userId: { in: [admin.id, partner.id] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [admin.id, partner.id] } },
  });
  await prisma.$disconnect();
});
describe("Operational workflows against PostgreSQL", () => {
  it("rotates a refresh token exactly once under concurrent requests", async () => {
    const login = ok(
      await call("post", "/auth/login", null, {
        email: partner.email,
        password: "Test-pass-123!",
      }),
    );
    const results = await Promise.all([
      call("post", "/auth/refresh", null, { refreshToken: login.refreshToken }),
      call("post", "/auth/refresh", null, { refreshToken: login.refreshToken }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 401]);
    expect(
      results.find((r) => r.status === 200).body.data.accessToken,
    ).toBeTruthy();
    await prisma.refreshToken.deleteMany({ where: { userId: partner.id } });
  });
  it("creates an event with usable venue locations and publishes it", async () => {
    const r = await call("post", "/admin/events", admin, {
      title: prefix,
      venueId: venue.id,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    });
    expect(r.status).toBe(201);
    event = r.body.data;
    expect(
      ok(
        await call("get", `/admin/event-locations?eventId=${event.id}`, admin),
      ).map((l) => l.id),
    ).toContain(location.id);
    const deadline = start.toISOString().slice(0, 10);
    const settings = ok(
      await call("put", `/admin/events/${event.id}/settings`, admin, {
        boothRequestDeadline: deadline,
        proposalDeadline: deadline,
        participantRegDeadline: deadline,
        boothCancelCutoff: deadline,
      }),
    );
    expect(settings).toMatchObject({ eventId: event.id });
    const listed = ok(await call("get", "/admin/events", admin));
    expect(listed.find((item) => item.id === event.id).settings).toBeTruthy();
    ok(await call("post", `/admin/events/${event.id}/publish`, admin, {}));
    expect(
      ok(await call("get", "/public/events")).some((e) => e.id === event.id),
    ).toBe(true);
    const schedule = ok(await call("get", "/partner/schedule", partner));
    const scheduledEvent = schedule.find((item) => item.id === `event:${event.id}`);
    expect(scheduledEvent).toMatchObject({ title: prefix, categoryTag: "Sự kiện" });
    expect(scheduledEvent.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("validates application ownership and admin review", async () => {
    expect(
      (
        await call("post", "/partner/event-applications", partner, {
          eventId: event.id,
          organizationId: org.id,
        })
      ).status,
    ).toBe(422);
    application = ok(
      await call("post", "/partner/event-applications", partner, {
        eventId: event.id,
      }),
    );
    expect(
      (
        await call(
          "post",
          `/admin/partner-applications/${application.id}/approve`,
          partner,
          {},
        )
      ).status,
    ).toBe(403);
    ok(
      await call(
        "post",
        `/admin/partner-applications/${application.id}/approve`,
        admin,
        {},
      ),
    );
    expect(
      (
        await call(
          "post",
          `/admin/partner-applications/${application.id}/reject`,
          admin,
          { note: "Duplicate" },
        )
      ).status,
    ).toBe(409);
  });
  it("prevents duplicate booth requests and double allocation", async () => {
    boothRequest = ok(
      await call("post", "/partner/booth-requests", partner, {
        eventId: event.id,
        boothId: booth.id,
      }),
    );
    expect(
      (
        await call("post", "/partner/booth-requests", partner, {
          eventId: event.id,
          boothId: booth.id,
        })
      ).status,
    ).toBe(409);
    const results = await Promise.all([
      call(
        "post",
        `/admin/booth-requests/${boothRequest.id}/approve`,
        admin,
        {},
      ),
      call(
        "post",
        `/admin/booth-requests/${boothRequest.id}/approve`,
        admin,
        {},
      ),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(
      await prisma.boothAssignment.count({
        where: { eventId: event.id, boothId: booth.id },
      }),
    ).toBe(1);
    const rows = ok(
      await call("get", `/partner/booths?eventId=${event.id}`, partner),
    );
    expect(rows.find((b) => b.id === booth.id).assignedOrgId).toBe(org.id);
  });
  it("allows a partner to rename and edit its owned booth", async () => {
    expect(
      ok(
        await call("put", `/admin/booths/${booth.id}`, admin, {
          name: prefix + " renamed",
          campus: prefix,
        }),
      ).name,
    ).toBe(prefix + " renamed");
    expect(
      (
        await call("patch", `/partner/booths/${booth.id}/content`, partner, {
          name: "Unauthorized rename",
        })
      ).status,
    ).toBe(200);
    ok(
      await call("patch", `/partner/booths/${booth.id}/content`, partner, {
        description: "Stored booth description",
        images: [],
        documents: [],
      }),
    );
    expect(
      ok(await call("get", `/partner/booths/${booth.id}/content`, partner))
        .description,
    ).toBe("Stored booth description");
  });
  it("keeps approved proposals private until their activity is published", async () => {
    proposal = ok(
      await call("post", "/partner/activity-proposals", partner, {
        eventId: event.id,
        title: prefix,
        kind: "workshop",
        locationId: location.id,
        startAt: new Date(start.getTime() + 3600000).toISOString(),
        endAt: new Date(start.getTime() + 7200000).toISOString(),
        capacity: 10000,
        devices: [],
      }),
    );
    ok(
      await call(
        "post",
        `/admin/activity-proposals/${proposal.id}/approve`,
        admin,
        {},
      ),
    );
    expect(
      ok(await call("get", "/public/activities")).some(
        (a) => a.title === prefix,
      ),
    ).toBe(false);
    activity = ok(
      await call(
        "post",
        `/admin/activity-proposals/${proposal.id}/create-activity`,
        admin,
        {},
      ),
    );
    await prisma.activity.update({ where: { id: activity.id }, data: { registeredCount: 200 } });
    const updatedEstimate = ok(await call('patch', `/admin/activities/${activity.id}`, admin, { capacity: 5 }));
    expect(updatedEstimate.capacity).toBe(5);
    expect(updatedEstimate.registeredCount).toBe(200);
    expect(
      (
        await call(
          "post",
          `/admin/activity-proposals/${proposal.id}/create-activity`,
          admin,
          {},
        )
      ).status,
    ).toBe(409);
    ok(
      await call("post", `/admin/activities/${activity.id}/publish`, admin, {}),
    );
    const edited = ok(await call('patch', `/partner/activity-proposals/${proposal.id}`, partner, { title: `${prefix} updated`, schedule: [{ id: 'schedule-1', title: 'Lịch trình mới', time: '09:00' }], documents: [{ id: 'doc-1', name: 'Tài liệu mới', url: 'https://example.test/document.pdf' }] }));
    expect(edited.schedule[0].title).toBe('Lịch trình mới');
    expect(edited.documents[0].name).toBe('Tài liệu mới');
    expect((await prisma.activity.findUnique({ where: { id: activity.id } })).title).toBe(`${prefix} updated`);
    expect((await call('patch', `/partner/activity-proposals/${proposal.id}`, partner, { schedule: 'invalid' })).status).toBe(422);
    expect((await call('patch', `/partner/activity-proposals/${proposal.id}`, partner, { documents: [{ id: 'unsafe-document', name: 'Invalid link', url: 'javascript:alert(1)' }] })).status).toBe(422);
    expect(
      ok(await call("get", "/public/activities")).some(
        (a) => a.id === activity.id,
      ),
    ).toBe(true);
  });
  it("allows overlapping activities and hides internal events and their activities", async () => {
    const overlappingActivity = ok(
      await call("post", "/admin/activities", admin, {
          eventId: event.id,
          title: "Overlap",
          kind: "workshop",
          locationId: location.id,
          startAt: activity.startAt,
          endAt: activity.endAt,
          capacity: 30,
      }),
    );
    ok(await call("post", `/admin/activities/${overlappingActivity.id}/publish`, admin, {}));
    ok(
      await call("put", `/admin/events/${event.id}`, admin, {
        visibility: "internal",
      }),
    );
    expect(
      ok(await call("get", "/public/events")).some((e) => e.id === event.id),
    ).toBe(false);
    expect(
      ok(await call("get", "/public/activities")).some(
        (a) => a.id === activity.id,
      ),
    ).toBe(false);
  });
  it("persists map coordinates and rejects invalid positions", async () => {
    ok(
      await call("put", "/admin/map-config", admin, {
        points: [{ id: booth.id, x: 33, y: 44 }],
      }),
    );
    const point = ok(await call("get", "/public/map-hotspots")).find(
      (p) => p.id === booth.id,
    );
    expect([point.x, point.y]).toEqual([33, 44]);
    const adminBooth = ok(await call("get", `/admin/booths/${booth.id}`, admin));
    expect(point.status).toBe(adminBooth.status);
    expect(point.orgName).toBe(adminBooth.orgName);
    expect(
      (
        await call("put", "/admin/map-config", admin, {
          points: [{ id: booth.id, x: 101, y: 44 }],
        })
      ).status,
    ).toBe(422);
    expect(
      (await call("put", "/admin/map-config", partner, { points: [] })).status,
    ).toBe(403);
  });
  it("serves only published content and rejects stale saves", async () => {
    entry = ok(
      await call("post", "/admin/content", admin, {
        slug: prefix,
        kind: "news",
        title: prefix,
        data: { text: "Draft" },
      }),
    );
    expect((await call("get", `/public/content/${prefix}`)).status).toBe(404);
    entry = ok(
      await call("patch", `/admin/content/${entry.id}`, admin, {
        status: "published",
        expectedVersion: 1,
      }),
    );
    expect(ok(await call("get", `/public/content/${prefix}`)).data.text).toBe(
      "Draft",
    );
    expect(
      (
        await call("patch", `/admin/content/${entry.id}`, admin, {
          data: { text: "Stale" },
          expectedVersion: 1,
        })
      ).status,
    ).toBe(409);
  });
  it("stores visitor suggestions privately without creating events", async () => {
    const before = await prisma.event.count();
    suggestion = ok(
      await call("post", "/public/event-suggestions", null, {
        fullName: "Visitor",
        phone: "0901234567",
        content: "Please organize a book discussion.",
      }),
    );
    ok(
      await call("patch", `/admin/event-suggestions/${suggestion.id}`, admin, {
        status: "approved",
        internalNote: "Contacted visitor",
      }),
    );
    expect(await prisma.event.count()).toBe(before);
    expect((await call("get", "/admin/event-suggestions")).status).toBe(401);
  });
  it("does not claim an email was sent or enable unimplemented MFA", async () => {
    expect(
      (
        await call("post", "/auth/forgot-password", null, {
          email: partner.email,
        })
      ).status,
    ).toBe(503);
    expect(
      (
        await call("put", "/admin/settings", admin, {
          "admin.system": {
            security: {
              minPasswordLength: 8,
              requireSpecialChar: false,
              maxFailedAttempts: 5,
              sessionTimeoutMinutes: 15,
              twoFactorEnabled: true,
            },
          },
        })
      ).status,
    ).toBe(422);
  });
  it("resets passwords with a single-use token and invalidates old sessions", async () => {
    const login = ok(
      await call("post", "/auth/login", null, {
        email: partner.email,
        password: "Test-pass-123!",
      }),
    );
    const reset = ok(
      await call(
        "post",
        `/admin/users/${partner.id}/reset-password`,
        admin,
        {},
      ),
    );
    expect(
      JSON.stringify(
        await prisma.passwordReset.findMany({ where: { userId: partner.id } }),
      ),
    ).not.toContain(reset.resetToken);
    ok(
      await call("post", "/auth/reset-password", null, {
        token: reset.resetToken,
        newPassword: "New-password-123!",
      }),
    );
    expect(
      (
        await call("post", "/auth/reset-password", null, {
          token: reset.resetToken,
          newPassword: "New-password-123!",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .get("/api/auth/me")
          .set("Authorization", `Bearer ${login.accessToken}`)
      ).status,
    ).toBe(401);
    expect(
      (
        await call("post", "/auth/refresh", null, {
          refreshToken: login.refreshToken,
        })
      ).status,
    ).toBe(401);
    const next = ok(
      await call("post", "/auth/login", null, {
        email: partner.email,
        password: "New-password-123!",
      }),
    );
    expect(
      (
        await request(app)
          .get("/api/auth/me")
          .set("Authorization", `Bearer ${next.accessToken}`)
      ).status,
    ).toBe(200);
  });
});
