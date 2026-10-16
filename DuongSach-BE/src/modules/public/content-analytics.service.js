import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/ApiError.js";

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

function vietnamDatabaseDay(value = new Date()) {
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
  return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
}

export async function decorateContentWithReadCounts(value, db = prisma) {
  const rows = Array.isArray(value) ? value : [value];
  const newsRows = rows.filter((row) => row?.kind === "news" && Array.isArray(row.data?.articles));
  if (!newsRows.length) return value;

  const grouped = await db.newsArticleRead.groupBy({
    by: ["contentEntryId", "articleId"],
    where: { contentEntryId: { in: newsRows.map((row) => row.id) } },
    _count: { _all: true },
  });
  const counts = new Map(grouped.map((item) => [`${item.contentEntryId}:${item.articleId}`, item._count._all]));
  const decorated = rows.map((row) => {
    if (row?.kind !== "news" || !Array.isArray(row.data?.articles)) return row;
    return {
      ...row,
      data: {
        ...row.data,
        articles: row.data.articles.map((article) => ({
          ...article,
          views: counts.get(`${row.id}:${article.id}`) ?? 0,
        })),
      },
    };
  });
  return Array.isArray(value) ? decorated : decorated[0];
}

export async function recordNewsArticleRead({ articleId, sessionId }, db = prisma) {
  const entries = await db.contentEntry.findMany({
    where: { kind: "news", status: "published" },
    orderBy: { updatedAt: "desc" },
  });
  const entry = entries.find((item) =>
    Array.isArray(item.data?.articles) && item.data.articles.some((article) => article?.id === articleId),
  );
  if (!entry) throw ApiError.notFound("Không tìm thấy bài viết");

  const day = vietnamDatabaseDay();
  await db.newsArticleRead.upsert({
    where: {
      contentEntryId_articleId_sessionId_day: {
        contentEntryId: entry.id,
        articleId,
        sessionId,
        day,
      },
    },
    create: { contentEntryId: entry.id, articleId, sessionId, day },
    update: {},
  });
  const viewCount = await db.newsArticleRead.count({ where: { contentEntryId: entry.id, articleId } });
  return { articleId, viewCount };
}
