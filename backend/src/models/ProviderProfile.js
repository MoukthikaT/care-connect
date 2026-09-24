import mongoose from 'mongoose';

const providerProfileSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  bio: {
    type: String,
    default: ''
  },

  businessName: {
    type: String,
    default: ''
  },

  skills: [{
    type: String
  }],

  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory'
  }],

  serviceAreas: [{
    cityName: String,

    center: {
      type: {
        type: String,
        default: 'Point'
      },

      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },

    radiusInKm: {
      type: Number,
      default: 25
    }
  }],

  hourlyRate: {
    type: Number,
    default: 0
  },

  verificationStatus: {
    type: String,
    enum: [
      'Pending',
      'Verified',
      'Rejected'
    ],
    default: 'Pending'
  },

  verificationDocuments: [{
    docName: String,
    fileUrl: String,
    cloudinaryId: String,

    uploadedAt: {
      type: Date,
      default: Date.now
    },

    verifiedAt: Date
  }],

  rating: {
    average: {
      type: Number,
      default: 0
    },

    count: {
      type: Number,
      default: 0
    }
  },

  completedJobsCount: {
    type: Number,
    default: 0
  },

  isAvailableForEmergency: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

// Geospatial index
providerProfileSchema.index({
  'serviceAreas.center': '2dsphere'
});

export default mongoose.model(
  'ProviderProfile',
  providerProfileSchema
);