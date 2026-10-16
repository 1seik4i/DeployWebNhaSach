import { Router } from 'express';
import { ProposalController } from './proposal.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  listProposalSchema,
  getProposalSchema,
  approveProposalSchema,
  requestSupplementSchema,
  rejectProposalSchema,
} from './proposal.validation.js';

const router = Router();
const managerAccess = [authenticate, authorize('admin')];

router.get(
  '/proposals',
  ...managerAccess,
  validate(listProposalSchema),
  asyncHandler(ProposalController.list),
);

router.get(
  '/proposals/:id',
  ...managerAccess,
  validate(getProposalSchema),
  asyncHandler(ProposalController.getById),
);

router.post(
  '/proposals/:id/approve',
  ...managerAccess,
  validate(approveProposalSchema),
  asyncHandler(ProposalController.approve),
);

router.post(
  '/proposals/:id/request-supplement',
  ...managerAccess,
  validate(requestSupplementSchema),
  asyncHandler(ProposalController.requestSupplement),
);

router.post(
  '/proposals/:id/reject',
  ...managerAccess,
  validate(rejectProposalSchema),
  asyncHandler(ProposalController.reject),
);

export default router;
