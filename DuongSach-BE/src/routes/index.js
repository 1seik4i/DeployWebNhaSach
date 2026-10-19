import { Router } from 'express';
import authSessionRoutes from '../modules/auth/auth-session.routes.js';
import publicRoutes from '../modules/public/public.routes.js';
import facilityRoutes from '../modules/facility/facility.routes.js';
import accountRoutes from '../modules/account/account.routes.js';
import accessControlRoutes from '../modules/access-control/access-control.routes.js';
import eventRoutes from '../modules/event/event.routes.js';
import proposalRoutes from '../modules/proposal/proposal.routes.js';
import heritageRoutes from '../modules/heritage/heritage.routes.js';
import feedbackRoutes from '../modules/feedback/feedback.routes.js';
import libraryRoutes from '../modules/library/library.routes.js';
import managementRoutes from '../modules/account/management.routes.js';
import contentRoutes from '../modules/public/content.routes.js';
import operationsRoutes from '../modules/event/operations.routes.js';
import partnerRoutes from '../modules/booth/partner.routes.js';
import reportsRoutes from '../modules/event/reports.routes.js';
import mapRoutes from '../modules/public/map.routes.js';
import eventRegistrationRoutes from '../modules/event/event-registration.routes.js';
import { partnerPermissions } from '../middlewares/partner-permissions.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();

// Giữ phiên đăng nhập để giao diện của cả bốn vai trò vẫn truy cập được.
router.use('/auth', authSessionRoutes);
router.use('/partner', partnerPermissions);
router.use('/', libraryRoutes);
router.use('/', managementRoutes);
router.use('/', contentRoutes);
router.use('/', operationsRoutes);
router.use('/', eventRegistrationRoutes);
router.use('/', partnerRoutes);
router.use('/', reportsRoutes);
router.use('/', mapRoutes);
router.use('/public', publicRoutes);
router.use('/admin/heritages', heritageRoutes);
router.use('/admin/feedbacks', feedbackRoutes);
router.use('/admin', facilityRoutes);
router.use('/admin', accessControlRoutes);
router.use('/admin', eventRoutes);
router.use('/admin', proposalRoutes);
router.use('/', accountRoutes);

router.use((req, res) => ApiResponse.error(res, new ApiError(
  501,
  'Chức năng này chưa được triển khai. Dữ liệu chưa khả dụng.',
  'NOT_IMPLEMENTED',
)));

export default router;
