import express from 'express';
import { createInvoice, getInvoiceByBooking, getMyInvoices, payInvoice } from '../controllers/invoiceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();
router.use(protect);

router.post('/', authorize(ROLES.SERVICE_PROVIDER, ROLES.OPS_MANAGER, ROLES.ADMIN), createInvoice);
router.get('/my', authorize(ROLES.CUSTOMER, ROLES.SERVICE_PROVIDER), getMyInvoices);
router.get('/booking/:bookingId', authorize(ROLES.CUSTOMER, ROLES.SERVICE_PROVIDER, ROLES.OPS_MANAGER, ROLES.ADMIN, ROLES.SUPPORT_AGENT), getInvoiceByBooking);
router.post('/:id/pay', authorize(ROLES.CUSTOMER), payInvoice);

export default router;
