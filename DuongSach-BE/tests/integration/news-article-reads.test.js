import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import { prisma } from "../../src/config/database.js";
import { createApp } from "../../src/app.js";

const app = createApp();
const articleId = `read-test-${crypto.randomUUID()}`;
const slug = `read-test-${crypto.randomUUID()}`;
const sessionOne = crypto.randomUUID();
const sessionTwo = crypto.randomUUID();
let contentEntryId;

afterAll(async () => {
  if (contentEntryId) await prisma.contentEntry.delete({ where: { id: contentEntryId } }).catch(() => undefined);
  await prisma.$disconnect();
});

describe("news article read analytics", () => {
  it("stores real reads and counts one session only once per Vietnam day", async () => {
    const entry = await prisma.contentEntry.create({
      data: {
        slug,
        kind: "news",
        title: "Read analytics test",
        status: "published",
        data: { articles: [{ id: articleId, titleVi: "Bài kiểm thử", views: 9999 }] },
      },
    });
    contentEntryId = entry.id;

    const before = await request(app).get(`/api/public/content/${slug}`);
    expect(before.status, JSON.stringify(before.body)).toBe(200);
    expect(before.body.data.data.articles[0].views).toBe(0);

    for (const sessionId of [sessionOne, sessionOne, sessionTwo]) {
      const response = await request(app)
        .post(`/api/public/news/${articleId}/read`)
        .send({ sessionId });
      expect(response.status, JSON.stringify(response.body)).toBe(200);
    }

    expect(await prisma.newsArticleRead.count({ where: { contentEntryId, articleId } })).toBe(2);
    const after = await request(app).get(`/api/public/content/${slug}`);
    expect(after.body.data.data.articles[0].views).toBe(2);
  });
});
