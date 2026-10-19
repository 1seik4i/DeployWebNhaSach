import type {
  AdminAuditLogItem,
  AdminNotificationItem,
  AdminPermissionItem,
  AdminProfile,
  AdminRolePermissionConfig,
  AdminRoleType,
  AdminSystemSettings,
  AdminUserAccount,
} from '../types/admin';
import { apiClient } from './apiClient';

export interface AdminDashboardStats {
  userCount: number;
  eventCount: number;
  openEventCount: number;
  boothCount: number;
  activityCount: number;
  todayActivityCount: number;
  usersByRole: Record<string, number>;
  auditByDay: Array<{ date: string; count: number }>;
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(-2).toUpperCase();

export function resolveAdminNotificationTargetTab(item: {
  title?: string;
  message?: string;
  content?: string;
  link?: string;
  kind?: string;
  category?: string;
}): string {
  const link = (item.link || '').trim();

  // 1. Check if link contains query parameter tab=... (e.g. /admin?tab=activities)
  if (link.includes('tab=')) {
    const match = link.match(/tab=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  // 2. Check if link is a valid path directly e.g. /admin/activities
  if (link && link !== '/admin' && link !== '/admin/' && !link.startsWith('/admin?')) {
    const cleaned = link.replace(/^\/+/, '').replace(/^admin\/?/, '');
    if (cleaned) return cleaned;
  }

  // 3. Smart resolution by title & message keywords
  const titleLower = (item.title || '').toLowerCase();
  const contentLower = (item.message || item.content || '').toLowerCase();
  const text = `${titleLower} ${contentLower}`;

  // Đơn đăng ký sự kiện / Hồ sơ sự kiện từ đối tác
  if (
    titleLower.includes('đơn đăng ký sự kiện') ||
    titleLower.includes('hồ sơ sự kiện') ||
    titleLower.includes('hồ sơ tham gia') ||
    text.includes('hồ sơ đăng ký tham gia sự kiện') ||
    text.includes('đăng ký tham gia sự kiện')
  ) {
    return 'event-applications';
  }

  // Đề xuất hoạt động
  if (
    titleLower.includes('đề xuất hoạt động') ||
    titleLower.includes('hoạt động mới') ||
    titleLower.includes('đề xuất') ||
    text.includes('đề xuất hoạt động')
  ) {
    return 'activities';
  }

  // Gian hàng / Yêu cầu đăng ký gian hàng / Phân bổ gian hàng
  if (
    titleLower.includes('gian hàng') ||
    text.includes('đăng ký gian hàng') ||
    text.includes('phân bổ gian hàng') ||
    text.includes('yêu cầu đăng ký gian hàng')
  ) {
    return 'booths';
  }

  // Báo cáo / Thống kê
  if (
    titleLower.includes('báo cáo') ||
    titleLower.includes('thống kê') ||
    text.includes('lượt check-in') ||
    text.includes('doanh thu')
  ) {
    return 'reports';
  }

  // Đánh giá / Phản hồi
  if (
    titleLower.includes('đánh giá') ||
    titleLower.includes('phản hồi') ||
    titleLower.includes('góp ý')
  ) {
    return 'feedback';
  }

  // Sự kiện
  if (titleLower.includes('sự kiện')) {
    return 'events';
  }

  // Người dùng & Tài khoản
  if (
    titleLower.includes('người dùng') ||
    titleLower.includes('tài khoản') ||
    item.category === 'account' ||
    item.kind === 'account'
  ) {
    return 'users';
  }

  // Quyền / Vai trò
  if (
    titleLower.includes('phân quyền') ||
    titleLower.includes('vai trò') ||
    titleLower.includes('quyền') ||
    item.category === 'role' ||
    item.kind === 'role'
  ) {
    return 'roles';
  }

  // Nhật ký / Bảo mật
  if (
    item.category === 'security' ||
    item.kind === 'security' ||
    titleLower.includes('an ninh') ||
    titleLower.includes('nhật ký') ||
    titleLower.includes('bảo mật')
  ) {
    return 'audit';
  }

  // Cài đặt
  if (titleLower.includes('cài đặt') || titleLower.includes('cấu hình')) {
    return 'settings';
  }

  // Tin tức / Bài viết
  if (titleLower.includes('tin tức') || titleLower.includes('bài viết')) {
    return 'landing-news';
  }

  return 'dashboard';
}

export const adminApi = {
  async getDashboard(): Promise<AdminDashboardStats> {
    const result = await apiClient.get<AdminDashboardStats>('/admin/dashboard');
    const adminCount = result.usersByRole?.admin ?? 0;
    const partnerCount = result.usersByRole?.partner ?? 0;
    return { ...result, userCount: result.userCount ?? adminCount + partnerCount };
  },

  async getUsers(): Promise<AdminUserAccount[]> {
    const users = await apiClient.get<any[]>('/admin/users');
    return users.filter(user => ['admin', 'partner'].includes(user.primaryRole || user.role)).map(user => {
      const role = (user.primaryRole || user.role) as AdminRoleType;
      return {
        id: user.id,
        code: user.code || user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || '',
        role,
        roleLabelVi: role === 'partner' ? 'Đối tác / Gian hàng' : 'Quản trị viên',
        status: user.status,
        statusLabelVi: user.status === 'locked' ? 'Đã khóa' : user.status === 'pending_verification' ? 'Chờ xác minh' : 'Hoạt động',
        lastActive: user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString('vi-VN') : 'Chưa có hoạt động',
        createdDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '',
        avatarInitials: initials(user.fullName || ''),
        avatarUrl: user.avatarUrl || user.avatar || undefined,
        lockReason: user.lockReason || undefined,
      } as AdminUserAccount;
    });
  },

  createUser: (data: { fullName: string; email: string; phone?: string; role: AdminRoleType; status: string; password?: string }) => apiClient.post('/admin/users', data),
  updateUser: (id: string, data: unknown) => apiClient.patch(`/admin/users/${encodeURIComponent(id)}`, data),
  updateUserStatus: (userId: string, status: string, reason?: string) => apiClient.patch(`/admin/users/${encodeURIComponent(userId)}/status`, { status, reason }),
  resetPassword: (userId: string) => apiClient.post<{ resetToken: string; expiresInMinutes: number }>(`/admin/users/${encodeURIComponent(userId)}/reset-password`, {}),

  async getRoles(): Promise<Record<AdminRoleType, AdminRolePermissionConfig>> {
    const roles = await apiClient.get<any[]>('/admin/roles');
    const result = {} as Record<AdminRoleType, AdminRolePermissionConfig>;
    for (const role of roles.filter(item => item.code === 'admin' || item.code === 'partner')) {
      result[role.code as AdminRoleType] = {
        roleId: role.id,
        roleName: role.name,
        description: role.description || '',
        assignedPermissionCodes: role.rolePerms?.map((entry: any) => entry.permission.code) || [],
      };
    }
    return result;
  },
  async getPermissions(): Promise<AdminPermissionItem[]> {
    const rows = await apiClient.get<any[]>('/admin/permissions');
    return rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      nameEn: row.name,
      description: row.description || '',
      module: row.module,
      moduleLabelVi: row.module,
    }));
  },
  saveRolePermissions: (roleId: AdminRoleType, permissionCodes: string[]) => apiClient.put(`/admin/roles/${encodeURIComponent(roleId)}/permissions`, { permissionCodes }),

