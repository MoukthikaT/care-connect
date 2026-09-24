import ServiceEvidence from '../models/ServiceEvidence.js';
import Booking from '../models/Booking.js';
import { uploadToCloudinary } from '../services/mediaService.js';
import { logAuditAction } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { ROLES } from '../config/constants.js';

// @desc    Upload or Update Service Evidence (Before / After photos & notes)
// @route   POST /api/v1/evidence/upload
// @access  Private (Provider)
export const uploadEvidence = async (req, res, next) => {
  try {
    const { bookingId, type, notes, photoUrl, customerDigitalSignature } = req.body;

    if (!bookingId || !type || !['before', 'after'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "bookingId and type ('before' or 'after') are required."
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Provider Guard
    const isProvider = booking.provider.toString() === req.user._id.toString();
    const isOps = [ROLES.OPS_MANAGER, ROLES.ADMIN].includes(req.user.role);
    if (!isProvider && !isOps) {
      return res.status(403).json({ success: false, message: 'Only the assigned provider can submit service evidence.' });
    }

    let evidence = await ServiceEvidence.findOne({ booking: bookingId });
    if (!evidence) {
      evidence = new ServiceEvidence({ booking: bookingId });
    }

    let photoObj = null;

    // Handle file upload if req.file exists
    if (req.file) {
      const uploadRes = await uploadToCloudinary(req.file.buffer, 'service_evidence', req.file.originalname);
      photoObj = {
        url: uploadRes.url,
        cloudinaryId: uploadRes.cloudinaryId,
        uploadedAt: new Date()
      };
    } else if (photoUrl && photoUrl.trim()) {
      photoObj = {
        url: photoUrl.trim(),
        cloudinaryId: '',
        uploadedAt: new Date()
      };
    }

    if (type === 'before') {
      if (photoObj) evidence.beforePhotos.push(photoObj);
      if (notes !== undefined) evidence.beforeNotes = notes;
      if (!evidence.checkedInTimestamp) evidence.checkedInTimestamp = new Date();
    } else if (type === 'after') {
      if (photoObj) evidence.afterPhotos.push(photoObj);
      if (notes !== undefined) evidence.afterNotes = notes;
      if (!evidence.completedTimestamp) evidence.completedTimestamp = new Date();
      if (customerDigitalSignature) evidence.customerDigitalSignature = customerDigitalSignature;
    }

    await evidence.save();

    // Create Notification for Customer
    await createNotification({
      recipient: booking.customer,
      type: 'BOOKING_UPDATE',
      title: `${type === 'before' ? 'Before' : 'After'} Service Evidence Added`,
      message: `Provider uploaded ${type} service photo/notes for Booking ${booking.bookingNumber}.`,
      relatedEntity: { entityType: 'Booking', entityId: booking._id }
    });

    // Audit Log
    await logAuditAction({
      actor: req.user._id,
      role: req.user.role,
      action: `SERVICE_EVIDENCE_${type.toUpperCase()}_UPLOADED`,
      targetEntity: 'ServiceEvidence',
      targetEntityId: evidence._id,
      details: { bookingId, type },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: `${type === 'before' ? 'Before' : 'After'} service evidence uploaded successfully.`,
      evidence
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Service Evidence by Booking ID
// @route   GET /api/v1/evidence/booking/:bookingId
// @access  Private (Authenticated)
export const getEvidenceByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // RBAC check
    const isCustomer = booking.customer.toString() === req.user._id.toString();
    const isProvider = booking.provider.toString() === req.user._id.toString();
    const isStaff = [ROLES.OPS_MANAGER, ROLES.ADMIN, ROLES.SUPPORT_AGENT].includes(req.user.role);

    if (!isCustomer && !isProvider && !isStaff) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to view evidence.' });
    }

    let evidence = await ServiceEvidence.findOne({ booking: bookingId });
    if (!evidence) {
      return res.status(200).json({
        success: true,
        evidence: {
          booking: bookingId,
          beforePhotos: [],
          afterPhotos: [],
          beforeNotes: '',
          afterNotes: ''
        }
      });
    }

    res.status(200).json({ success: true, evidence });
  } catch (error) {
    next(error);
  }
};
