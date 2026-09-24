import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema({

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory',
    required: false
  },

  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },

  description: {
    type: String,
    required: [true, 'Description is required']
  },

  mediaAttachments: [{
    url: String,
    cloudinaryId: String
  }],

  location: {
    address: {
      type: String,
      required: true
    },

    coordinates: {
      type: {
        type: String,
        default: 'Point'
      },

      coordinates: {
        type: [Number],
        required: true
      }
    }
  },

  preferredSchedule: {
    date: Date,
    timeSlot: String
  },

  urgency: {
    type: String,
    enum: [
      'Normal',
      'High',
      'Emergency'
    ],
    default: 'Normal'
  },

  aiAnalysis: {
    suggestedCategory: String,
    detectedSkills: [String],
    complexityScore: Number,
    aiTags: [String],
    confidenceScore: Number
  },

  status: {
    type: String,
    enum: [
      'Draft',
      'Open',
      'Quoted',
      'Assigned',
      'In_Progress',
      'Completed',
      'Cancelled'
    ],
    default: 'Open'
  }

}, {
  timestamps: true
});

// Geospatial index
serviceRequestSchema.index({
  'location.coordinates': '2dsphere'
});

export default mongoose.model(
  'ServiceRequest',
  serviceRequestSchema
);