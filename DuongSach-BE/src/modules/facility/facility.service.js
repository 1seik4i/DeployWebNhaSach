import { randomBytes } from 'node:crypto';
import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { z } from 'zod';
import { parse } from '../../utils/contract.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (value, field, maxLength = 160) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized || normalized.length > maxLength) {
    throw ApiError.validation([{ field, message: `${field} phải có từ 1 đến ${maxLength} ký tự` }]);
  }
  return normalized;
};
const quantity = (value, field, minimum) => {
  if (!Number.isSafeInteger(value) || value < minimum || value > 1000000) {
    throw ApiError.validation([{ field, message: `${field} phải là số nguyên từ ${minimum} đến 1.000.000` }]);
  }
  return value;
};
const validId = id => {
  if (!uuid.test(id)) throw ApiError.notFound('Không tìm thấy dữ liệu');
  return id;
};
const paging = query => ({
  page: Math.max(1, Number.parseInt(query.page, 10) || 1),
  limit: Math.max(1, Math.min(100, Number.parseInt(query.limit, 10) || 50)),
});
const meta = (page, limit, total, campuses = []) => ({ page, limit, total, totalPages: Math.ceil(total / limit), campuses });
const uniqueConflict = error => {
  if (error.code === 'P2002') throw ApiError.conflict('Tên hoặc mã đã tồn tại trong danh mục này');
  throw error;
};

const boothResult = booth => ({
  id: booth.id, code: booth.code, name: booth.name, nameEn: booth.nameEn,
  campus: booth.location.venue.facility, capacity: booth.location.capacity,
  status: booth.opStatus !== 'operational' ? 'unavailable' : booth.assignments?.length ? 'assigned' : booth.holds?.length ? 'pending' : 'available',
  createdAt: booth.createdAt,
  zone: booth.location.zone || '', areaName: booth.areaName || '', dimensions: booth.dimensions || '',
  description: booth.description || '', descriptionEn: booth.descriptionEn || '', imageUrl: booth.imageUrl || '',
  openHours: booth.openHours || '', category: booth.category || 'booth',
  x: booth.location.mapX == null ? null : Number(booth.location.mapX),
  y: booth.location.mapY == null ? null : Number(booth.location.mapY),
  orgName: booth.assignments?.[0]?.organization?.name || booth.publisher || null,
  assignedOrgId: booth.assignments?.[0]?.organizationId || null,
  requestId: booth.requests?.[0]?.id || null,
});
const boothInclude = () => ({
  requests: { where: { status: 'pending' }, take: 1 },
  location: { include: { venue: true } },
  holds: { where: { releasedAt: null, expiresAt: { gt: new Date() } }, take: 1 },
  assignments: { where: { status: 'active' }, take: 1, include: { organization: true } },
});

const mapVenue = async () => {
  const setting = await prisma.setting.findUnique({ where: { key: 'public.map' }, select: { value: true } });
  const venueId = typeof setting?.value?.venueId === 'string' ? setting.value.venueId : '';
  if (uuid.test(venueId)) {
    const venue = await prisma.venue.findFirst({ where: { id: venueId, isDeleted: false } });
    if (venue) return venue;
  }
  // Fallback: Tự động lấy cơ sở hoạt động mặc định (ưu tiên Đường Sách TP.HCM)
  const defaultVenue = (await prisma.venue.findFirst({
    where: { isDeleted: false, name: { contains: 'TP.HCM', mode: 'insensitive' } },
    orderBy: { createdAt: 'asc' },
  })) || (await prisma.venue.findFirst({
    where: { isDeleted: false },
    orderBy: { createdAt: 'asc' },
  }));

  if (!defaultVenue) {
    throw ApiError.conflict('Chưa có cơ sở hoạt động nào trong hệ thống');
  }

  // Tự động gắn venueId vào setting public.map
  await prisma.setting.upsert({
    where: { key: 'public.map' },
    update: { value: { ...(setting?.value || {}), venueId: defaultVenue.id } },
    create: {
      key: 'public.map',
      value: { ...(setting?.value || {}), venueId: defaultVenue.id },
      description: 'Ảnh nền bản đồ công khai trên landing page',
    },
  }).catch(() => {});

  return defaultVenue;
};

