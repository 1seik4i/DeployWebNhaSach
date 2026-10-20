import type {
  OrganizerActivityItem,
  OrganizerActivityProposal,
  OrganizerBoothItem,
  OrganizerEvent,
} from '../types/organizer';
import { apiClient } from './apiClient';

export type OrganizerFeedbackStatus = 'new' | 'in_progress' | 'responded' | 'closed';

export interface OrganizerFeedback {
  id: string;
  targetScope: 'entire' | 'heritage' | 'booth' | 'facility';
  targetName: string | null;
  rating: number;
  comments: string | null;
  contactEmail: string | null;
  status: OrganizerFeedbackStatus;
  internalNote: string | null;
  createdAt: string;
  assignee?: { fullName: string } | null;
  heritage?: { name: string; code: string } | null;
  booth?: { name: string; code: string } | null;
  source?: string;
  subject?: string | null;
  fullName?: string | null;
  phone?: string | null;
  organization?: string | null;
}

export interface OrganizerPartnerApplication {
  id: string;
  eventId: string;
  orgName: string;
  rep: string;
  phone: string;
  date: string;
  desc: string;
  status: string;
  reviewNote?: string;
  eventTitle?: string;
  email?: string;
}

const viDate = (value: unknown) => value ? new Date(String(value)).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '';
const viTime = (value: unknown) => value ? new Date(String(value)).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }) : '';
const viDateKey = (value: unknown) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(String(value)));
};

const mapEvent = (event: any): OrganizerEvent => {
  const startVN = event.startAt ? viDateKey(event.startAt) : '';
  const endVN = event.endAt ? viDateKey(event.endAt) : '';

  const rawDisplayStatus = event.displayStatus || (event.status === 'draft' ? 'draft' : 'upcoming');
  const status = (rawDisplayStatus === 'cancelled' ? 'completed' : rawDisplayStatus) as OrganizerEvent['status'];
  const statusLabelVi = event.statusLabelVi || (status === 'draft' ? 'Bản nháp' : 'Sắp diễn ra');

  return {
    id: event.id,
    title: event.title,
    titleEn: event.titleEn,
    dateRange: event.dateRange || `${viDate(event.startAt)} - ${viDate(event.endAt)}`,
    startDate: event.startDate || startVN,
    endDate: event.endDate || endVN,
    startAt: event.startAt,
    endAt: event.endAt,
    timeStr: event.timeStr || `${viTime(event.startAt)} – ${viTime(event.endAt)}`,
    isOngoingToday: Boolean(event.isOngoingToday),
    location: event.venue?.name || '',
    status,
    statusLabelVi,
    imageUrl: event.coverImageUrl || '',
    description: event.description || '',
    boothOccupancy: String(event._count?.boothAssignments ?? 0),
    boothsCount: event._count?.boothAssignments ?? 0,
    maxBooths: event.settings?.maxBoothsPerPartner ?? 0,
    activitiesCount: event._count?.activities ?? 0,
    registrationsCount: event._count?.registrations ?? 0,
    attendanceRate: event.attendanceRate ?? 0,
    averageRating: event.averageRating ?? 0,
    boothDeadline: event.settings?.boothRequestDeadline,
    activityDeadline: event.settings?.proposalDeadline,
    participantDeadline: event.settings?.participantRegDeadline,
    cancellationCutoff: event.settings?.boothCancelCutoff,
    isPublished: ['published', 'ongoing', 'completed'].includes(event.status),
  };
};

const mapBooth = (booth: any): OrganizerBoothItem => ({
  id: booth.id,
  requestId: booth.requestId ?? null,
  code: booth.code || '',
  name: booth.name,
  nameEn: booth.nameEn,
  orgName: booth.orgName || booth.assignedOrgName,
  zone: booth.zone || '',
  areaType: booth.areaType || booth.areaName || '',
  dimensions: booth.dimensions || '',
  status: booth.status,
  statusLabelVi: booth.status === 'assigned' ? 'Đã phân bổ' : booth.status === 'pending' ? 'Đang chờ' : booth.status === 'unavailable' ? 'Không khả dụng' : 'Còn trống',
  x: booth.x == null ? null : Number(booth.x),
  y: booth.y == null ? null : Number(booth.y),
});

