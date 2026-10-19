import type { MapLocationPoint } from '../types/map';
import { apiClient } from './apiClient';

export type { MapLocationPoint };
// Asset is shipped with the public site.  The API may override it through
// `public.map.imageUrl`, but an empty setting must never render a broken map.
export const DEFAULT_MAP_IMAGE = '/assets/maps/duong-sach-nguyen-van-binh.png';
export const MAX_MAP_IMAGE_MB = 20;

let sharedPoints: MapLocationPoint[] = [];
let sharedImage = DEFAULT_MAP_IMAGE;

const normalizePoint = (hotspot: Record<string, unknown>): MapLocationPoint => {
  const rawStatus = String(hotspot.status ?? 'available');
  const status = rawStatus as MapLocationPoint['status'];
  return {
    id: String(hotspot.id ?? ''),
    code: String(hotspot.code ?? ''),
    name: String(hotspot.name ?? hotspot.title ?? ''),
    nameEn: hotspot.nameEn || hotspot.titleEn ? String(hotspot.nameEn ?? hotspot.titleEn) : undefined,
    orgName: hotspot.orgName ? String(hotspot.orgName) : undefined,
    assignedOrgId: hotspot.assignedOrgId ? String(hotspot.assignedOrgId) : undefined,
    assignedOrgName: hotspot.assignedOrgName ? String(hotspot.assignedOrgName) : undefined,
    category: hotspot.category as MapLocationPoint['category'] || 'booth',
    zone: hotspot.zone || hotspot.area ? String(hotspot.zone ?? hotspot.area) : undefined,
    areaType: hotspot.areaType ? String(hotspot.areaType) : undefined,
    dimensions: hotspot.dimensions ? String(hotspot.dimensions) : undefined,
    status,
    statusLabelVi: hotspot.statusLabelVi
      ? String(hotspot.statusLabelVi)
      : status === 'assigned'
        ? 'Đã thuê'
        : status === 'pending' || status === 'on_hold'
          ? 'Đang giữ chỗ'
          : status === 'unavailable'
            ? 'Không khả dụng'
            : 'Còn trống',
    statusLabelEn: hotspot.statusLabelEn ? String(hotspot.statusLabelEn) : undefined,
    x: Number(hotspot.x ?? 0),
    y: Number(hotspot.y ?? 0),
    shortDesc: hotspot.shortDesc ? String(hotspot.shortDesc) : undefined,
    shortDescEn: hotspot.shortDescEn ? String(hotspot.shortDescEn) : undefined,
    imageUrl: hotspot.imageUrl ? String(hotspot.imageUrl) : undefined,
    featuredBooks: Array.isArray(hotspot.featuredBooks) ? hotspot.featuredBooks.map(String) : undefined,
    openHours: hotspot.openHours ? String(hotspot.openHours) : undefined,
    phone: hotspot.phone ? String(hotspot.phone) : undefined,
    features: Array.isArray(hotspot.features) ? hotspot.features.map(String) : undefined,
  };
};
export const getSharedMapPoints = () => sharedPoints;
export const getSharedMapImage = () => sharedImage;

export async function fetchMapHotspotsFromApi(): Promise<MapLocationPoint[]> {
  const [hotspots, config] = await Promise.all([
    apiClient.get<Array<Record<string, unknown>>>('/public/map-hotspots'),
    apiClient.get<{ imageUrl?: string }>('/public/map-config'),
  ]);
  sharedPoints = hotspots.map(normalizePoint);
  sharedImage = config.imageUrl || DEFAULT_MAP_IMAGE;
  window.dispatchEvent(new CustomEvent('duongsach_map_updated', { detail: { points: sharedPoints } }));
  window.dispatchEvent(new CustomEvent('duongsach_map_image_updated', { detail: { imageUrl: sharedImage } }));
  return sharedPoints;
}

export const saveSharedMapPoints = async (points: MapLocationPoint[], imageUrl?: string): Promise<void> => {
  await apiClient.put('/admin/map-config', {
    points: points.map(point => ({ id: point.id, x: point.x, y: point.y })),
    ...(imageUrl !== undefined ? { imageUrl } : {}),
  });
  sharedPoints = points;
  if (imageUrl !== undefined) {
    sharedImage = imageUrl;
    window.dispatchEvent(new CustomEvent('duongsach_map_image_updated', { detail: { imageUrl } }));
  }
  window.dispatchEvent(new CustomEvent('duongsach_map_updated', { detail: { points } }));
  window.dispatchEvent(new Event('duongsach:data-changed'));
};

export const saveSharedMapImage = async (imageUrl: string): Promise<void> => {
  await apiClient.put('/admin/map-config', { imageUrl });
  sharedImage = imageUrl;
  window.dispatchEvent(new CustomEvent('duongsach_map_image_updated', { detail: { imageUrl } }));
  window.dispatchEvent(new Event('duongsach:data-changed'));
};
