import express from 'express';
import { getMyNotifications, markAsRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { ALL_ROLES } from '../config/constants.js';

const router = express.Router();
router.use(protect, authorize(...ALL_ROLES));
router.get('/', getMyNotifications);
router.patch('/mark-read', markAsRead);

export default router;
