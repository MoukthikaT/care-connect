import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, ALL_ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ALL_ROLES,
    default: ROLES.CUSTOMER
  },
  avatar: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Pending Verification', 'Suspended'],
    default: 'Active'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before save if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password instance method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
