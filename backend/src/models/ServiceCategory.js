import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  estimatedBasePrice: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  originalPrice: { type: Number, default: 0 },
  estimatedDuration: { type: String, default: '30-60 mins' },
  rating: { type: Number, default: 4.8 },
  reviewCount: { type: Number, default: 120 },
  inclusions: [{ type: String }],
  highlights: [{ type: String }],
  unit: { type: String, default: 'per service' },
  requiredSkills: [{ type: String }]
});

const serviceCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: { type: String, default: '' },
  icon: { type: String, default: 'wrench' },
  subcategories: [subcategorySchema],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('ServiceCategory', serviceCategorySchema);

