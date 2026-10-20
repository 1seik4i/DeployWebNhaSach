import { z } from "zod";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  audit,
  parse,
  quantity,
  text,
  transaction,
  uuid,
} from "../../utils/contract.js";
import { config } from "../../config/env.js";
import { searchText, imageSource } from '../../utils/input.validation.js';

const nullableUuid = z
  .union([uuid, z.literal(""), z.null(), z.undefined()])
  .transform((v) => (v ? v : null));

const nullableText = (max = 200) =>
  z
    .union([z.string().trim().max(max), z.literal(""), z.null(), z.undefined()])
    .transform((v) => (v && v.trim() ? v.trim() : null));

const nullableInt = (min = 1, max = 2200) =>
  z
    .union([
      z.number().int().min(min).max(max),
      z.string().trim().regex(/^\d+$/).transform((v) => Number(v)),
      z.literal(""),
      z.null(),
      z.undefined(),
    ])
    .transform((v) => (typeof v === "number" && !isNaN(v) ? v : null))
    .pipe(z.number().int().min(min).max(max).nullable());

const coverUrlSchema = z
  .union([imageSource, z.null(), z.undefined()])
  .transform((v) => (v && v.trim() ? v.trim() : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80'));

export const bookInput = z.object({
  isbn: z.string().trim().min(1).max(32),
  title: text,
  titleEn: nullableText(200).optional(),
  author: text,
  publisher: nullableText(200).optional(),
  coverUrl: coverUrlSchema.optional(),
  description: z.union([z.string().trim().max(20000), z.literal(""), z.null(), z.undefined()]).transform((v) => (v && v.trim() ? v.trim() : null)).optional(),
  publicationYear: nullableInt(1, 2200).optional(),
  categoryId: nullableUuid.optional(),
  labelIds: z.array(uuid).max(50).optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
  stallId: nullableUuid.optional(),
  inventoryQuantity: quantity.nullish(),
});
const partnerInput = bookInput
  .omit({ labelIds: true, status: true, stallId: true })
  .partial({ coverUrl: true, categoryId: true })
  .strict();
const includeBook = {
  category: true,
  labels: { include: { label: true } },
  stalls: {
    where: { stall: { isDeleted: false } },
    include: { stall: true },
  },
};
export const mapBook = (b) => ({
  ...b,
  labelIds: b.labels?.map((x) => x.labelId) || [],
  labels: b.labels?.map((x) => x.label) || [],
  stalls: b.stalls?.map((s) => ({
    id: s.id,
    stallId: s.stallId,
    stallName: s.stall?.name,
    stallCode: s.stall?.code,
    inventoryQuantity: s.inventoryQuantity,
    soldQuantity: s.soldQuantity,
  })) || [],
});
export const mapStall = (b) => ({
  ...b,
  stall: undefined,
  stallName: b.stall?.name,
  stallCode: b.stall?.code,
  qrData: `${config.publicWebUrl.replace(/\/$/, "")}/thu-vien-so?book=${b.bookId}&stall=${b.stallId}`,
  availabilityStatus:
    b.inventoryQuantity === 0
      ? "out_of_stock"
      : b.inventoryQuantity <= 4
        ? "low_stock"
        : "available",
});
const mapSubmission = (s) => ({
  ...s,
  stall: undefined,
  stallName: s.stall?.name,
  stallCode: s.stall?.code,
  submitterName: s.submitter?.fullName || s.submitter?.email,
});
export async function assignedStall(user, db = prisma) {
  const row = await db.userStallAssignment.findUnique({
    where: { userId: user.id },
    include: { stall: true },
  });
  if (!row || row.stall.isDeleted)
    throw ApiError.forbidden("Tài khoản chưa được Admin phân công gian hàng");
  return row.stall;
}
async function saveBook(db, id, input) {
  const { labelIds, stallId, inventoryQuantity, categoryName, ...rest } = input;
  const data = { ...rest };

  if (!id && (!data.coverUrl || !data.coverUrl.trim())) {
    data.coverUrl = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80';
  }

  if (!data.categoryId && categoryName) {
    const matchedCategory = await db.bookCategory.findFirst({
      where: { name: { contains: categoryName, mode: 'insensitive' } },
    });
    if (matchedCategory) {
      data.categoryId = matchedCategory.id;
    }
  }

  const allowed = [
    'isbn',
    'title',
    'titleEn',
    'author',
    'publisher',
    'coverUrl',
    'description',
    'publicationYear',
    'categoryId',
    'status',
  ];
  const cleanData = {};
  for (const k of allowed) {
    if (data[k] !== undefined) {
      cleanData[k] = data[k];
    }
  }

  if (labelIds) {
    if (
      (await db.bookLabel.count({
        where: { id: { in: [...new Set(labelIds)] }, status: "active" },
      })) !== new Set(labelIds).size
    )
      throw ApiError.validation("Nhãn không hợp lệ");
    cleanData.labels = {
      ...(id ? { deleteMany: {} } : {}),
      create: [...new Set(labelIds)].map((labelId) => ({ labelId })),
    };
  }
  if (
    cleanData.categoryId &&
    !(await db.bookCategory.findFirst({
      where: { id: cleanData.categoryId, status: "active" },
    }))
  )
    throw ApiError.validation("Danh mục không hợp lệ");

  const book = await (id
    ? db.book.update({
        where: { id },
        data: { ...cleanData, version: { increment: 1 } },
        include: includeBook,
      })
    : db.book.create({ data: cleanData, include: includeBook }));

  if (stallId) {
    await db.bookStall.upsert({
      where: { bookId_stallId: { bookId: book.id, stallId } },
      create: {
        bookId: book.id,
        stallId,
        inventoryQuantity: inventoryQuantity || 0,
        soldQuantity: 0,
      },
      update: {
        ...(inventoryQuantity !== undefined && inventoryQuantity !== null ? { inventoryQuantity } : {}),
      },
    });
  }

  const result = await db.book.findUnique({
    where: { id: book.id },
    include: includeBook,
  });

  return mapBook(result || book);
}
export const LibraryService = {
  async stallSummaries() {
    const rows = await prisma.booth.findMany({
      where: { isDeleted: false },
      include: {
        libraryUsers: {
          include: {
            user: { select: { id: true, email: true, fullName: true, status: true } },
          },
        },
        bookStalls: {
          select: { inventoryQuantity: true, soldQuantity: true },
        },
      },
      orderBy: { code: "asc" },
    });
    return rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      account: row.libraryUsers[0]?.user || null,
      bookCount: row.bookStalls.length,
      inventoryQuantity: row.bookStalls.reduce((sum, item) => sum + item.inventoryQuantity, 0),
      soldQuantity: row.bookStalls.reduce((sum, item) => sum + (item.soldQuantity || 0), 0),
    }));
  },
  async books(query = {}, admin = false) {
    query = parse(z.object({ search: searchText.optional(), searchMode: z.enum(["title_isbn"]).optional(), title: searchText.optional(), categoryId: uuid.optional(), stallId: uuid.optional() }), query);
    const where = {
      ...(!admin ? { status: "active" } : {}),
      ...(query.categoryId
        ? { categoryId: parse(uuid, query.categoryId) }
        : {}),
      ...(query.stallId
        ? { stalls: { some: { stallId: parse(uuid, query.stallId) } } }
        : {}),
      ...(query.title
        ? { title: { contains: query.title, mode: "insensitive" } }
        : {}),
      ...(query.search
        ? {
            OR: (query.searchMode === "title_isbn" ? ["title", "isbn"] : ["title", "isbn", "author"]).map((k) => ({
              [k]: { contains: String(query.search), mode: "insensitive" },
            })),
          }
        : {}),
    };
    return (
      await prisma.book.findMany({
        where,
        include: includeBook,
        orderBy: { title: "asc" },
      })
    ).map(mapBook);
  },
  async book(id, admin = false) {
    const b = await prisma.book.findFirst({
      where: { id: parse(uuid, id), ...(!admin ? { status: "active" } : {}) },
      include: includeBook,
    });
    if (!b) throw ApiError.notFound("Không tìm thấy sách");
    return mapBook(b);
  },
  async save(id, input, user) {
    const data = parse(
      id ? bookInput.partial().strict() : bookInput.strict(),
      input,
    );
    return transaction(async (tx) => {
      const b = await saveBook(tx, id, data);
      await audit(tx, user, id ? "update" : "create", "Book", b.id);
      return b;
    });
  },
  async deleteBook(id, force = false, user) {
    return transaction(async (tx) => {
      const bookId = parse(uuid, id);
      const existing = await tx.book.findUnique({ where: { id: bookId } });
      if (!existing) throw ApiError.notFound("Không tìm thấy sách");

      if (force || existing.status === "archived") {
        await tx.bookRanking.deleteMany({ where: { bookId } });
        await tx.bookLabelAssignment.deleteMany({ where: { bookId } });
        await tx.bookStall.deleteMany({ where: { bookId } });
        await tx.bookSubmission.deleteMany({ where: { bookId } });
        await tx.bookSale.deleteMany({ where: { bookId } });
        await tx.book.delete({ where: { id: bookId } });
        await audit(tx, user, "delete_permanent", "Book", bookId, { title: existing.title });
        return { success: true, permanent: true };
      }

      const b = await tx.book.update({
        where: { id: bookId },
        data: { status: "archived" },
        include: includeBook,
      });
      await audit(tx, user, "archive", "Book", bookId);
      return mapBook(b);
    });
  },
  async restoreBook(id, user) {
    return transaction(async (tx) => {
      const bookId = parse(uuid, id);
      const existing = await tx.book.findUnique({ where: { id: bookId } });
      if (!existing) throw ApiError.notFound("Không tìm thấy sách");
      const b = await tx.book.update({
        where: { id: bookId },
        data: { status: "active" },
        include: includeBook,
      });
      await audit(tx, user, "restore", "Book", bookId);
      return mapBook(b);
    });
  },
  async stalls(bookId, publicOnly = true) {
    return (
      await prisma.bookStall.findMany({
        where: {
          ...(bookId ? { bookId: parse(uuid, bookId) } : {}),
          stall: { isDeleted: false },
          ...(publicOnly ? { book: { status: "active" } } : {}),
        },
        include: { stall: true },
      })
    ).map(mapStall);
  },
  async ownBooks(user) {
    const stall = await assignedStall(user);
    const rows = await prisma.bookStall.findMany({
      where: { stallId: stall.id },
      include: { stall: true, book: { include: includeBook } },
    });
    const submissions = await this.submissions(user);
    return rows.map((row) => {
      const latestSubmission = submissions.find((s) => s.bookId === row.bookId);
      return {
        book: mapBook(row.book),
        stall: mapStall(row),
        latestSubmission,
        contentStatus: latestSubmission?.status || "APPROVED",
      };
    });
  },
  async submissions(user) {
    const stall =
      user.primaryRole === "admin" ? null : await assignedStall(user);
    return (
      await prisma.bookSubmission.findMany({
        where: stall ? { stallId: stall.id } : {},
        include: { stall: true, submitter: { select: { id: true, fullName: true, email: true } } },
        orderBy: { submittedAt: "desc" },
      })
    ).map(mapSubmission);
  },
  async cancelSubmission(user, id) {
    return transaction(async tx => {
      const stall = await assignedStall(user, tx);
      const s = await tx.bookSubmission.findUnique({
        where: { id: parse(uuid, id) },
      });
      if (!s || s.stallId !== stall.id) throw ApiError.notFound("Không tìm thấy yêu cầu");
      if (s.status !== "PENDING") throw ApiError.conflict("Chỉ có thể hủy yêu cầu đang chờ duyệt");
      await tx.bookSubmission.delete({ where: { id: s.id } });
      await audit(tx, user, 'cancel', 'BookSubmission', s.id);
      return { success: true };
    });
  },
  async assignBookStall(input, user) {
    const data = parse(
      z.object({
        bookId: uuid,
        stallId: uuid,
        inventoryQuantity: quantity.default(0),
      }).strict(),
      input
    );
    return transaction(async (tx) => {
      const row = await tx.bookStall.upsert({
        where: { bookId_stallId: { bookId: data.bookId, stallId: data.stallId } },
        create: { ...data, soldQuantity: 0 },
        update: { inventoryQuantity: data.inventoryQuantity },
        include: { stall: true },
      });
      await audit(tx, user, "upsert", "BookStall", row.id);
      return mapStall(row);
    });
  },
  async removeBookStall(id, user) {
    return transaction(async (tx) => {
      const row = await tx.bookStall.findUnique({ where: { id: parse(uuid, id) } });
      if (!row) throw ApiError.notFound();
      await tx.bookStall.delete({ where: { id: row.id } });
      await audit(tx, user, "delete", "BookStall", row.id);
      return { success: true };
    });
  },
  async submit(user, input) {
    const data = parse(
      z
        .object({
          bookId: uuid.optional(),
          proposedData: z.record(z.unknown()),
          inventoryQuantity: quantity.default(0),
          soldQuantity: quantity.nullish(),
        })
        .strict(),
      input,
    );
    const proposedData = parse(
      data.bookId ? partnerInput.partial() : partnerInput,
      data.proposedData,
    );
    return transaction(async (tx) => {
      const stall = await assignedStall(user, tx);
      let book;
      if (data.bookId) {
        const owned = await tx.bookStall.findUnique({
          where: { bookId_stallId: { bookId: data.bookId, stallId: stall.id } },
          include: { book: true },
        });
        if (!owned)
          throw ApiError.notFound("Sách không thuộc gian hàng được phân công");
        book = owned.book;
      }
      if (
        await tx.bookSubmission.findFirst({
          where: {
            stallId: stall.id,
            status: "PENDING",
            ...(book
              ? { bookId: book.id }
              : {
                  proposedData: { path: ["isbn"], equals: proposedData.isbn },
                }),
          },
        })
      )
        throw ApiError.conflict("Đã có yêu cầu đang chờ duyệt");
      const s = await tx.bookSubmission.create({
        data: {
          ...data,
          proposedData,
          stallId: stall.id,
          type: book ? "UPDATE" : "CREATE",
          submittedBy: user.id,
          ...(book
            ? {
                bookVersion: book.version,
                currentApprovedData: JSON.parse(JSON.stringify(book)),
              }
            : {}),
        },
        include: { stall: true },
      });
      await audit(tx, user, "create", "BookSubmission", s.id);
      return mapSubmission(s);
    });
  },
  async review(id, approved, reason, user) {
    if (!approved) parse(text, reason);
    return transaction(async (tx) => {
      const s = await tx.bookSubmission.findUnique({
        where: { id: parse(uuid, id) },
      });
      if (!s) throw ApiError.notFound();
      if (s.status !== "PENDING")
        throw ApiError.conflict("Yêu cầu đã được xử lý");
      let bookId = s.bookId;
      if (approved) {
        if (s.type === "UPDATE") {
          const b = await tx.book.findUnique({ where: { id: bookId } });
          if (!b || b.version !== s.bookVersion)
            throw ApiError.conflict(
              "Bản sách đã thay đổi; cần gửi lại yêu cầu",
            );
        }
        const b = await saveBook(tx, bookId, s.proposedData);
        bookId = b.id;
        if (s.type === "CREATE")
          await tx.bookStall.upsert({
            where: { bookId_stallId: { bookId, stallId: s.stallId } },
            create: {
              bookId,
              stallId: s.stallId,
              inventoryQuantity: s.inventoryQuantity,
              soldQuantity: s.soldQuantity || 0,
            },
            update: {
              inventoryQuantity: s.inventoryQuantity,
            },
          });
      }
      const result = await tx.bookSubmission.update({
        where: { id },
        data: {
          bookId,
          status: approved ? "APPROVED" : "REJECTED",
          reviewedBy: user.id,
          reviewedAt: new Date(),
          rejectionReason: approved ? null : reason,
        },
        include: { stall: true },
      });
      await tx.notification.create({
        data: {
          userId: s.submittedBy,
          title: approved ? "Sách đã được duyệt" : "Yêu cầu sách bị từ chối",
          message: reason || "Nội dung sách đã được cập nhật.",
          kind: "system",
        },
      });
      await audit(
        tx,
        user,
        approved ? "approve" : "reject",
        "BookSubmission",
        id,
      );
      return mapSubmission(result);
    });
  },
  async add(user, input) {
    const data = parse(
      z
        .object({
          bookId: uuid,
          inventoryQuantity: quantity,
          soldQuantity: quantity.nullish(),
        })
        .strict(),
      input,
    );
    return transaction(async (tx) => {
      const stall = await assignedStall(user, tx);
      if (
        !(await tx.book.findFirst({
          where: { id: data.bookId, status: "active" },
        }))
      )
        throw ApiError.notFound("Không tìm thấy sách công khai");
      const row = await tx.bookStall.create({
        data: { ...data, stallId: stall.id },
        include: { stall: true },
      });
      await audit(tx, user, "create", "BookStall", row.id);
      return mapStall(row);
    });
  },
  async quantity(user, bookId, input, remove = false) {
    const data = parse(
      z
        .object({
          inventoryQuantity: quantity.optional(),
          soldQuantity: quantity.nullish(),
          expectedVersion: quantity.optional(),
        })
        .strict(),
      input,
    );
    return transaction(async (tx) => {
      const stall = await assignedStall(user, tx);
      const row = await tx.bookStall.findUnique({
        where: {
          bookId_stallId: { bookId: parse(uuid, bookId), stallId: stall.id },
        },
      });
      if (!row) throw ApiError.notFound();
      if (
        data.expectedVersion !== undefined &&
        data.expectedVersion !== row.version
      )
        throw ApiError.conflict("Dữ liệu đã thay đổi");
      const { expectedVersion, ...changes } = data;
      const result = remove
        ? await tx.bookStall.delete({ where: { id: row.id } })
        : await tx.bookStall.update({
            where: { id: row.id },
            data: { ...changes, version: { increment: 1 } },
            include: { stall: true },
          });
      await audit(tx, user, remove ? "delete" : "update", "BookStall", row.id, {
        before: row,
        after: changes,
      });
      return remove ? { deleted: true } : mapStall(result);
    });
  },
  async sales(user, rows) {
    if (!rows) {
      const stall =
        user.primaryRole === "admin" ? null : await assignedStall(user);
      return (
        await prisma.bookSale.findMany({
          where: stall ? { boothId: stall.id } : {},
          include: { book: true },
          orderBy: { createdAt: "desc" },
        })
      ).map((s) => ({
        ...s,
        book: undefined,
        isbn: s.book.isbn,
        bookTitle: s.book.title,
      }));
    }
    const data = parse(
      z
        .array(
          z.object({
            bookId: uuid,
            quantity: z.number().int().min(1).max(1000000),
            soldDate: z.string().date(),
          }),
        )
        .min(1)
        .max(100),
      rows,
    );
    return transaction(async (tx) => {
      const stall = await assignedStall(user, tx);
      const result = [];
      for (const row of data) {
        const stock = await tx.bookStall.findUnique({
          where: {
            bookId_stallId: { bookId: row.bookId, stallId: stall.id },
          },
        });
        if (!stock)
          throw ApiError.forbidden("Sách không thuộc gian hàng");
        if (stock.inventoryQuantity < row.quantity)
          throw ApiError.conflict(`Tồn kho không đủ cho sách ${row.bookId}`);
        result.push(
          await tx.bookSale.create({
            data: {
              ...row,
              soldDate: new Date(row.soldDate),
              boothId: stall.id,
            },
          }),
        );
        await tx.bookStall.update({
          where: { id: stock.id },
          data: {
            inventoryQuantity: { decrement: row.quantity },
            soldQuantity: (stock.soldQuantity || 0) + row.quantity,
            version: { increment: 1 },
          },
        });
      }
      await audit(tx, user, "create", "BookSale", null, {
        count: result.length,
      });
      return result;
    });
  },
  async rankings() {
    const books = await this.books();
    const since = new Date(Date.now() - 7 * 86400000);
    const [all, week] = await Promise.all([
      prisma.bookStall.groupBy({
        by: ["bookId"],
        _sum: { soldQuantity: true },
      }),
      prisma.bookSale.groupBy({
        by: ["bookId"],
        where: { soldDate: { gte: since } },
        _sum: { quantity: true },
      }),
    ]);
    const automatic = (rows, key) =>
      rows
        .filter((r) => r._sum[key] > 0)
        .sort(
          (a, b) =>
            b._sum[key] - a._sum[key] || a.bookId.localeCompare(b.bookId),
        )
        .map((r) => ({
          book: books.find((b) => b.id === r.bookId),
          count: r._sum[key],
        }))
        .filter((r) => r.book)
        .slice(0, 100);
    const [bestsellerOverrides, weeklyOverrides] = await Promise.all([
      prisma.bookRanking.findMany({
        where: { rankingType: "bestseller", book: { status: "active" } },
        orderBy: { rank: "asc" },
      }),
      prisma.bookRanking.findMany({
        where: { rankingType: "weekly_hot", book: { status: "active" } },
        orderBy: { rank: "asc" },
      }),
    ]);
    const build = (rows, overrides, field, countField, sourceField) => {
      const auto = automatic(rows, countField);
      const countByBook = new Map(auto.map((row) => [row.book.id, row.count]));
      const overrideIds = overrides.map((row) => row.bookId);
      const orderedIds = [
        ...overrideIds,
        ...auto.map((row) => row.book.id).filter((id) => !overrideIds.includes(id)),
      ].slice(0, 100);
      const overrideSet = new Set(overrideIds);
      return orderedIds
        .map((bookId, index) => {
          const book = books.find((item) => item.id === bookId);
          if (!book) return null;
          return {
            ...book,
            [field]: index + 1,
            [countField === "soldQuantity" ? "totalSold" : "weeklySold"]: countByBook.get(bookId) || 0,
            [sourceField]: overrideSet.has(bookId) ? "admin" : "auto",
          };
        })
        .filter(Boolean);
    };
    return {
      bestsellers: build(all, bestsellerOverrides, "bestsellerRank", "soldQuantity", "bestsellerSource"),
      weeklyHot: build(week, weeklyOverrides, "weeklyRank", "quantity", "weeklySource"),
      configuration: {
        formula: "reported-sales",
        period: "rolling-7-days",
        resultCount: 100,
        provisional: true,
      },
    };
  },
  async replaceRanking(input, user) {
    const data = parse(
      z.object({
        rankingType: z.enum(["bestseller", "weekly_hot"]),
        bookIds: z.array(uuid).max(100).refine((ids) => new Set(ids).size === ids.length, "Danh sách sách bị trùng"),
      }).strict(),
      input,
    );
    return transaction(async (tx) => {
      const activeCount = await tx.book.count({
        where: { id: { in: data.bookIds }, status: "active" },
      });
      if (activeCount !== data.bookIds.length)
        throw ApiError.validation("Danh sách xếp hạng chứa sách không tồn tại hoặc đã lưu trữ");
      await tx.bookRanking.deleteMany({ where: { rankingType: data.rankingType } });
      if (data.bookIds.length) {
        await tx.bookRanking.createMany({
          data: data.bookIds.map((bookId, index) => ({
            bookId,
            rankingType: data.rankingType,
            rank: index + 1,
            updatedBy: user.id,
          })),
        });
      }
      await audit(tx, user, "update", "BookRanking", null, {
        rankingType: data.rankingType,
        bookIds: data.bookIds,
      });
      return { rankingType: data.rankingType, count: data.bookIds.length };
    });
  },
  async updateBookRanking(bookId, { bestsellerRank, weeklyRank }, user) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw ApiError.notFound("Không tìm thấy sách");

    const currentRankings = await this.rankings();

    if (bestsellerRank !== undefined) {
      let ids = currentRankings.bestsellers.map((b) => b.id).filter((id) => id !== bookId);
      if (typeof bestsellerRank === "number" && bestsellerRank > 0) {
        const targetIndex = Math.min(Math.max(0, bestsellerRank - 1), ids.length);
        ids.splice(targetIndex, 0, bookId);
      }
      await this.replaceRanking({ rankingType: "bestseller", bookIds: ids }, user);
    }

    if (weeklyRank !== undefined) {
      let ids = currentRankings.weeklyHot.map((b) => b.id).filter((id) => id !== bookId);
      if (typeof weeklyRank === "number" && weeklyRank > 0) {
        const targetIndex = Math.min(Math.max(0, weeklyRank - 1), ids.length);
        ids.splice(targetIndex, 0, bookId);
      }
      await this.replaceRanking({ rankingType: "weekly_hot", bookIds: ids }, user);
    }

    return { success: true, bookId };
  },
};