  async getSettings(): Promise<AdminSystemSettings> {
    const rows = await apiClient.get<Array<{ key: string; value: unknown }>>('/admin/settings');
    const value = rows.find(row => row.key === 'admin.system')?.value;
    if (!value || typeof value !== 'object') {
      throw new Error('Không tìm thấy cấu hình hệ thống trong cơ sở dữ liệu.');
    }
    return value as AdminSystemSettings;
  },
  saveSettings: (settings: AdminSystemSettings) => apiClient.put('/admin/settings', { 'admin.system': settings }),

  getProfile: async (): Promise<AdminProfile> => {
    const user = await apiClient.get<any>('/admin/profile');
    return {
      id: user.id,
      name: user.fullName,
      role: 'Administrator',
      department: user.department || '',
      email: user.email,
      phone: user.phone || '',
      avatarInitials: initials(user.fullName || ''),
      avatarUrl: user.avatarUrl || '',
      lastLogin: user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString('vi-VN') : '',
    };
  },
  updateProfile: (data: unknown) => apiClient.patch('/admin/profile', data),
  changePassword: (currentPassword: string, newPassword: string) => apiClient.post('/admin/profile/password', { currentPassword, newPassword }),

  async getNotifications(): Promise<AdminNotificationItem[]> {
    const rows = await apiClient.get<any[]>('/admin/notifications');
    return rows.map(item => ({
      id: item.id,
      title: item.title,
      content: item.message,
      category: ['security', 'account', 'role'].includes(item.kind) ? item.kind : 'system',
      timeAgo: new Date(item.createdAt).toLocaleString('vi-VN'),
      isRead: item.isRead,
      isImportant: item.isImportant || false,
      targetTab: resolveAdminNotificationTargetTab(item),
    }));
  },
  markNotificationRead: (id: string) => apiClient.patch(`/admin/notifications/${encodeURIComponent(id)}/read`, {}),
  markAllNotificationsRead: () => apiClient.patch('/admin/notifications/read-all', {}),

  async getAuditLogs(): Promise<AdminAuditLogItem[]> {
    const logs = await apiClient.get<any[]>('/admin/audit-logs');
    return logs.map(log => ({
      id: log.id,
      createdAt: log.createdAt,
      timestamp: new Date(log.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      actorName: log.actor?.fullName || '',
      actorEmail: log.actor?.email || '',
      actorRole: log.actor?.primaryRole || 'admin',
      actionType: log.action || 'update',
      actionLabelVi: log.action || '',
      targetObject: log.targetType || '',
      details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {}),
      status: 'success',
      ipAddress: log.ipAddress || '',
    }));
  },
};
