import type {
  PartnerActivityProposal,
  PartnerBooth,
  PartnerEventApplication,
  PartnerNotification,
  PartnerOrganization,
  PartnerReportStats,
  PartnerTodoItem,
} from '../types';
import { apiClient } from './apiClient';

export interface PartnerBoothContent {
  name: string;
  description: string;
  dimensions: string;
  areaName: string;
  openHours?: string;
  imageUrl?: string;
  categories: string[];
  images: Array<{ id: string; url: string; caption: string }>;
  documents: Array<{ id: string; name: string; size: string; dataUrl?: string }>;
}

const formatDate = (value: unknown) => value
  ? new Date(String(value)).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  : '';

const mapOrganization = (organization: Record<string, unknown>): PartnerOrganization => ({
  id: String(organization.id),
  name: String(organization.name || organization.fullName || ''),
  shortDesc: String(organization.shortDesc || ''),
  logoUrl: organization.logoUrl ? String(organization.logoUrl) : undefined,
  representativeName: String(organization.representativeName || organization.fullName || ''),
  email: String(organization.email || ''),
  phone: String(organization.phone || ''),
  address: String(organization.address || ''),
  website: String(organization.website || ''),
  categories: Array.isArray(organization.categories) ? organization.categories.map(String) : [],
  isVerified: Boolean(organization.isVerified),
});

const partnerReviewStatus = (status: unknown) => status === 'need_revision' ? 'need_changes' : status;

const mapActivityProposal = (proposal: Record<string, any>): PartnerActivityProposal => ({
  ...proposal,
  id: String(proposal.id),
  status: partnerReviewStatus(proposal.status) as PartnerActivityProposal['status'],
} as unknown as PartnerActivityProposal);

export function resolvePartnerNotificationLink(item: {
  title?: string;
  message?: string;
  link?: string;
  kind?: string;
}): string {
  const link = (item.link || '').trim();
  if (link && link.startsWith('/partner/') && link !== '/partner/notifications') {
    return link;
  }
  const title = (item.title || '').toLowerCase();
  const text = `${title} ${(item.message || '').toLowerCase()}`;

  if (title.includes('gian hàng') || text.includes('gian hàng') || item.kind === 'booth') {
    return '/partner/booths';
  }
  if (title.includes('đề xuất') || title.includes('hoạt động') || text.includes('hoạt động') || item.kind === 'activity') {
    return '/partner/activities';
  }
  if (title.includes('sách') || text.includes('bán sách') || text.includes('kho sách')) {
    return '/partner/books';
  }
  if (title.includes('báo cáo') || title.includes('doanh thu')) {
    return '/partner/reports';
  }
  if (title.includes('sự kiện') || text.includes('sự kiện') || item.kind === 'event') {
    return '/partner/events';
  }
  return '/partner/events';
}