const mapActivity = (activity: any): OrganizerActivityItem => ({
  id: activity.id,
  eventId: activity.eventId,
  title: activity.title,
  type: activity.kind,
  dateStr: viDate(activity.startAt) === viDate(activity.endAt)
    ? viDate(activity.startAt)
    : `${viDate(activity.startAt)} – ${viDate(activity.endAt)}`,
  startAt: activity.startAt,
  endAt: activity.endAt,
  timeStr: `${viTime(activity.startAt)} – ${viTime(activity.endAt)}`,
  location: activity.location?.name || activity.locationName || '',
  locationId: activity.locationId || activity.location?.id || '',
  capacity: activity.capacity ?? 0,
  registeredCount: activity.registeredCount ?? activity._count?.registrations ?? 0,
  attendedCount: activity.attendedCount ?? activity._count?.attendanceSessions ?? 0,
  partnerName: activity.organization?.name || '',
  speaker: activity.speaker || '',
  status: activity.status,
  statusLabelVi: activity.status === 'published' ? 'Đã công bố' : activity.status === 'ongoing' ? 'Đang diễn ra' : activity.status === 'completed' ? 'Đã kết thúc' : activity.status === 'approved' ? 'Đã duyệt' : activity.status === 'need_revision' ? 'Cần chỉnh sửa' : activity.status === 'rejected' ? 'Không duyệt' : activity.status === 'cancelled' ? 'Đã hủy' : activity.status === 'draft' ? 'Bản nháp' : 'Chờ duyệt',
  isPublished: ['published', 'ongoing', 'completed'].includes(activity.status),
  thumbnail: activity.imageUrl || '',
  description: activity.description || '',
});

