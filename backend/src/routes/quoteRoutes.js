import express from 'express';
import { createQuote, getMyQuotes, getQuotesForRequest, acceptQuote, cancelQuote } from '../controllers/quoteController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();
router.use(protect);
router.post('/', authorize(ROLES.SERVICE_PROVIDER), createQuote);
router.get('/my', authorize(ROLES.SERVICE_PROVIDER), getMyQuotes);
router.get('/request/:requestId', authorize(ROLES.CUSTOMER, ROLES.OPS_MANAGER, ROLES.ADMIN), getQuotesForRequest);
router.patch('/:id/accept', authorize(ROLES.CUSTOMER), acceptQuote);
router.patch('/:id/cancel', authorize(ROLES.SERVICE_PROVIDER), cancelQuote);

export default router;
