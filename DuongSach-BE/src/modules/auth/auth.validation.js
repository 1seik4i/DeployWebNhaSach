import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1, 'Vui lòng nhập email hoặc tên đăng nhập'),
    password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh Token là bắt buộc'),
  }),
});
