import express from 'express';
import { createServiceRequest, classifyPreview, getMyRequests, getMatchedRequestsForProvider, getAllRequests, getRequestById, cancelServiceRequest, getRankedProviders } from '../controllers/requestController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();
router.use(protect);

router.post('/classify-preview', authorize(ROLES.CUSTOMER), classifyPreview);
router.post('/', authorize(ROLES.CUSTOMER), createServiceRequest);
router.get('/my', authorize(ROLES.CUSTOMER), getMyRequests);
router.get('/matched', authorize(ROLES.SERVICE_PROVIDER), getMatchedRequestsForProvider);
router.get('/', authorize(ROLES.OPS_MANAGER, ROLES.ADMIN), getAllRequests);
router.get('/:id', authorize(ROLES.CUSTOMER, ROLES.SERVICE_PROVIDER, ROLES.OPS_MANAGER, ROLES.ADMIN), getRequestById);
router.patch('/:id/cancel', authorize(ROLES.CUSTOMER), cancelServiceRequest);
router.get('/:id/ranked-providers', authorize(ROLES.CUSTOMER, ROLES.OPS_MANAGER, ROLES.ADMIN), getRankedProviders);

export default router;
