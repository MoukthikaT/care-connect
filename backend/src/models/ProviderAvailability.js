import mongoose from 'mongoose';

const providerAvailabilitySchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  weeklySchedule: [{
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    slots: [{
      startTime: String, // e.g., "09:00"
      endTime: String    // e.g., "17:00"
    }]
  }],
  blackoutDates: [{
    date: Date,
    reason: String
  }],
  isCurrentlyOnline: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('ProviderAvailability', providerAvailabilitySchema);
