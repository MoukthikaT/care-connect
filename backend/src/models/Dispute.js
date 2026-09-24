import mongoose from 'mongoose';
import { DISPUTE_STATUS } from '../config/constants.js';

const disputeSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  againstUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: [true, 'Dispute reason is required']
  },
  description: { type: String, default: '' },
  evidencePhotos: [{
    url: String,
    cloudinaryId: String
  }],
  assignedSupportAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: Object.values(DISPUTE_STATUS),
    default: DISPUTE_STATUS.OPEN
  },
  resolutionNotes: { type: String, default: '' },
  resolvedAt: Date
}, { timestamps: true });

export default mongoose.model('Dispute', disputeSchema);
