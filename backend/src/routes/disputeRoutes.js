import express from 'express';
import { createDispute, getAllDisputes, getDisputeById, resolveDispute } from '../controllers/disputeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();
router.use(protect);

router.post('/', authorize(ROLES.CUSTOMER, ROLES.SERVICE_PROVIDER), createDispute);
router.get('/', authorize(ROLES.CUSTOMER, ROLES.SERVICE_PROVIDER, ROLES.SUPPORT_AGENT, ROLES.OPS_MANAGER, ROLES.ADMIN), getAllDisputes);
router.get('/:id', authorize(ROLES.CUSTOMER, ROLES.SERVICE_PROVIDER, ROLES.SUPPORT_AGENT, ROLES.OPS_MANAGER, ROLES.ADMIN), getDisputeById);
router.patch('/:id/resolve', authorize(ROLES.SUPPORT_AGENT, ROLES.OPS_MANAGER, ROLES.ADMIN), resolveDispute);

export default router;
