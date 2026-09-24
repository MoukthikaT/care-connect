import mongoose from 'mongoose';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../config/constants.js';

const bookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    required: true,
    unique: true
  },
  serviceRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true
  },
  quote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    default: '10:00 AM - 12:00 PM'
  },
  agreedPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.REQUESTED
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  }
}, { timestamps: true });

// Required indexes
bookingSchema.index({ provider: 1, scheduledDate: 1 }); // Compound index for provider agenda & schedule checking

export default mongoose.model('Booking', bookingSchema);
