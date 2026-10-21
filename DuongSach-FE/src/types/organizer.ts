export interface OrganizerEvent {
  id: string;
  title: string;
  titleEn?: string;
  theme?: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  startAt?: string;
  endAt?: string;
  timeStr?: string;
  isOngoingToday?: boolean;
  location: string;
  status: 'happening' | 'upcoming' | 'draft' | 'completed';
  statusLabelVi: string;
  imageUrl: string;
  coverImage?: string;
  description: string;
  boothOccupancy: string;
  boothsCount: number;
  maxBooths: number;
  totalBooths?: number;
  activitiesCount: number;
  registrationsCount: number;
  registeredBooths?: number;
  registeredActivities?: number;
  registeredParticipants?: number;
  attendanceRate: number;
  averageRating: number;
  // Configurable Settings
  boothDeadline?: string;
  activityDeadline?: string;
  participantDeadline?: string;
  cancellationCutoff?: string;
  maxCapacity?: number;
  isPublished?: boolean;
}
export interface OrganizerBoothItem {
  id: string;
  requestId?: string | null;
  code: string;
  name: string;
  nameEn?: string;
  orgName?: string;
  zone: string;
  areaType: string;
  dimensions: string;
  status: 'assigned' | 'pending' | 'available' | 'unavailable';
  statusLabelVi: string;
  statusLabelEn?: string;
  priceEstimate?: string;
  registeredDate?: string;
  notes?: string;
  x?: number | null;
  y?: number | null;
}

export interface OrganizerActivityItem {
  targetAudience?: string;
  id: string;
  eventId: string;
  title: string;
  type: string;
  dateStr: string;
  startAt?: string;
  endAt?: string;
  timeStr: string;
  location: string;
  locationId?: string;
  capacity: number;
  registeredCount: number;
  attendedCount: number;
  partnerName: string;
  speaker: string;
  status: 'approved' | 'pending' | 'need_revision' | 'rejected' | 'cancelled' | 'published' | 'ongoing' | 'completed' | 'draft';
  statusLabelVi: string;
  isPublished: boolean;
  thumbnail: string;
  description: string;
  hasConflict?: boolean;
  conflictNotes?: string;
}
export interface OrganizerActivityProposal {
  id: string;
  eventId: string;
  title: string;
  orgName: string;
  boothCode: string;
  boothName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  kind: string;
  dateStr: string;
  timeStr: string;
  location: string;
  capacity: number;
  status: 'pending' | 'need_revision' | 'approved' | 'rejected';
  description: string;
  requiredEquipments: string[];
  thumbnail: string;
  submittedAt: string;
  reviewNote?: string;
  hasConflict?: boolean;
  conflictNotes?: string;
}
