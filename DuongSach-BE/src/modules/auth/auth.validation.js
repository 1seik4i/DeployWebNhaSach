import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1, 'Vui lòng nhập email hoặc tên đăng nhập'),
    password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh Token là bắt buộc'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Địa chỉ email không đúng định dạng').min(1, 'Vui lòng nhập địa chỉ email'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Mã xác thực token là bắt buộc'),
    newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
  }),
});
