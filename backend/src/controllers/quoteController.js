import Quote from '../models/Quote.js';
import ServiceRequest from '../models/ServiceRequest.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Booking from '../models/Booking.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditAction } from '../services/auditService.js';
import { BOOKING_STATUS, PAYMENT_STATUS, ROLES } from '../config/constants.js';

// @desc    Submit a cost quote for a Service Request
// @route   POST /api/v1/quotes
// @access  Private (Verified Service Provider)
export const createQuote = async (req, res, next) => {
  try {
    const {
      serviceRequest,
      estimatedCost,
      breakdown,
      estimatedDurationHours,
      notes,
      validUntil
    } = req.body;

    if (!serviceRequest || !estimatedCost || Number(estimatedCost) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide serviceRequest ID and a valid positive estimatedCost.'
      });
    }

    // Verify Provider Profile Status
    const providerProfile = await ProviderProfile.findOne({ user: req.user._id });
    if (!providerProfile || providerProfile.verificationStatus !== 'Verified') {
      return res.status(403).json({
        success: false,
        message: 'Only verified service providers can submit quotes.'
      });
    }

    const requestDoc = await ServiceRequest.findById(serviceRequest);
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Service request not found.' });
    }

    if (!['Open', 'Quoted'].includes(requestDoc.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot submit quote for request in status '${requestDoc.status}'.`
      });
    }

    // Prevent duplicate quote from same provider
    const existingQuote = await Quote.findOne({
      serviceRequest: requestDoc._id,
      provider: req.user._id,
      status: 'Pending'
    });
    if (existingQuote) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an active quote for this service request.'
      });
    }

    const quote = await Quote.create({
      serviceRequest: requestDoc._id,
      provider: req.user._id,
      estimatedCost: Number(estimatedCost),
      breakdown: breakdown || [],
      estimatedDurationHours: estimatedDurationHours || 1,
      notes: notes || '',
      validUntil: validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
      status: 'Pending'
    });

    // Update request status to Quoted
    requestDoc.status = 'Quoted';
    await requestDoc.save();

    // Create Notification for Customer
    await createNotification({
      recipient: requestDoc.customer,
      type: 'QUOTE_RECEIVED',
      title: 'New Quote Received',
      message: `A provider submitted a quote of $${quote.estimatedCost} for "${requestDoc.title}".`,
      relatedEntity: { entityType: 'Quote', entityId: quote._id }
    });

    // Log Audit Action
    await logAuditAction({
      actor: req.user._id,
      role: req.user.role,
      action: 'QUOTE_CREATED',
      targetEntity: 'Quote',
      targetEntityId: quote._id,
      details: { requestId: requestDoc._id, estimatedCost: quote.estimatedCost },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Quote submitted successfully.',
      quote
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quotes submitted by current Service Provider
// @route   GET /api/v1/quotes/my
// @access  Private (Service Provider)
export const getMyQuotes = async (req, res, next) => {
  try {
    const quotes = await Quote.find({ provider: req.user._id })
      .populate({
        path: 'serviceRequest',
        populate: { path: 'category', select: 'name icon' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quotes.length,
      quotes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all quotes submitted for a specific Service Request
// @route   GET /api/v1/quotes/request/:requestId
// @access  Private (Customer - Request Owner, Ops Manager, Admin)
export const getQuotesForRequest = async (req, res, next) => {
  try {
    const requestDoc = await ServiceRequest.findById(req.params.requestId);
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Service request not found.' });
    }

    const isOwner = requestDoc.customer.toString() === req.user._id.toString();
    const isOpsAdmin = [ROLES.OPS_MANAGER, ROLES.ADMIN].includes(req.user.role);

    if (!isOwner && !isOpsAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this service request.' });
    }

    const quotes = await Quote.find({ serviceRequest: requestDoc._id })
      .populate('provider', 'name email phone avatar rating')
      .sort({ estimatedCost: 1 });

    res.status(200).json({
      success: true,
      count: quotes.length,
      quotes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a Quote -> Creates Booking with 'Requested' status & rejects other quotes
// @route   PATCH /api/v1/quotes/:id/accept
// @access  Private (Customer - Request Owner)
export const acceptQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('serviceRequest');
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found.' });
    }

    const requestDoc = quote.serviceRequest;
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Associated service request not found.' });
    }

    // Ownership Check: Customer must own the service request!
    if (requestDoc.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only accept quotes for your own service requests.'
      });
    }

    if (quote.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Quote cannot be accepted because status is '${quote.status}'.`
      });
    }

    // 1. Mark accepted quote
    quote.status = 'Accepted';
    await quote.save();

    // 2. Reject all other pending quotes for this service request
    await Quote.updateMany(
      { serviceRequest: requestDoc._id, _id: { $ne: quote._id }, status: 'Pending' },
      { $set: { status: 'Rejected' } }
    );

    // 3. Update Service Request status
    requestDoc.status = 'Assigned';
    await requestDoc.save();

    // 4. CREATE BOOKING WITH STANDARDIZED INITIAL STATUS 'Requested'
    const bookingNumber = `BK-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const scheduledDate = requestDoc.preferredSchedule?.date || new Date(Date.now() + 24 * 60 * 60 * 1000);

    const booking = await Booking.create({
      bookingNumber,
      serviceRequest: requestDoc._id,
      quote: quote._id,
      customer: req.user._id,
      provider: quote.provider,
      scheduledDate,
      timeSlot: requestDoc.preferredSchedule?.timeSlot || '10:00 AM - 12:00 PM',
      agreedPrice: quote.estimatedCost,
      status: BOOKING_STATUS.REQUESTED, // 'Requested' as required by Phase 3 & plan
      paymentStatus: PAYMENT_STATUS.PENDING
    });

    // Create Notification for Provider
    await createNotification({
      recipient: quote.provider,
      type: 'BOOKING_UPDATE',
      title: 'Quote Accepted - Booking Requested',
      message: `Customer ${req.user.name} accepted your quote of $${quote.estimatedCost}. Booking ${bookingNumber} created in 'Requested' status.`,
      relatedEntity: { entityType: 'Booking', entityId: booking._id }
    });

    // Create Notification for Customer
    await createNotification({
      recipient: req.user._id,
      type: 'BOOKING_UPDATE',
      title: 'Booking Created',
      message: `Booking ${bookingNumber} successfully created with agreed price $${quote.estimatedCost}.`,
      relatedEntity: { entityType: 'Booking', entityId: booking._id }
    });

    // Log Audit Action
    await logAuditAction({
      actor: req.user._id,
      role: req.user.role,
      action: 'QUOTE_ACCEPTED_BOOKING_CREATED',
      targetEntity: 'Booking',
      targetEntityId: booking._id,
      details: { quoteId: quote._id, bookingNumber, agreedPrice: booking.agreedPrice },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: "Quote accepted successfully. Booking created with status 'Requested'.",
      quote,
      booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel/Withdraw a Quote
// @route   PATCH /api/v1/quotes/:id/cancel
// @access  Private (Service Provider - Quote Owner)
export const cancelQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found.' });
    }

    if (quote.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this quote.' });
    }

    if (quote.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Cannot cancel quote in status '${quote.status}'.` });
    }

    quote.status = 'Expired';
    await quote.save();

    res.status(200).json({
      success: true,
      message: 'Quote cancelled successfully.',
      quote
    });
  } catch (error) {
    next(error);
  }
};
