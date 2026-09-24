import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({
  serviceRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true,
    index: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  estimatedCost: {
    type: Number,
    required: [true, 'Estimated cost is required']
  },
  breakdown: [{
    description: String,
    amount: Number
  }],
  estimatedDurationHours: {
    type: Number,
    default: 1
  },
  notes: {
    type: String,
    default: ''
  },
  validUntil: Date,
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Expired'],
    default: 'Pending'
  }
}, { timestamps: true });

export default mongoose.model('Quote', quoteSchema);