export const partnerApi = {
  registerEvent: (data: unknown) => apiClient.post<{ id: string; registrationId: string; status: string }>('/partner/event-registrations', data),
  async getProfile(): Promise<PartnerOrganization | null> {
    const organization = await apiClient.get<Record<string, unknown> | null>('/partner/profile');
    return organization ? mapOrganization(organization) : null;
  },
  async updateProfile(data: Partial<PartnerOrganization>): Promise<PartnerOrganization> {
    const result = await apiClient.patch<Record<string, unknown>>('/partner/profile', data);
    return mapOrganization(result);
  },

  async getApplications(): Promise<PartnerEventApplication[]> {
    const applications = await apiClient.get<Array<Record<string, any>>>('/partner/event-applications');
    return applications.map(application => ({
      id: String(application.id),
      eventId: String(application.eventId),
      eventTitle: String(application.event?.title || ''),
      dateRange: `${formatDate(application.event?.startAt)} - ${formatDate(application.event?.endAt)}`,
      location: String(application.event?.venue?.name || ''),
      imageUrl: String(application.event?.coverImageUrl || ''),
      status: (application.status === 'withdrawn' ? 'rejected' : partnerReviewStatus(application.status)) as PartnerEventApplication['status'],
      submittedAt: formatDate(application.submittedAt),
      step: Number(application.step || 1),
      organizationName: String(application.organization?.name || ''),
      shortDesc: String(application.organization?.shortDesc || ''),
      logoUrl: application.organization?.logoUrl || undefined,
      representativeName: String(application.organization?.representativeName || ''),
      email: String(application.organization?.email || ''),
      phone: String(application.organization?.phone || ''),
    }));
  },
  submitApplication: (eventId: string) => apiClient.post<{ id: string }>('/partner/event-applications', { eventId }),

  getBooths: (eventId?: string) => apiClient.get<PartnerBooth[]>(`/partner/booths${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''}`),
  getBoothContent: (boothId: string) => apiClient.get<PartnerBoothContent>(`/partner/booths/${encodeURIComponent(boothId)}/content`),
  updateBoothContent: (boothId: string, data: Partial<PartnerBoothContent>) => apiClient.patch<PartnerBoothContent>(`/partner/booths/${encodeURIComponent(boothId)}/content`, data),
  requestBoothChange: (boothId: string, reason: string) => apiClient.post<{ success: boolean }>(`/partner/booths/${encodeURIComponent(boothId)}/requests`, { kind: 'change', reason }),
  requestBoothCancellation: (boothId: string, reason: string) => apiClient.post<{ success: boolean }>(`/partner/booths/${encodeURIComponent(boothId)}/requests`, { kind: 'cancellation', reason }),
  requestBooth: (data: { eventId: string; boothId: string; note?: string }) => apiClient.post<void>('/partner/booth-requests', { eventId: data.eventId, boothId: data.boothId }),

  getEventLocations: (eventId?: string) => apiClient.get<Array<{ id: string; name: string; capacity: number }>>(`/partner/event-locations${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''}`),
  getAssets: () => apiClient.get<Array<{ id: string; name: string; totalQuantity: number }>>('/partner/assets'),
  getSchedule: () => apiClient.get<Array<Record<string, unknown>>>('/partner/schedule'),

  async getActivityProposals(eventId?: string): Promise<PartnerActivityProposal[]> {
    const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
    return (await apiClient.get<Array<Record<string, any>>>(`/partner/activity-proposals${query}`)).map(mapActivityProposal);
  },
  async submitActivityProposal(data: unknown): Promise<PartnerActivityProposal> {
    return mapActivityProposal(await apiClient.post<Record<string, any>>('/partner/activity-proposals', data));
  },
  async updateActivityProposal(id: string, data: Partial<PartnerActivityProposal>): Promise<PartnerActivityProposal> {
    return mapActivityProposal(await apiClient.patch<Record<string, any>>(`/partner/activity-proposals/${encodeURIComponent(id)}`, data));
  },
  requestActivityChange: (id: string, reason: string) => apiClient.post<void>(`/partner/activity-proposals/${encodeURIComponent(id)}/requests`, { kind: 'change', reason }),
  requestActivityCancellation: (id: string, reason: string) => apiClient.post<void>(`/partner/activity-proposals/${encodeURIComponent(id)}/requests`, { kind: 'cancellation', reason }),
  getActivityParticipants: (id: string) => apiClient.get<Array<{ id: string; fullName: string; phone: string; ticketCode: string; status: string; attendeesCount: number }>>(`/partner/activity-proposals/${encodeURIComponent(id)}/participants`),

  async getTodos(): Promise<PartnerTodoItem[]> {
    const [applications, proposals] = await Promise.all([this.getApplications(), this.getActivityProposals()]);
    return [
      ...applications.filter(item => item.status === 'need_changes').map(item => ({
        id: `application:${item.id}`,
        title: `Bổ sung hồ sơ tham gia ${item.eventTitle}`,
        deadline: item.submittedAt,
        status: 'need_action' as const,
        statusLabelVi: 'Cần thực hiện',
        link: '/partner/events',
      })),
      ...applications.filter(item => item.status === 'submitted').map(item => ({
        id: `application:${item.id}`,
        title: `Hồ sơ ${item.eventTitle} đang chờ xét duyệt`,
        deadline: item.submittedAt,
        status: 'pending_review' as const,
        statusLabelVi: 'Đang xét duyệt',
        link: '/partner/events',
      })),
      ...proposals.filter(item => item.status === 'need_changes' || item.status === 'pending').map(item => ({
        id: `proposal:${item.id}`,
        title: item.status === 'need_changes' ? `Bổ sung đề xuất ${item.title}` : `Đề xuất ${item.title} đang chờ xét duyệt`,
        deadline: item.date,
        status: item.status === 'need_changes' ? 'need_action' as const : 'pending_review' as const,
        statusLabelVi: item.status === 'need_changes' ? 'Cần thực hiện' : 'Đang xét duyệt',
        link: `/partner/activities/${item.id}`,
      })),
    ];
  },

  async getNotifications(): Promise<PartnerNotification[]> {
    const items = await apiClient.get<Array<Record<string, unknown>>>('/partner/notifications');
    return items.map(item => ({
      id: String(item.id),
      title: String(item.title),
      time: formatDate(item.createdAt),
      type: ['activity', 'booth', 'event', 'reminder', 'system'].includes(String(item.kind))
        ? String(item.kind) as PartnerNotification['type']
        : 'system',
      isRead: Boolean(item.isRead),
      link: resolvePartnerNotificationLink({
        title: String(item.title || ''),
        message: String(item.message || ''),
        link: item.link ? String(item.link) : undefined,
        kind: String(item.kind || ''),
      }),
    }));
  },
  markNotificationRead: (id: string) => apiClient.patch<void>(`/partner/notifications/${encodeURIComponent(id)}/read`, {}),
  markAllNotificationsRead: () => apiClient.patch<void>('/partner/notifications/read-all', {}),

  getReports: (eventId?: string) => apiClient.get<PartnerReportStats>(`/partner/reports${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''}`),
  scanAttendance: (qrToken: string) => apiClient.post<Record<string, unknown>>('/partner/attendance/scan', { qrToken }),
  changePassword: (currentPassword: string, newPassword: string) => apiClient.post<{ success: boolean }>('/partner/password', { currentPassword, newPassword }),
};
