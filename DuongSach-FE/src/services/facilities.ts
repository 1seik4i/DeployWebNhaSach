import { apiClient } from './apiClient';

export type FacilityKind = 'venues' | 'locations' | 'assets' | 'booths';

export interface Facility {
  id: string;
  name: string;
  campus: string;
  capacity: number;
  totalQuantity: number;
  createdAt: string;
  status?: 'available' | 'pending' | 'assigned';
  requestId?: string | null;
  code?: string;
  kind?: 'main_stage' | 'workshop_area' | 'reading_area' | 'other';
  zone?: string;
  x?: number | null;
  y?: number | null;
}

export type FacilityInput = Pick<Facility, 'name'> & Partial<Pick<Facility, 'campus' | 'capacity' | 'totalQuantity' | 'status' | 'code' | 'kind' | 'zone' | 'x' | 'y'>>;

type FacilityListResponse = { data: Facility[]; campuses: string[] };

export async function facilityRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const endpoint = `/admin/${path}`;
  const method = String(options.method || 'GET').toUpperCase();
  const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;

  if (method === 'POST') return apiClient.post(endpoint, body) as Promise<T>;
  if (method === 'PUT') return apiClient.put(endpoint, body) as Promise<T>;
  if (method === 'PATCH') return apiClient.patch(endpoint, body) as Promise<T>;
  if (method === 'DELETE') return apiClient.delete(endpoint) as Promise<T>;

  const rows = await apiClient.get<Facility[]>(endpoint, { signal: options.signal ?? undefined });
  return {
    data: rows,
    campuses: [...new Set(rows.map(row => row.campus).filter(Boolean))].sort(),
  } as FacilityListResponse as T;
}
