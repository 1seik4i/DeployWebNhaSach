import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { FacilityService } from './facility.service.js';

const router = Router();
const adminOnly = [authenticate, authorize('admin')];
const facilityManagers = [authenticate, authorize('admin')];

for (const kind of ['booths', 'venues', 'locations', 'assets']) {
  const access = kind === 'booths' ? adminOnly : facilityManagers;
  router.get(`/${kind}`, ...access, asyncHandler(async (req, res) => {
    const result = await FacilityService.list(kind, req.query);
    return ApiResponse.success(res, result.data, result.meta);
  }));
  router.get(`/${kind}/:id`, ...access, asyncHandler(async (req, res) => ApiResponse.success(res, await FacilityService.get(kind, req.params.id))));
  router.post(`/${kind}`, ...access, asyncHandler(async (req, res) => ApiResponse.success(res, await FacilityService.save(kind, null, req.body), null, [], 201)));
  router.put(`/${kind}/:id`, ...access, asyncHandler(async (req, res) => ApiResponse.success(res, await FacilityService.save(kind, req.params.id, req.body))));
  router.delete(`/${kind}/:id`, ...access, asyncHandler(async (req, res) => ApiResponse.success(res, await FacilityService.remove(kind, req.params.id, req.user.id))));
}

export default router;
