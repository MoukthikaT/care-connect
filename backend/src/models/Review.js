import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  punctualityRating: { type: Number, min: 1, max: 5 },
  qualityRating: { type: Number, min: 1, max: 5 },
  comment: { type: String, default: '' },
  providerReply: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);
