import { Router } from 'express';
import { EventController } from './event.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  listEventSchema,
  getEventSchema,
  createEventSchema,
  updateEventSchema,
  deleteEventSchema,
} from './event.validation.js';

const router = Router();
const managerAccess = [authenticate, authorize('admin')];

router.get(
  '/events',
  ...managerAccess,
  validate(listEventSchema),
  asyncHandler(EventController.list),
);

router.get(
  '/events/:id',
  ...managerAccess,
  validate(getEventSchema),
  asyncHandler(EventController.getById),
);

router.post(
  '/events',
  ...managerAccess,
  validate(createEventSchema),
  asyncHandler(EventController.create),
);

router.put(
  '/events/:id',
  ...managerAccess,
  validate(updateEventSchema),
  asyncHandler(EventController.update),
);

router.delete(
  '/events/:id',
  ...managerAccess,
  validate(deleteEventSchema),
  asyncHandler(EventController.remove),
);

export default router;