export const organizerApi = {
  registerEvent: (data: unknown) => apiClient.post<{ id: string; status: string }>('/admin/event-registrations', data),
  getVenues: () => apiClient.get<Array<{ id: string; name: string; campus: string; capacity: number }>>('/admin/venues'),
  async getEvents(): Promise<OrganizerEvent[]> {
    return (await apiClient.get<any[]>('/admin/events?limit=100')).map(mapEvent);
  },
  async createEvent(data: any): Promise<OrganizerEvent> {
    const payload = {
      title: data.title,
      startAt: data.startAt || `${data.startDate}T00:00:00+07:00`,
      endAt: data.endAt || `${data.endDate}T23:59:59+07:00`,
      description: data.description || null,
      coverImageUrl: data.imageUrl || data.coverImage || null,
      priorityLevel: data.priorityLevel || 'regular',
      venueId: data.venueId || null,
      visibility: data.isPublished ? 'public' : 'internal',
      summary: data.theme || null,
    };
    return mapEvent(await apiClient.post<any>('/admin/events', payload));
  },
  getEventLocations: (eventId?: string) => apiClient.get<Array<{ id: string; name: string; capacity: number }>>(`/admin/event-locations${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''}`),
  updateEvent: (id: string, data: unknown) => apiClient.put(`/admin/events/${encodeURIComponent(id)}`, data),
  deleteEvent: (id: string) => apiClient.delete(`/admin/events/${encodeURIComponent(id)}`),
  updateEventSettings: (id: string, data: { boothDeadline?: string; activityDeadline?: string; participantDeadline?: string; cancellationCutoff?: string }) => apiClient.put(`/admin/events/${encodeURIComponent(id)}/settings`, {
    boothRequestDeadline: data.boothDeadline || null,
    proposalDeadline: data.activityDeadline || null,
    participantRegDeadline: data.participantDeadline || null,
    boothCancelCutoff: data.cancellationCutoff || null,
  }),
  publishEvent: (id: string) => apiClient.post<void>(`/admin/events/${encodeURIComponent(id)}/publish`, {}),
  unpublishEvent: (id: string) => apiClient.post<void>(`/admin/events/${encodeURIComponent(id)}/unpublish`, {}),
  cancelEvent: (id: string, reason: string) => apiClient.post<void>(`/admin/events/${encodeURIComponent(id)}/cancel`, { reason }),
  duplicateEvent: (id: string) => apiClient.post<void>(`/admin/events/${encodeURIComponent(id)}/duplicate`, {}),
  broadcastEvent: (id: string, message?: string) => apiClient.post<void>(`/admin/events/${encodeURIComponent(id)}/broadcast`, { message }),

  async getBooths(eventId?: string): Promise<OrganizerBoothItem[]> {
    return (await apiClient.get<any[]>(`/admin/booths${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''}`)).map(mapBooth);
  },
  approveBoothRequest: (id: string) => apiClient.post<void>(`/admin/booth-requests/${encodeURIComponent(id)}/approve`, {}),
  rejectBoothRequest: (id: string, note?: string) => apiClient.post<void>(`/admin/booth-requests/${encodeURIComponent(id)}/reject`, { note }),
  updateBoothMapPosition: (id: string, x: number, y: number) => apiClient.patch<void>(`/admin/booths/${encodeURIComponent(id)}/map-position`, { x, y }),
  createBooth: (data: unknown) => apiClient.post('/admin/booths', data),
  updateBooth: (id: string, data: unknown) => apiClient.put(`/admin/booths/${encodeURIComponent(id)}`, data),
  deleteBooth: (id: string) => apiClient.delete(`/admin/booths/${encodeURIComponent(id)}`),

  async getActivities(eventId?: string): Promise<OrganizerActivityItem[]> {
    return (await apiClient.get<any[]>(`/admin/activities${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''}`)).map(mapActivity);
  },
  publishActivity: (id: string) => apiClient.post<void>(`/admin/activities/${encodeURIComponent(id)}/publish`, {}),
  createActivity: (data: unknown) => apiClient.post('/admin/activities', data),
  updateActivity: (id: string, data: unknown) => apiClient.patch(`/admin/activities/${encodeURIComponent(id)}`, data),
  deleteActivity: (id: string) => apiClient.delete<void>(`/admin/activities/${encodeURIComponent(id)}`),
  deleteProposal: (id: string) => apiClient.delete<void>(`/admin/activity-proposals/${encodeURIComponent(id)}`),
  createActivityFromProposal: (id: string) => apiClient.post<{ id: string }>(`/admin/activity-proposals/${encodeURIComponent(id)}/create-activity`, {}),

  async getPartnerApplications(eventId?: string): Promise<OrganizerPartnerApplication[]> {
    const rows = await apiClient.get<any[]>(`/admin/partner-applications${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''}`);
    return rows.map(item => ({
      id: item.id,
      eventId: item.eventId,
      orgName: item.organization?.name || '',
      rep: item.organization?.representativeName || '',
      phone: item.organization?.phone || '',
      date: viDate(item.submittedAt),
      desc: item.organization?.shortDesc || '',
      status: item.status,
      reviewNote: item.reviewNote || undefined,
        eventTitle: item.event?.title || '',
        email: item.organization?.email || '',
    }));
  },
  approvePartnerApplication: (id: string) => apiClient.post<void>(`/admin/partner-applications/${encodeURIComponent(id)}/approve`, {}),
  rejectPartnerApplication: (id: string, note: string) => apiClient.post<void>(`/admin/partner-applications/${encodeURIComponent(id)}/reject`, { note }),

  async getProposals(eventId?: string): Promise<OrganizerActivityProposal[]> {
    const rows = await apiClient.get<any[]>(`/admin/activity-proposals?limit=100${eventId ? `&eventId=${encodeURIComponent(eventId)}` : ''}`);
    return rows.filter(item => !item.publishedActivityId).map(item => {
      const activeBooth = item.booth || item.organization?.boothAssignments?.find((ba: any) => !ba.eventId || ba.eventId === item.eventId)?.booth || item.organization?.boothAssignments?.[0]?.booth;
      return {
        id: item.id,
        eventId: item.eventId,
        title: item.title,
        orgName: item.organization?.name || item.orgName || '',
        boothCode: activeBooth?.code || item.boothCode || '',
        boothName: activeBooth?.name || item.boothName || '',
        contactName: item.contactPerson || item.contactName || '',
      contactEmail: item.contactEmail || '',
      contactPhone: item.contactPhone || '',
      kind: item.kind,
      dateStr: item.dateStr || viDate(item.startAt),
      timeStr: item.timeStr || `${viTime(item.startAt)} – ${viTime(item.endAt)}`,
      location: item.location?.name || item.location || '',
      capacity: item.capacity ?? 0,
      status: item.status,
      description: item.description || '',
      requiredEquipments: item.requiredEquipments || item.devices?.map((device: any) => device.name) || [],
      thumbnail: item.imageUrl || '',
      submittedAt: item.submittedAt,
      reviewNote: item.reviewNote || undefined,
      hasConflict: Boolean(item.hasConflict),
      conflictNotes: item.conflictNotes || undefined,
    };
  });
},
  approveProposal: (id: string, note?: string) => apiClient.post<void>(`/admin/activity-proposals/${encodeURIComponent(id)}/approve`, { note }),
  rejectProposal: (id: string, note?: string) => apiClient.post<void>(`/admin/activity-proposals/${encodeURIComponent(id)}/reject`, note ? { note } : {}),
  requestProposalSupplement: (id: string, note: string) => apiClient.post<void>(`/admin/activity-proposals/${encodeURIComponent(id)}/request-supplement`, { note }),

  getReport: (eventId: string) => apiClient.get<any>(`/admin/reports?eventId=${encodeURIComponent(eventId)}`),
  getFeedbacks: async () => {
    const feedbacks: OrganizerFeedback[] = [];
    for (let page = 1; ; page++) {
      const batch = await apiClient.get<OrganizerFeedback[]>(`/admin/feedbacks?page=${page}&limit=100`);
      feedbacks.push(...batch);
      if (batch.length < 100) return feedbacks;
    }
  },
  updateFeedback: (id: string, data: { status: OrganizerFeedbackStatus; internalNote?: string }) => apiClient.patch<OrganizerFeedback>(`/admin/feedbacks/${encodeURIComponent(id)}/status`, data),
};
