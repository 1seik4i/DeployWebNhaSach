export type Language = 'vi' | 'en';

export interface ImageAsset {
  url: string;
  alt: string;
  source: string;
  license: string;
  isIllustrationOnly: boolean;
}

export interface Booth {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  publisher: string;
  category: 'literature' | 'history' | 'children' | 'lifestyle' | 'cafe';
  categoryLabelVi: string;
  categoryLabelEn: string;
  tagline: string;
  taglineEn: string;
  description: string;
  descriptionEn: string;
  featuredBooks: string[];
  featuredBooksEn: string[];
  mapLocationId: string;
  openHours: string;
  image: ImageAsset;
  topSellingBook?: {
    title: string;
    soldQuantity?: number;
  };
}

export type EventPriority = 'high' | 'medium' | 'regular';
export type ProposalStatus = 'pending' | 'approved' | 'need_revision' | 'rejected';

export interface DeviceRequirement {
  name: string;
  quantity: number;
}

export interface EventProposal {
  id: string;
  boothId: string;
  boothName: string;
  title: string;
  titleEn?: string;
  dateStr: string; // e.g. "2026-09-22" or "22/09/2026"
  dayOfWeek?: string; // e.g. "Thứ 3", "Thứ 5", "Thứ 7"
  timeStr: string; // e.g. "09:00 - 11:30"
  location: string;
  priorityLevel: EventPriority;
  devices: DeviceRequirement[];
  description: string;
  speaker: string;
  contactPerson?: string;
  contactPhone?: string;
  status: ProposalStatus;
  submittedAt: string;
  managementNotes?: string;
  publishedEventId?: string;
}

export interface EventItem {
  id: string;
  title: string;
  titleEn: string;
  type: 'talkshow' | 'launch' | 'workshop' | 'exhibition';
  typeLabelVi: string;
  typeLabelEn: string;
  dateStr: string;
  dateRange?: string;
  dayOfWeek?: string;
  timeStr: string;
  location: string;
  locationEn: string;
  priorityLevel: EventPriority;
  summary: string;
  summaryEn: string;
  speaker: string;
  image: ImageAsset;
  boothId?: string;
  boothName?: string;
  devices?: DeviceRequirement[];
  status?: 'approved' | 'happening' | 'upcoming' | 'completed';
  isOngoingToday?: boolean;
  startDate?: string;
  endDate?: string;
  startAt?: string;
  endAt?: string;
  proposalId?: string;
}

export interface MapHotspot {
  id: string;
  code: string;
  title: string;
  titleEn: string;
  category: 'booth' | 'stage' | 'facility';
  x: number;
  y: number;
  shortDesc: string;
  shortDescEn: string;
  boothId?: string;
  iconType: string;
  area?: string;
  dimensions?: string;
  phone?: string;
  hours?: string;
  features?: string[];
  featuresEn?: string[];
}

export type FeedbackStatus = 'new' | 'in_progress' | 'responded' | 'closed';

export interface FeedbackRecord {
  id: string;
  targetScope: 'entire' | 'booth' | 'facility';
  targetName: string;
  rating: number; // 1 - 5
  comments: string;
  contactEmail?: string;
  createdAt: string;
  source: 'qr_general' | 'web_landing';
  status: FeedbackStatus;
  assignedTo?: string;
  internalNote?: string;
}

export interface ActivityAuditItem {
  id: string;
  actor: string;
  actorRole: string;
  action: 'create_event' | 'approve_proposal' | 'reject_proposal' | 'request_revision' | 'create_booth' | 'update_booth' | 'delete_booth' | 'resolve_feedback' | 'generate_qr';
  targetType: 'proposal' | 'event' | 'booth' | 'feedback';
  targetTitle: string;
  timestamp: string;
  details?: string;
}

/* ==========================================================================
   PARTNER / EXHIBITOR FLOW TYPES (SKETCH-ALIGNED)
   ========================================================================== */

export interface PartnerOrganization {
  lastActiveAt?: string;
  id: string;
  name: string;
  shortDesc: string;
  logoUrl?: string;
  representativeName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  categories: string[];
  isVerified?: boolean;
}

export interface PartnerEventApplication {
  id: string;
  eventId: string;
  eventTitle: string;
  dateRange: string;
  location: string;
  imageUrl: string;
  startDate?: string;
  endDate?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'need_changes';
  submittedAt: string;
  step: number; // 1 to 4
  organizationName: string;
  shortDesc: string;
  logoUrl?: string;
  representativeName: string;
  email: string;
  phone: string;
}

export interface PartnerBooth {
  id: string;
  code: string; // 'A05'
  name: string;
  zone: 'Khu A' | 'Khu B' | 'Khu C';
  areaName: string; // 'Sách thiếu nhi'
  dimensions: string; // '3m x 3m'
  status: 'available' | 'selected' | 'assigned' | 'on_hold' | 'unavailable';
  assignedOrgId?: string;
  assignedOrgName?: string;
  imageUrl: string;
  openHours?: string;
  description: string;
  categories: string[];
  relatedEventId: string;
  relatedEventTitle: string;
}

export interface PartnerActivityScheduleItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  speaker?: string;
}

export interface PartnerActivityDocumentItem {
  id: string;
  name: string;
  size: string;
  url?: string;
  uploadedAt?: string;
}

export interface PartnerActivityProposal {
  id: string;
  title: string;
  category: 'Workshop' | 'Talkshow' | 'Minigame' | 'Signings' | 'Exhibition';
  date: string;
  time: string;
  duration: string;
  location: string;
  capacity: number;
  registeredCount: number;
  targetAudience: string;
  description: string;
  speaker?: string;
  requiredEquipments: string[];
  imageUrl: string;
  status: 'pending' | 'approved' | 'need_changes' | 'rejected' | 'withdrawn';
  eventId: string;
  eventName: string;
  feedbacks?: string;
  boothCode?: string;
  boothName?: string;
  orgName?: string;
  submittedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  schedule?: PartnerActivityScheduleItem[];
  documents?: PartnerActivityDocumentItem[];
}

export interface PartnerTodoItem {
  id: string;
  title: string;
  deadline: string;
  status: 'need_action' | 'pending_review' | 'not_due';
  statusLabelVi: string;
  link: string;
}

export interface PartnerNotification {
  message?: string;
  id: string;
  title: string;
  time: string;
  type: 'activity' | 'booth' | 'event' | 'reminder' | 'system';
  isRead: boolean;
  link?: string;
}

export interface PartnerReportStats {
  availableEvents?: Array<{ id: string; title: string }>;
  eventId: string;
  eventName: string;
  totalParticipants: number;
  totalActivities: number;
  attendanceRate: number; // e.g. 92%
  averageRating: number; // e.g. 4.8
  ratingCount: number;
  activityStats: { name: string; count: number }[];
  ratingDistribution: { stars: string; percent: number; count?: number }[];
  feedbacks: EventReportFeedback[];
}

export interface EventReportFeedback {
  id: string;
  rating: number;
  comment: string;
  authorName: string | null;
  activityName: string | null;
  createdAt: string;
  source: 'event' | 'activity';
}

export interface AttendanceScanRecord {
  id: string;
  activityId: string;
  activityTitle: string;
  participantName: string;
  ticketCode: string;
  scanTime: string;
  status: 'success' | 'already_scanned' | 'invalid';
}

export * from './admin';
export * from './organizer';
export * from './map';
export * from './library';


