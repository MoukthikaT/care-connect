import express from 'express';
import { getAuditLogs, getAnalyticsStats } from '../controllers/auditController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();
router.use(protect);
router.get('/logs', authorize(ROLES.ADMIN, ROLES.OPS_MANAGER), getAuditLogs);
router.get('/analytics', authorize(ROLES.ADMIN, ROLES.OPS_MANAGER, ROLES.SUPPORT_AGENT), getAnalyticsStats);

export default router;
