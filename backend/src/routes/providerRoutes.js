import express from 'express';
import {
  getMyProviderProfile,
  getProviderById,
  updateProviderProfile,
  uploadVerificationDoc,
  getPendingVerifications,
  verifyProvider
} from '../controllers/providerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);

// Provider specific endpoints
router.get('/profile/me', authorize(ROLES.SERVICE_PROVIDER), getMyProviderProfile);
router.put('/profile', authorize(ROLES.SERVICE_PROVIDER), updateProviderProfile);
router.post('/documents', authorize(ROLES.SERVICE_PROVIDER), uploadSingle, uploadVerificationDoc);

// Operations Manager & Platform Admin verification queue endpoints
router.get('/verifications/pending', authorize(ROLES.OPS_MANAGER, ROLES.ADMIN), getPendingVerifications);
router.patch('/:id/verify', authorize(ROLES.OPS_MANAGER, ROLES.ADMIN), verifyProvider);

// Generic lookup endpoint
router.get('/:id', getProviderById);

export default router;
