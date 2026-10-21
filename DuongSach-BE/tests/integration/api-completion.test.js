import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../src/config/database.js";
import { config } from "../../src/config/env.js";
import { createApp } from "../../src/app.js";

const app = createApp(),
  prefix = `api-${crypto.randomUUID()}`,
  users = [],
  booths = [],
  books = [];
let admin, partner, other, venue, category, submission, book;
const token = (u) =>
  jwt.sign({ userId: u.id }, config.jwt.accessSecret, { expiresIn: "1h" });
const call = (method, path, user, data) => {
  let q = request(app)[method]("/api" + path);
  if (user) q = q.set("Authorization", `Bearer ${token(user)}`);
  return data === undefined ? q : q.send(data);
};
beforeAll(async () => {
  for (const role of ["admin", "partner", "partner"])
    users.push(
      await prisma.user.create({
        data: {
          fullName: prefix,
          email: `${role}-${crypto.randomUUID()}@example.test`,
          passwordHash: "unused",
          primaryRole: role,
          status: "active",
        },
      }),
    );
  [admin, partner, other] = users;
  const role = await prisma.role.upsert({
    where: { code: "partner" },
    create: { code: "partner", name: "Partner" },
    update: {},
  });
  for (const code of [
    "library.read",
    "library.submit",
    "library.inventory.update",
    "library.sales.update",
  ]) {
    const p = await prisma.permission.upsert({
      where: { code },
      create: { code, name: code, module: "library" },
      update: {},
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } },
      create: { roleId: role.id, permissionId: p.id },
      update: {},
    });
  }
  venue = await prisma.venue.create({
    data: { name: prefix, facility: prefix, capacity: 100 },
  });
  for (let i = 0; i < 2; i++) {
    const location = await prisma.location.create({
      data: {
        venueId: venue.id,
        code: `T${i}`,
        name: prefix,
        kind: "booth",
        capacity: 100,
      },
    });
    booths.push(
      await prisma.booth.create({
        data: {
          locationId: location.id,
          code: `T${crypto.randomUUID().slice(0, 12)}`,
          name: prefix,
        },
      }),
    );
  }
  for (const [i, u] of [partner, other].entries())
    await prisma.userStallAssignment.create({
      data: { userId: u.id, stallId: booths[i].id },
    });
});
afterAll(async () => {
  const ids = users.map((u) => u.id),
    stallIds = booths.map((b) => b.id);
  await prisma.bookSubmission.deleteMany({
    where: { stallId: { in: stallIds } },
  });
  await prisma.bookSale.deleteMany({ where: { boothId: { in: stallIds } } });
  await prisma.bookStall.deleteMany({ where: { stallId: { in: stallIds } } });
  await prisma.book.deleteMany({ where: { id: { in: books } } });
  if (category)
    await prisma.bookCategory.delete({ where: { id: category.id } });
  await prisma.auditLog.deleteMany({ where: { actorId: { in: ids } } });
  await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
  await prisma.userStallAssignment.deleteMany({
    where: { userId: { in: ids } },
  });
  await prisma.booth.deleteMany({ where: { id: { in: stallIds } } });
  await prisma.location.deleteMany({ where: { venueId: venue.id } });
  await prisma.venue.delete({ where: { id: venue.id } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});
describe("Completed FE contracts", () => {
  it.each([
    "/admin/users",
    "/admin/dashboard",
    "/admin/settings",
    "/admin/content",
    "/admin/notifications",
    "/admin/audit-logs",
    "/admin/activities",
    "/admin/partner-applications",
    "/admin/activity-proposals",
    "/admin/reports",
    "/admin/books",
    "/admin/book-submissions",
  ])("protects %s", async (path) => {
    expect((await call("get", path)).status).toBe(401);
  });
  it.each([
    "/admin/users",
    "/admin/dashboard",
    "/admin/settings",
    "/admin/content",
    "/admin/notifications",
    "/admin/audit-logs",
    "/admin/activities",
    "/admin/partner-applications",
    "/admin/activity-proposals",
    "/admin/reports",
  ])("serves %s from the database", async (path) => {
    const response = await call("get", path, admin);
    expect(response.status, JSON.stringify(response.body)).toBe(200);
  });
  it("restricts taxonomy to Admin", async () => {
    expect(
      (await call("post", "/admin/book-categories", partner, { name: prefix }))
        .status,
    ).toBe(403);
    const r = await call("post", "/admin/book-categories", admin, {
      name: prefix,
    });
    expect(r.status).toBe(200);
    category = r.body.data;
  });
  it("keeps submitted books private and rejects invalid classification", async () => {
    const input = {
      isbn: `978${crypto.randomInt(10 ** 10).toString().padStart(10, '0')}`,
      title: prefix,
      author: "Test",
      coverUrl: "/cover.png",
    };
    expect(
      (
        await call("post", "/partner/book-submissions", partner, {
          proposedData: { ...input, categoryId: 'invalid-category-id' },
        })
      ).status,
    ).toBe(422);
    expect(
      (
        await call("post", "/partner/book-submissions", partner, {
          proposedData: { ...input, isbn: "978604ABC1234" },
        })
      ).status,
    ).toBe(422);
    const r = await call("post", "/partner/book-submissions", partner, {
      proposedData: input,
      inventoryQuantity: 10,
    });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    submission = r.body.data;
    expect(
      (await call("get", `/public/books?search=${encodeURIComponent(prefix)}`))
        .body.data,
    ).toEqual([]);
    expect(
      (await call("get", "/partner/book-submissions", other)).body.data,
    ).toEqual([]);
  });
  it("approves exactly once under concurrent requests", async () => {
    const results = await Promise.all([
      call(
        "post",
        `/admin/book-submissions/${submission.id}/approve`,
        admin,
        {},
      ),
      call(
        "post",
        `/admin/book-submissions/${submission.id}/approve`,
        admin,
        {},
      ),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    book = results.find((r) => r.status === 200).body.data.bookId;
    books.push(book);
    const rows = (
      await call("get", `/public/books?search=${encodeURIComponent(prefix)}`)
    ).body.data;
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(book);
  });
  it("preserves approved content while an update is pending", async () => {
    const r = await call("post", "/partner/book-submissions", partner, {
      bookId: book,
      proposedData: { title: "Changed title" },
    });
    expect(r.status).toBe(200);
    expect((await call("get", `/public/books/${book}`)).body.data.title).toBe(
      prefix,
    );
    expect(
      (
        await call(
          "post",
          `/admin/book-submissions/${r.body.data.id}/reject`,
          admin,
          { rejectionReason: "Needs correction" },
        )
      ).status,
    ).toBe(200);
    expect((await call("get", `/public/books/${book}`)).body.data.title).toBe(
      prefix,
    );
  });
  it('keeps existing book fields when admin only patches the title', async () => {
    const before = (await call('get', `/public/books/${book}`)).body.data;
    const update = await call('patch', `/admin/books/${book}`, admin, { title: `${prefix} edited` });
    expect(update.status, JSON.stringify(update.body)).toBe(200);
    expect(update.body.data.coverUrl).toBe(before.coverUrl);
    expect(update.body.data.author).toBe(before.author);
    expect(update.body.data.publisher).toBe(before.publisher);
    await call('patch', `/admin/books/${book}`, admin, { title: prefix });
  });
  it("blocks cross-stall mutations and validates quantities", async () => {
    expect(
      (
        await call("patch", `/partner/books/${book}/quantities`, other, {
          inventoryQuantity: 20,
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await call("patch", `/partner/books/${book}/quantities`, partner, {
          inventoryQuantity: -1,
        })
      ).status,
    ).toBe(422);
    const r = await call(
      "patch",
      `/partner/books/${book}/quantities`,
      partner,
      { soldQuantity: null },
    );
    expect(r.status).toBe(200);
    expect(r.body.data.soldQuantity).toBeNull();
    expect(
      (
        await call("patch", `/partner/books/${book}/quantities`, partner, {
          inventoryQuantity: 3,
          expectedVersion: 0,
        })
      ).status,
    ).toBe(409);
  });
  it("keeps QR identity distinct for the same book at two stalls", async () => {
    const r = await call("post", "/partner/books", other, {
      bookId: book,
      inventoryQuantity: 5,
    });
    expect(r.status).toBe(200);
    const rows = (await call("get", `/public/books/${book}/stalls`)).body.data;
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((r) => r.id)).size).toBe(2);
    expect(
      (await call("get", `/public/book-stalls/${r.body.data.id}`)).body.data
        .stallId,
    ).toBe(booths[1].id);
  });
  it("revokes assignment immediately", async () => {
    expect(
      (
        await call("put", `/admin/users/${other.id}/stall-assignment`, admin, {
          stallId: null,
        })
      ).status,
    ).toBe(200);
    expect((await call("get", "/partner/books", other)).status).toBe(403);
  });
  it("limits notifications to their owner", async () => {
    const row = await prisma.notification.create({
      data: { userId: other.id, title: "Private", message: "Private" },
    });
    expect(
      (
        await call(
          "patch",
          `/partner/notifications/${row.id}/read`,
          partner,
          {},
        )
      ).status,
    ).toBe(404);
    expect(
      (await prisma.notification.findUnique({ where: { id: row.id } })).isRead,
    ).toBe(false);
  });
  it("never returns password hashes in user lists", async () => {
    const r = await call("get", "/admin/users", admin);
    expect(r.status).toBe(200);
    expect(JSON.stringify(r.body)).not.toContain("passwordHash");
  });
});
