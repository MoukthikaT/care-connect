import express from 'express';
import { uploadEvidence, getEvidenceByBooking } from '../controllers/evidenceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { uploadSinglePhoto } from '../middleware/uploadMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();
router.use(protect);

router.post('/upload', authorize(ROLES.SERVICE_PROVIDER, ROLES.OPS_MANAGER, ROLES.ADMIN), uploadSinglePhoto('photo'), uploadEvidence);
router.get('/booking/:bookingId', authorize(ROLES.CUSTOMER, ROLES.SERVICE_PROVIDER, ROLES.OPS_MANAGER, ROLES.ADMIN, ROLES.SUPPORT_AGENT), getEvidenceByBooking);

export default router;
