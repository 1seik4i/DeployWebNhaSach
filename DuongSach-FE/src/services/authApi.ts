import { apiClient } from './apiClient';

type UserRole = 'admin' | 'partner';

type AuthResult = { user: AuthUser; accessToken: string; refreshToken: string };

interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  primaryRole: UserRole;
}

export const authApi = {
  async login(data: { email: string; password: string }): Promise<AuthResult> {
    const session = await apiClient.post<AuthResult>('/auth/login', data);
    if (!['admin', 'partner'].includes(session.user.primaryRole)) throw new Error('Tài khoản không có quyền truy cập cổng.');
    return session;
  },

  getMe: () => apiClient.get<{ user: any }>('/auth/me'),

  logout: (refreshToken?: string) => apiClient.post('/auth/logout', { refreshToken }),
  forgotPassword: (email: string) => apiClient.post<{ message: string }>('/auth/forgot-password', { email }),
  verifyResetToken: (token: string) => apiClient.get<{ valid: boolean; email: string; fullName: string }>(`/auth/reset-password/verify?token=${encodeURIComponent(token)}`),
  resetPassword: (data: { token: string; newPassword: string }) => apiClient.post<{ message: string }>('/auth/reset-password', data),
};
