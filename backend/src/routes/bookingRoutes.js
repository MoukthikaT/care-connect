import express from 'express';
import { getMyBookings, getBookingById, updateBookingStatus, checkConflict } from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();
router.use(protect);

router.get('/my', authorize(ROLES.CUSTOMER, ROLES.SERVICE_PROVIDER, ROLES.OPS_MANAGER, ROLES.ADMIN, ROLES.SUPPORT_AGENT), getMyBookings);
router.get('/', authorize(ROLES.CUSTOMER, ROLES.SERVICE_PROVIDER, ROLES.OPS_MANAGER, ROLES.ADMIN, ROLES.SUPPORT_AGENT), getMyBookings);
router.post('/check-conflict', authorize(ROLES.SERVICE_PROVIDER, ROLES.OPS_MANAGER, ROLES.ADMIN), checkConflict);
router.get('/:id', authorize(ROLES.CUSTOMER, ROLES.SERVICE_PROVIDER, ROLES.OPS_MANAGER, ROLES.ADMIN, ROLES.SUPPORT_AGENT), getBookingById);
router.patch('/:id/status', authorize(ROLES.CUSTOMER, ROLES.SERVICE_PROVIDER, ROLES.OPS_MANAGER, ROLES.ADMIN), updateBookingStatus);

export default router;
