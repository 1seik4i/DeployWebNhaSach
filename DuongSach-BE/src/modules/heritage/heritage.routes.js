import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { heritageFeedbackErrors } from '../../middlewares/heritageFeedbackErrors.js';
import { HeritageAdminService as service } from './heritage-admin.service.js';
import { heritageListSchema, heritageIdSchema, heritageCreateSchema, heritageUpdateSchema } from './heritage.validation.js';

const router = Router();
router.use(authenticate, authorize('admin'));
router.get('/', validate(heritageListSchema, 400), asyncHandler(async (req, res) => {
  const result = await service.list(req.query);
  return ApiResponse.success(res, result.data, result.meta);
}));
router.get('/:id', validate(heritageIdSchema, 400), asyncHandler(async (req, res) => ApiResponse.success(res, await service.get(req.params.id))));
router.post('/', validate(heritageCreateSchema, 400), asyncHandler(async (req, res) => ApiResponse.success(res, await service.create(req.body), null, [], 201)));
router.put('/:id', validate(heritageUpdateSchema, 400), asyncHandler(async (req, res) => ApiResponse.success(res, await service.update(req.params.id, req.body))));
router.delete('/:id', validate(heritageIdSchema, 400), asyncHandler(async (req, res) => ApiResponse.success(res, await service.remove(req.params.id, req.user.id))));
router.get('/:id/qr', validate(heritageIdSchema, 400), asyncHandler(async (req, res) => ApiResponse.success(res, await service.qr(req.params.id))));
router.use(heritageFeedbackErrors);
export default router;
