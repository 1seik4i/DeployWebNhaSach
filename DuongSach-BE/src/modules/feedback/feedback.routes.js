import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { heritageFeedbackErrors } from '../../middlewares/heritageFeedbackErrors.js';
import { FeedbackService as service } from './feedback.service.js';
import { feedbackListSchema, feedbackIdSchema, feedbackStatusSchema } from './feedback.validation.js';

const router = Router();
router.use(authenticate, authorize('admin'));
router.get('/', validate(feedbackListSchema, 400), asyncHandler(async (req, res) => {
  const result = await service.list(req.query);
  return ApiResponse.success(res, result.data, result.meta);
}));
router.get('/:id', validate(feedbackIdSchema, 400), asyncHandler(async (req, res) => ApiResponse.success(res, await service.get(req.params.id))));
router.patch('/:id/status', validate(feedbackStatusSchema, 400), asyncHandler(async (req, res) => ApiResponse.success(res, await service.updateStatus(req.params.id, req.body))));
router.use(heritageFeedbackErrors);
export default router;
