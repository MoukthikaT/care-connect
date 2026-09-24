import express from 'express';
import { createReview, getReviewsForProvider, replyToReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();
router.get('/provider/:providerId', getReviewsForProvider);
router.use(protect);
router.post('/', authorize(ROLES.CUSTOMER), createReview);
router.patch('/:id/reply', authorize(ROLES.SERVICE_PROVIDER), replyToReview);

export default router;
