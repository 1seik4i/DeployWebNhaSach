import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { QuickLoginService } from './quick-login.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { loginSchema, refreshSchema } from './auth.validation.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

const router = Router();

// Các endpoint phiên đăng nhập tối thiểu để cả bốn giao diện role sử dụng được.
router.post('/login', validate(loginSchema), asyncHandler(AuthController.login));
router.post('/refresh', validate(refreshSchema), asyncHandler(AuthController.refresh));
router.post('/logout', asyncHandler(AuthController.logout));
router.get('/me', authenticate, asyncHandler(AuthController.me));

router.get('/demo-accounts', asyncHandler(async (_req, res) => {
  return ApiResponse.success(res, await QuickLoginService.listAccounts());
}));
router.post('/demo-login', asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await QuickLoginService.login(req.body?.role));
}));

export default router;
