import { Router } from "express";
import { imageSourceFor } from '../../utils/input.validation.js';
import { z } from "zod";
import { prisma } from "../../config/database.js";
import { authenticate } from "../../middlewares/auth.js";
import { authorize } from "../../middlewares/rbac.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { audit, parse, transaction, uuid } from "../../utils/contract.js";
const router = Router();

router.get(
  "/public/map-config",
  asyncHandler(async (_r, s) =>
    ApiResponse.success(
      s,
      (await prisma.setting.findUnique({ where: { key: "public.map" } }))
        ?.value || {},
    ),
  ),
);

const isUuid = (val) =>
  typeof val === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

const idOrCode = (val) =>
  isUuid(val) ? { OR: [{ id: val }, { code: val }] } : { code: val };

const heritageCondition = (val) =>
  isUuid(val)
    ? { OR: [{ id: val }, { code: val }, { slug: val }] }
    : { OR: [{ code: val }, { slug: val }] };

// Cập nhật vị trí đơn lẻ cho 1 điểm bản đồ (Booth / Location / Heritage / MapHotspot)
router.patch(
  "/admin/map-hotspots/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (r, s) => {
    const { id } = r.params;
    const { x, y } = parse(
      z
        .object({
          x: z.number().min(0).max(100),
          y: z.number().min(0).max(100),
        })
        .strict(),
      r.body,
    );

    const result = await transaction(async (tx) => {
      let targetType = "Booth";
      let targetId = id;

      // 1. Tìm theo gian hàng (Booth)
      const booth = await tx.booth.findFirst({
        where: { ...idOrCode(id), isDeleted: false },
      });
      if (booth) {
        await tx.location.update({
          where: { id: booth.locationId },
          data: { mapX: x, mapY: y },
        });
        targetType = "Booth";
        targetId = booth.id;
      } else {
        // 2. Tìm theo địa điểm / sân khấu (Location)
        const location = await tx.location.findFirst({
          where: { ...idOrCode(id), isDeleted: false },
        });
        if (location) {
          await tx.location.update({
            where: { id: location.id },
            data: { mapX: x, mapY: y },
          });
          targetType = "Location";
          targetId = location.id;
        } else {
          // 3. Tìm theo di sản (Heritage)
          const heritage = await tx.heritage.findFirst({
            where: { ...heritageCondition(id), isDeleted: false },
          });
          if (heritage) {
            await tx.heritage.update({
              where: { id: heritage.id },
              data: { mapX: x, mapY: y },
            });
            targetType = "Heritage";
            targetId = heritage.id;
          } else {
            // 4. Tìm theo mapHotspot cấu hình sẵn
            const hotspot = await tx.mapHotspot.findFirst({
              where: idOrCode(id),
            });
            if (hotspot) {
              await tx.mapHotspot.update({
                where: { id: hotspot.id },
                data: { x, y },
              });
              targetType = "MapHotspot";
              targetId = hotspot.id;
            } else {
              throw ApiError.notFound(`Không tìm thấy điểm bản đồ có mã hoặc ID: ${id}`);
            }
          }
        }
      }

      await audit(tx, r.user, "update", targetType, targetId, { x, y });
      return { id: targetId, x, y, targetType };
    });

    return ApiResponse.success(s, result);
  }),
);

// Cập nhật hàng loạt vị trí bản đồ và cấu hình ảnh nền
router.put(
  "/admin/map-config",
  authenticate,
  authorize("admin"),
  asyncHandler(async (r, s) => {
    const input = parse(
      z
        .object({
          imageUrl: imageSourceFor(4 * Math.ceil(20 * 1024 * 1024 / 3) + 1024).optional(),
          points: z
            .array(
              z.object({
                id: z.string().min(1).max(100),
                x: z.number().min(0).max(100),
                y: z.number().min(0).max(100),
              }),
            )
            .max(500)
            .optional(),
        })
        .strict(),
      r.body,
    );

    const result = await transaction(async (tx) => {
      let updatedCount = 0;
      const points = input.points || [];
      if (points.length) {
        const keys = [...new Set(points.map(point => point.id))];
        const ids = keys.filter(isUuid);
        const reference = { OR: [{ id: { in: ids } }, { code: { in: keys } }] };
        // Resolve references in four reads rather than up to four reads per marker.
        const [booths, locations, heritages, hotspots] = await Promise.all([
          tx.booth.findMany({ where: { ...reference, isDeleted: false }, select: { id: true, code: true, location: { select: { id: true, mapX: true, mapY: true } } } }),
          tx.location.findMany({ where: { ...reference, isDeleted: false }, select: { id: true, code: true, mapX: true, mapY: true } }),
          tx.heritage.findMany({ where: { isDeleted: false, OR: [...reference.OR, { slug: { in: keys } }] }, select: { id: true, code: true, slug: true, mapX: true, mapY: true } }),
          tx.mapHotspot.findMany({ where: reference, select: { id: true, code: true, x: true, y: true } }),
        ]);
        const find = (rows, key) => rows.find(row => row.id === key || row.code === key || row.slug === key);
        for (const point of points) {
          const booth = find(booths, point.id);
          const location = booth?.location || find(locations, point.id);
          const heritage = location ? null : find(heritages, point.id);
          const hotspot = location || heritage ? null : find(hotspots, point.id);
          const target = location || heritage || hotspot;
          if (!target) continue;
          const xKey = hotspot ? 'x' : 'mapX';
          const yKey = hotspot ? 'y' : 'mapY';
          if (target[xKey] != null && target[yKey] != null && Number(target[xKey]) === point.x && Number(target[yKey]) === point.y) continue;
          const model = location ? tx.location : heritage ? tx.heritage : tx.mapHotspot;
          await model.update({ where: { id: target.id }, data: { [xKey]: point.x, [yKey]: point.y } });
          target[xKey] = point.x;
          target[yKey] = point.y;
          updatedCount++;
        }
      }
      const defaultVenue = await tx.venue.findFirst({ where: { isDeleted: false }, orderBy: { createdAt: 'asc' } });
      const old = await tx.setting.findUnique({ where: { key: "public.map" } }),
        value = {
          venueId: old?.value?.venueId || defaultVenue?.id,
          ...old?.value,
          ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        };

      await tx.setting.upsert({
        where: { key: "public.map" },
        create: { key: "public.map", value },
        update: { value },
      });

      await audit(tx, r.user, "update", "Map", null, {
        pointCount: input.points?.length || 0,
        updatedCount,
      });

      return {
        ...value,
        updatedPoints: updatedCount,
      };
    });

    return ApiResponse.success(s, result);
  }),
);

export default router;
