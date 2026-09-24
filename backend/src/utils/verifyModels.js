import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import ServiceCategory from '../models/ServiceCategory.js';
import ProviderAvailability from '../models/ProviderAvailability.js';
import ServiceRequest from '../models/ServiceRequest.js';
import Quote from '../models/Quote.js';
import Booking from '../models/Booking.js';
import ServiceEvidence from '../models/ServiceEvidence.js';
import Invoice from '../models/Invoice.js';
import Review from '../models/Review.js';
import Dispute from '../models/Dispute.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

dotenv.config();

const models = [
  { name: 'User', model: User },
  { name: 'ProviderProfile', model: ProviderProfile },
  { name: 'ServiceCategory', model: ServiceCategory },
  { name: 'ProviderAvailability', model: ProviderAvailability },
  { name: 'ServiceRequest', model: ServiceRequest },
  { name: 'Quote', model: Quote },
  { name: 'Booking', model: Booking },
  { name: 'ServiceEvidence', model: ServiceEvidence },
  { name: 'Invoice', model: Invoice },
  { name: 'Review', model: Review },
  { name: 'Dispute', model: Dispute },
  { name: 'Notification', model: Notification },
  { name: 'AuditLog', model: AuditLog }
];

async function verifyAllModels() {
  console.log('--- Verifying 13 Mongoose Models & MongoDB Indexes ---');
  await connectDB();

  let successCount = 0;
  for (const m of models) {
    try {
      const indexes = await m.model.init();
      console.log(`[PASS] ${m.name} Model Loaded & Indexes Initialized.`);
      successCount++;
    } catch (err) {
      console.error(`[FAIL] ${m.name} Model Error:`, err.message);
    }
  }

  console.log(`Summary: ${successCount} / 13 Models verified successfully.`);
  await mongoose.disconnect();
}

verifyAllModels();
