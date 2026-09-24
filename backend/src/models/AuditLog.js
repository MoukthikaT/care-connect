import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: { type: String, required: true },
  action: { type: String, required: true },
  targetEntity: { type: String, default: '' },
  targetEntityId: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: '' },
  timestamp: {
    type: Date,
    default: Date.now,
    index: -1
  }
}, { timestamps: false });

export default mongoose.model('AuditLog', auditLogSchema);
