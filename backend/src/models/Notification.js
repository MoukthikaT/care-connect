import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['BOOKING_UPDATE', 'QUOTE_RECEIVED', 'DISPUTE_UPDATE', 'PAYMENT_RECEIPT', 'SYSTEM_ALERT'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['Booking', 'Quote', 'ServiceRequest', 'Dispute', 'Invoice', 'Review', 'ProviderProfile']
    },
    entityId: mongoose.Schema.Types.ObjectId
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: Date
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);
