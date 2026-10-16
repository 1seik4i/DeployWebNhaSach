export interface MapLocationPoint {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  orgName?: string;
  assignedOrgId?: string;
  assignedOrgName?: string;
  category?: 'booth' | 'stage' | 'facility' | 'cafe';
  zone?: string;
  areaType?: string;
  dimensions?: string;
  status: 'available' | 'assigned' | 'pending' | 'on_hold' | 'unavailable';
  statusLabelVi: string;
  statusLabelEn?: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  shortDesc?: string;
  shortDescEn?: string;
  imageUrl?: string;
  featuredBooks?: string[];
  openHours?: string;
  phone?: string;
  features?: string[];
}
