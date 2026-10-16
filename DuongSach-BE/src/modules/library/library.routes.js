import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/database.js";
import { authenticate } from "../../middlewares/auth.js";
import { authorize, requirePermission } from "../../middlewares/rbac.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { audit, parse, text, transaction, uuid } from "../../utils/contract.js";
import { LibraryService as service, assignedStall } from "./library.service.js";

const router = Router();
const admin = [authenticate, authorize("admin")];
const partner = [authenticate, authorize("partner")];
router.use("/partner", (req, res, next) => {
  if (!/^\/(books|book-submissions|book-sales)(\/|$)/.test(req.path))
    return next();
  authenticate(req, res, (error) => {
    if (error) return next(error);
    const permission =
      req.method === "GET"
        ? "library.read"
        : req.path.startsWith("/book-sales") ||
            req.body?.soldQuantity !== undefined
          ? "library.sales.update"
          : req.path.includes("/quantities")
            ? "library.inventory.update"
            : "library.submit";
    requirePermission(permission)(req, res, (error) => {
      if (error) return next(error);
      if (
        req.path.includes("/quantities") &&
        req.body?.inventoryQuantity !== undefined
      )
        return requirePermission("library.inventory.update")(req, res, next);
      next();
    });
  });
});
const run = (fn) =>
  asyncHandler(async (req, res) => ApiResponse.success(res, await fn(req)));
router.get(
  "/public/books",
  run((r) => service.books(r.query)),
);
router.get(
  "/public/books/:id",
  run((r) => service.book(r.params.id)),
);
router.get(
  "/public/books/:id/stalls",
  run((r) => service.stalls(r.params.id)),
);
router.get(
  "/public/book-stalls",
  run(() => service.stalls()),
);
router.get(
  "/public/book-stalls/:id",
  run(async (r) => {
    const rows = await service.stalls();
    const row = rows.find((x) => x.id === r.params.id);
    if (!row) throw ApiError.notFound();
    return { ...row, book: await service.book(row.bookId) };
  }),
);
router.get(
  "/public/book-rankings",
  run(() => service.rankings()),
);
router.get(
  "/admin/books",
  ...admin,
  run((r) => service.books(r.query, true)),
);
router.post(
  "/admin/books",
  ...admin,
  run((r) => service.save(null, r.body, r.user)),
);
router.patch(
  "/admin/books/:id",
  ...admin,
  run((r) => service.save(parse(uuid, r.params.id), r.body, r.user)),
);
router.delete(
  "/admin/books/:id",
  ...admin,
  run((r) =>
    service.save(parse(uuid, r.params.id), { status: "archived" }, r.user),
  ),
);
router.get(
  "/admin/book-stalls",
  ...admin,
  run(() => service.stalls(undefined, false)),
);
router.post(
  "/admin/book-stalls",
  ...admin,
  run((r) => service.assignBookStall(r.body, r.user)),
);
router.delete(
  "/admin/book-stalls/:id",
  ...admin,
  run((r) => service.removeBookStall(r.params.id, r.user)),
);
router.put(
  "/admin/book-rankings",
  ...admin,
  run((r) => service.replaceRanking(r.body, r.user)),
);
router.patch(
  "/admin/books/:id/ranking",
  ...admin,
  run((r) =>
    service.updateBookRanking(
      parse(uuid, r.params.id),
      r.body,
      r.user,
    ),
  ),
);
router.get(
  "/admin/library-stalls",
  ...admin,
  run(() => service.stallSummaries()),
);
router.get(
  "/admin/book-submissions",
  ...admin,
  run((r) => service.submissions(r.user)),
);
router.post(
  "/admin/book-submissions/:id/approve",
  ...admin,
  run((r) => service.review(r.params.id, true, null, r.user)),
);
router.post(
  "/admin/book-submissions/:id/reject",
  ...admin,
  run((r) =>
    service.review(r.params.id, false, r.body.rejectionReason, r.user),
  ),
);
router.get(
  "/admin/book-sales",
  ...admin,
  run((r) => service.sales(r.user)),
);
router.get(
  "/partner/assigned-stall",
  ...partner,
  run((r) => assignedStall(r.user)),
);
router.get(
  "/partner/books",
  ...partner,
  run((r) => service.ownBooks(r.user)),
);
router.post(
  "/partner/books",
  ...partner,
  run((r) => service.add(r.user, r.body)),
);
router.patch(
  "/partner/books/:id/quantities",
  ...partner,
  run((r) => service.quantity(r.user, r.params.id, r.body)),
);
router.delete(
  "/partner/books/:id",
  ...partner,
  run((r) => service.quantity(r.user, r.params.id, {}, true)),
);
router.get(
  "/partner/book-submissions",
  ...partner,
  run((r) => service.submissions(r.user)),
);
router.post(
  "/partner/book-submissions",
  ...partner,
  run((r) => service.submit(r.user, r.body)),
);
router.delete(
  "/partner/book-submissions/:id",
  ...partner,
  run((r) => service.cancelSubmission(r.user, r.params.id)),
);
router.get(
  "/partner/book-sales",
  ...partner,
  run((r) => service.sales(r.user)),
);
router.post(
  "/partner/book-sales",
  ...partner,
  run((r) => service.sales(r.user, r.body)),
);
for (const [path, model] of [
  ["book-categories", "bookCategory"],
  ["book-labels", "bookLabel"],
]) {
  const schema = z
    .object({
      name: text,
      ...(model === "bookCategory" ? { nameEn: text.optional() } : {}),
      status: z.enum(["active", "archived"]).optional(),
    })
    .strict();
  router.get(
    `/public/${path}`,
    run(() =>
      prisma[model].findMany({
        where: { status: "active" },
        orderBy: { name: "asc" },
      }),
    ),
  );
  router.get(
    `/admin/${path}`,
    ...admin,
    run(() => prisma[model].findMany({ orderBy: { name: "asc" } })),
  );
  router.post(
    `/admin/${path}`,
    ...admin,
    run((r) =>
      transaction(async (tx) => {
        const row = await tx[model].create({ data: parse(schema, r.body) });
        await audit(tx, r.user, "create", model, row.id);
        return row;
      }),
    ),
  );
  router.patch(
    `/admin/${path}/:id`,
    ...admin,
    run((r) =>
      transaction(async (tx) => {
        const row = await tx[model].update({
          where: { id: parse(uuid, r.params.id) },
          data: parse(schema.partial(), r.body),
        });
        await audit(tx, r.user, "update", model, row.id);
        return row;
      }),
    ),
  );
  router.delete(
    `/admin/${path}/:id`,
    ...admin,
    run((r) =>
      transaction(async (tx) => {
        const id = parse(uuid, r.params.id);
        const existing = await tx[model].findUnique({ where: { id } });
        if (!existing) throw ApiError.notFound();

        // Tự động chuyển các sách liên kết về chưa phân loại (categoryId = null)
        if (model === "bookCategory") {
          await tx.book.updateMany({
            where: { categoryId: id },
            data: { categoryId: null },
          });
        } else if (model === "bookLabel") {
          await tx.bookLabelAssignment.deleteMany({
            where: { labelId: id },
          });
        }

        const force = r.query.force === "true" || r.query.permanent === "true";
        if (force || existing.status === "archived") {
          await tx[model].delete({ where: { id } });
          await audit(tx, r.user, "delete_permanent", model, id);
          return { success: true, permanent: true };
        }

        const row = await tx[model].update({
          where: { id },
          data: { status: "archived" },
        });
        await audit(tx, r.user, "delete", model, row.id);
        return row;
      }),
    ),
  );
}
export default router;
