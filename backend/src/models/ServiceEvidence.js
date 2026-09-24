import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  cloudinaryId: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now }
});

const serviceEvidenceSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  beforePhotos: [photoSchema],
  beforeNotes: { type: String, default: '' },
  afterPhotos: [photoSchema],
  afterNotes: { type: String, default: '' },
  checkedInTimestamp: Date,
  completedTimestamp: Date,
  customerDigitalSignature: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('ServiceEvidence', serviceEvidenceSchema);