const locationResult = row => ({
  id: row.id, code: row.code, name: row.name, campus: row.venue.facility,
  venueName: row.venue.name, capacity: row.capacity, totalQuantity: 0,
  kind: row.kind, zone: row.zone || '', x: row.mapX == null ? null : Number(row.mapX),
  y: row.mapY == null ? null : Number(row.mapY), createdAt: row.createdAt,
});

export const FacilityService = {
  // Locations and booths are the canonical source for every map surface.
  async listMapBooths({ venueId } = {}) {
    const [boothRows, locationRows] = await Promise.all([
      prisma.booth.findMany({
        where: {
          isDeleted: false,
          // Every active booth with saved coordinates belongs to the shared booth map.
          // venueId only scopes event locations; otherwise TD01-TD03 disappear even
          // though their persisted coordinates are part of this same map layout.
          location: { mapX: { not: null }, mapY: { not: null } },
        },
        include: boothInclude(),
        orderBy: { code: 'asc' },
      }),
      prisma.location.findMany({
        where: {
          isDeleted: false,
          kind: { not: 'booth' },
          ...(venueId ? { venueId } : {}),
          mapX: { not: null },
          mapY: { not: null },
        },
        include: { venue: true },
        orderBy: { code: 'asc' },
      }),
    ]);

    const booths = boothRows.map(row => {
      const booth = boothResult(row);
      return {
        ...booth,
        boothId: booth.id,
        // Map category expresses the point type; the publishing category is kept separately.
        category: 'booth',
        areaType: booth.category || 'booth',
        title: booth.name,
        titleEn: booth.nameEn || booth.name,
        shortDesc: booth.description || row.location.name,
        shortDescEn: booth.descriptionEn || booth.description || row.location.nameEn || row.location.name,
        area: booth.zone || booth.areaName,
        statusLabelVi: booth.status === 'assigned' ? 'Đã thuê' : booth.status === 'pending' ? 'Đang giữ chỗ' : booth.status === 'unavailable' ? 'Không khả dụng' : 'Còn trống',
      };
    });

    const locations = locationRows.map(location => ({
      id: location.id,
      code: location.code,
      name: location.name,
      nameEn: location.nameEn,
      category: location.kind === 'main_stage' ? 'stage' : 'facility',
      zone: location.zone || undefined,
      areaType: location.kind,
      status: 'available',
      statusLabelVi: 'Địa điểm tổ chức',
      x: Number(location.mapX),
      y: Number(location.mapY),
      shortDesc: `${location.name} · ${location.venue.name}`,
      shortDescEn: location.nameEn || location.name,
      orgName: location.venue.name,
    }));

    return [...booths, ...locations].sort((a, b) => a.code.localeCompare(b.code));
  },

  async list(kind, query) {
    const { page, limit } = paging(query);
    const search = String(query.search || '').trim();
    const campus = String(query.campus || '').trim();
    const where = { isDeleted: false, ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}) };
    if (kind === 'locations') {
      const venue = await mapVenue();
      const locationWhere = { ...where, venueId: venue.id, kind: { not: 'booth' }, mapX: { not: null }, mapY: { not: null } };
      const [total, rows] = await Promise.all([
        prisma.location.count({ where: locationWhere }),
        prisma.location.findMany({ where: locationWhere, skip: (page - 1) * limit, take: limit, orderBy: { code: 'asc' }, include: { venue: true } }),
      ]);
      return { data: rows.map(locationResult), meta: meta(page, limit, total, [venue.facility]) };
    }
    if (kind === 'venues') {
      if (campus) where.facility = { equals: campus, mode: 'insensitive' };
      const [total, rows, facilities] = await Promise.all([
        prisma.venue.count({ where }),
        prisma.venue.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.venue.findMany({ where: { isDeleted: false }, distinct: ['facility'], select: { facility: true } }),
      ]);
      return { data: rows.map(row => ({ id: row.id, name: row.name, campus: row.facility, capacity: row.capacity, totalQuantity: 0, createdAt: row.createdAt })), meta: meta(page, limit, total, facilities.map(row => row.facility).sort()) };
    }
    if (kind === 'assets') {
      const [total, rows] = await Promise.all([
        prisma.asset.count({ where }),
        prisma.asset.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      ]);
      return { data: rows.map(row => ({ id: row.id, name: row.name, campus: '', capacity: 0, totalQuantity: row.totalQuantity, createdAt: row.createdAt })), meta: meta(page, limit, total) };
    }
    if (campus) where.location = { venue: { facility: { equals: campus, mode: 'insensitive' }, isDeleted: false } };
    const [total, rows, facilities] = await Promise.all([
      prisma.booth.count({ where }),
      prisma.booth.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: boothInclude() }),
      prisma.venue.findMany({ where: { isDeleted: false }, distinct: ['facility'], select: { facility: true } }),
    ]);
    return { data: rows.map(boothResult), meta: meta(page, limit, total, facilities.map(row => row.facility).sort()) };
  },

  async get(kind, id) {
    validId(id);
    const configuredVenue = kind === 'locations' ? await mapVenue() : null;
    const row = kind === 'locations' ? await prisma.location.findFirst({ where: { id, venueId: configuredVenue.id, isDeleted: false, kind: { not: 'booth' } }, include: { venue: true } })
      : kind === 'venues' ? await prisma.venue.findFirst({ where: { id, isDeleted: false } })
      : kind === 'assets' ? await prisma.asset.findFirst({ where: { id, isDeleted: false } })
        : await prisma.booth.findFirst({ where: { id, isDeleted: false }, include: boothInclude() });
    if (!row) throw ApiError.notFound('Không tìm thấy dữ liệu');
    return kind === 'booths' ? boothResult(row) : kind === 'locations' ? locationResult(row) : row;
  },

  async save(kind, id, input) {
    const name = text(input?.name, 'name', kind === 'assets' ? 120 : 160);
    const existing = id ? await this.get(kind, id) : null;
    try {
      if (kind === 'locations') {
        const venue = await mapVenue();
        const details = parse(z.object({
          name: z.string().trim().min(1).max(160),
          code: z.string().trim().min(1).max(20),
          kind: z.enum(['main_stage', 'workshop_area', 'reading_area', 'other']),
          capacity: z.number().int().min(1).max(1000000),
          zone: z.string().trim().max(40).optional(),
          x: z.number().min(0).max(100),
          y: z.number().min(0).max(100),
        }).strict(), input);
        const data = { venueId: venue.id, name, code: details.code, kind: details.kind, capacity: details.capacity, zone: details.zone || null, mapX: details.x, mapY: details.y };
        const row = id
          ? await prisma.location.update({ where: { id }, data, include: { venue: true } })
          : await prisma.location.create({ data, include: { venue: true } });
        return locationResult(row);
      }
      if (kind === 'venues') {
        const facility = text(input.campus, 'campus');
        const capacity = quantity(input.capacity, 'capacity', 1);
        const duplicate = await prisma.venue.findFirst({ where: { name: { equals: name, mode: 'insensitive' }, facility: { equals: facility, mode: 'insensitive' }, isDeleted: false, ...(id ? { id: { not: id } } : {}) } });
        if (duplicate) throw ApiError.conflict('Tên địa điểm đã tồn tại tại cơ sở này');
        if (id) {
          return prisma.venue.update({ where: { id }, data: { name, facility, capacity } });
        }
        return prisma.$transaction(async tx => {
          const venue = await tx.venue.create({ data: { name, facility, capacity } });
          const code = input.code || `LOC-${randomBytes(3).toString('hex').toUpperCase()}`;
          const mapX = input.x !== undefined ? Number(input.x) : 50;
          const mapY = input.y !== undefined ? Number(input.y) : 30;
          await tx.location.create({
            data: {
              venueId: venue.id,
              code,
              name,
              kind: input.kind || 'main_stage',
              capacity,
              mapX,
              mapY,
            },
          });
          return venue;
        });
      }
      if (kind === 'assets') {
        const totalQuantity = quantity(input.totalQuantity, 'totalQuantity', 0);
        return id ? prisma.asset.update({ where: { id }, data: { name, totalQuantity } }) : prisma.asset.create({ data: { name, totalQuantity } });
      }
      const facility = text(input.campus, 'campus');
      const details = parse(z.object({ code:z.string().trim().min(1).max(20).optional(), dimensions:z.string().max(40).optional(), areaName:z.string().max(80).optional(), description:z.string().max(20000).optional(), imageUrl:z.string().max(3000000).optional(), openHours:z.string().max(60).optional() }),input);
      const venue = await prisma.venue.findFirst({ where: { facility: { equals: facility, mode: 'insensitive' }, isDeleted: false }, orderBy: { createdAt: 'asc' } });
      if (!venue) throw ApiError.validation([{ field: 'campus', message: 'Cơ sở chưa có địa điểm tổ chức; hãy tạo địa điểm trước' }]);
      const duplicate = await prisma.booth.findFirst({ where: { name: { equals: name, mode: 'insensitive' }, isDeleted: false, location: { venue: { facility: { equals: facility, mode: 'insensitive' } } }, ...(id ? { id: { not: id } } : {}) } });
      if (duplicate) throw ApiError.conflict('Tên gian hàng đã tồn tại tại cơ sở này');
      if (id) {
        if (existing.status !== 'available' && existing.campus.toLowerCase() !== facility.toLowerCase()) throw ApiError.conflict('Không thể chuyển cơ sở của gian hàng đang được phân bổ');
        return prisma.$transaction(async tx => {
          const booth = await tx.booth.findUnique({ where: { id }, include: { location: true } });
          await tx.location.update({ where: { id: booth.locationId }, data: { venueId: venue.id } });
          return tx.booth.update({ where: { id }, data: { name, ...details }, include: boothInclude() });
        }).then(boothResult);
      }
      return prisma.$transaction(async tx => {
        const code = details.code || `B-${randomBytes(5).toString('hex').toUpperCase()}`;
        const mapX = input.x !== undefined ? Number(input.x) : 50;
        const mapY = input.y !== undefined ? Number(input.y) : 50;
        const location = await tx.location.create({ data: { venueId: venue.id, code, name: `Vị trí ${name}`, kind: 'booth', capacity: 0, mapX, mapY } });
        return tx.booth.create({ data: { locationId: location.id, ...details, code, name }, include: boothInclude() });
      }).then(boothResult);
    } catch (error) { uniqueConflict(error); }
  },

  async remove(kind, id, actorId) {
    const existing = await this.get(kind, id);
    if (kind === 'booths' && existing.status !== 'available') throw ApiError.conflict('Không thể xóa gian hàng đang được giữ chỗ hoặc phân bổ');
    if (kind === 'venues') {
      const [locations, events] = await Promise.all([
        prisma.location.count({ where: { venueId: id, isDeleted: false } }),
        prisma.event.count({ where: { venueId: id, isDeleted: false } }),
      ]);
      if (locations || events) throw ApiError.conflict('Địa điểm đang được sử dụng');
    }
    if (kind === 'locations') {
      const [activities, proposals, eventLocations] = await Promise.all([
        prisma.activity.count({ where: { locationId: id } }),
        prisma.activityProposal.count({ where: { locationId: id } }),
        prisma.eventLocation.count({ where: { locationId: id } }),
      ]);
      if (activities || proposals || eventLocations) throw ApiError.conflict('Điểm tổ chức đang được sự kiện hoặc hoạt động sử dụng');
      await prisma.location.update({ where: { id }, data: { isDeleted: true } });
      return { id, deleted: true };
    }
    await prisma[kind === 'booths' ? 'booth' : kind === 'venues' ? 'venue' : 'asset'].update({ where: { id }, data: { isDeleted: true, deletedAt: new Date(), deletedBy: actorId } });
    return { id, deleted: true };
  },
};
