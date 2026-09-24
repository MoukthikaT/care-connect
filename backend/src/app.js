import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import evidenceRoutes from './routes/evidenceRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import disputeRoutes from './routes/disputeRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/api/v1/health', (req, res) => res.status(200).json({
  status: 'OK', app: 'CareConnect Platform API', version: '1.0.0', timestamp: new Date().toISOString()
}));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/providers', providerRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/quotes', quoteRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/evidence', evidenceRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/disputes', disputeRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/audit', auditRoutes);

app.use('*', (req, res) => res.status(404).json({ success: false, message: `API endpoint ${req.originalUrl} not found.` }));
app.use(errorHandler);

export default app;
