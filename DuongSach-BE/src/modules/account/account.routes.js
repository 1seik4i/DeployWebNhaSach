import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { AccountService } from './account.service.js';

const router = Router();
const profileRoutes = [
  ['/partner/profile', ['partner']],
  ['/admin/profile', ['admin']],
];

for (const [path, roles] of profileRoutes) {
  router.get(path, authenticate, authorize(...roles), asyncHandler(async (req, res) =>
    ApiResponse.success(res, await AccountService.getProfile(req.user.id))));
  router.patch(path, authenticate, authorize(...roles), asyncHandler(async (req, res) =>
    ApiResponse.success(res, await AccountService.updateProfile(req.user.id, req.body || {}))));
}

export default router;
