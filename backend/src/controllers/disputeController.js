import Dispute from '../models/Dispute.js';
import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';

import {
  DISPUTE_STATUS,
  PAYMENT_STATUS,
  ROLES
} from '../config/constants.js';

import { createNotification } from '../services/notificationService.js';
import { logAuditAction } from '../services/auditService.js';

// @desc    Open a Dispute Ticket for a Booking
// @route   POST /api/v1/disputes
// @access  Private (Customer or Provider)
export const createDispute = async (req, res, next) => {
  try {
    const {
      bookingId,
      reason,
      description,
      evidencePhotos
    } = req.body;

    if (!bookingId || !reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'bookingId and dispute reason are required.'
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    const isCustomer =
      booking.customer.toString() ===
      req.user._id.toString();

    const isProvider =
      booking.provider.toString() ===
      req.user._id.toString();

    if (!isCustomer && !isProvider) {
      return res.status(403).json({
        success: false,
        message:
          'Only parties involved in this booking can raise a dispute.'
      });
    }

    const againstUser = isCustomer
      ? booking.provider
      : booking.customer;

    // Check for an existing active dispute
    const existing = await Dispute.findOne({
      booking: bookingId,
      status: {
        $in: [
          DISPUTE_STATUS.OPEN,
          DISPUTE_STATUS.UNDER_REVIEW
        ]
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          'An active dispute is already open for this booking.'
      });
    }

    const dispute = await Dispute.create({
      booking: booking._id,
      raisedBy: req.user._id,
      againstUser,
      reason: reason.trim(),
      description: description
        ? description.trim()
        : '',
      evidencePhotos: evidencePhotos || [],
      status: DISPUTE_STATUS.OPEN
    });

    // Notify the other booking participant
    await createNotification({
      recipient: againstUser,
      type: 'DISPUTE_UPDATE',
      title: 'Dispute Ticket Opened',
      message:
        `A dispute was opened for Booking ${booking.bookingNumber}. ` +
        `Reason: ${reason.trim()}`,
      relatedEntity: {
        entityType: 'Dispute',
        entityId: dispute._id
      }
    });

    // Audit Log
    await logAuditAction({
      actor: req.user._id,
      role: req.user.role,
      action: 'DISPUTE_OPENED',
      targetEntity: 'Dispute',
      targetEntityId: dispute._id,
      details: {
        bookingId,
        reason: reason.trim()
      },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message:
        'Dispute ticket opened successfully. A support agent will review your request.',
      dispute
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Disputes
// @route   GET /api/v1/disputes
// @access  Private
export const getAllDisputes = async (req, res, next) => {
  try {
    const { status } = req.query;

    let filter = {};

    const isStaff = [
      ROLES.SUPPORT_AGENT,
      ROLES.OPS_MANAGER,
      ROLES.ADMIN
    ].includes(req.user.role);

    if (!isStaff) {
      filter.$or = [
        { raisedBy: req.user._id },
        { againstUser: req.user._id }
      ];
    }

    if (status) {
      filter.status = status;
    }

    const disputes = await Dispute.find(filter)
      .populate(
        'booking',
        'bookingNumber scheduledDate agreedPrice status'
      )
      .populate(
        'raisedBy',
        'name email role phone'
      )
      .populate(
        'againstUser',
        'name email role phone'
      )
      .populate(
        'assignedSupportAgent',
        'name email'
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: disputes.length,
      disputes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Dispute Detail by ID
// @route   GET /api/v1/disputes/:id
// @access  Private
export const getDisputeById = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('booking')
      .populate(
        'raisedBy',
        'name email phone avatar'
      )
      .populate(
        'againstUser',
        'name email phone avatar'
      )
      .populate(
        'assignedSupportAgent',
        'name email'
      );

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute ticket not found.'
      });
    }

    const isStaff = [
      ROLES.SUPPORT_AGENT,
      ROLES.OPS_MANAGER,
      ROLES.ADMIN
    ].includes(req.user.role);

    const participantIds = [
      dispute.raisedBy?._id || dispute.raisedBy,
      dispute.againstUser?._id || dispute.againstUser
    ].filter(Boolean);

    const isParticipant = participantIds.some(
      id =>
        id.toString() ===
        req.user._id.toString()
    );

    if (!isStaff && !isParticipant) {
      return res.status(403).json({
        success: false,
        message:
          'You are not authorized to view this dispute.'
      });
    }

    res.status(200).json({
      success: true,
      dispute
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve Dispute / Issue Refund
// @route   PATCH /api/v1/disputes/:id/resolve
// @access  Private (Support Agent, Ops Manager, Platform Admin)
export const resolveDispute = async (req, res, next) => {
  try {
    const {
      status,
      resolutionNotes
    } = req.body;

    /*
     * Only these are valid final dispute states:
     * - Resolved_Refunded
     * - Resolved_Dismissed
     */
    if (
      !status ||
      !Object.values(DISPUTE_STATUS).includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Invalid status. Allowed values: ` +
          `${Object.values(DISPUTE_STATUS).join(', ')}`
      });
    }

    if (
      !resolutionNotes ||
      !resolutionNotes.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Resolution notes are required when updating dispute ticket.'
      });
    }

    const dispute = await Dispute.findById(
      req.params.id
    );

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message:
          'Dispute ticket not found.'
      });
    }

    // Only final resolution statuses are allowed here
    if (
      ![
        DISPUTE_STATUS.RESOLVED_REFUNDED,
        DISPUTE_STATUS.RESOLVED_DISMISSED
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Dispute can only be resolved as Resolved_Refunded or Resolved_Dismissed.'
      });
    }

    // Prevent resolving an already resolved dispute
    if (
      [
        DISPUTE_STATUS.RESOLVED_REFUNDED,
        DISPUTE_STATUS.RESOLVED_DISMISSED
      ].includes(dispute.status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'This dispute has already been resolved.'
      });
    }

    dispute.status = status;
    dispute.resolutionNotes =
      resolutionNotes.trim();

    dispute.assignedSupportAgent =
      req.user._id;

    dispute.resolvedAt = new Date();

    await dispute.save();

    /*
     * Refund handling
     *
     * Refund is processed only when the final
     * dispute status is Resolved_Refunded.
     */
    if (
      status ===
      DISPUTE_STATUS.RESOLVED_REFUNDED
    ) {
      const invoice = await Invoice.findOne({
        booking: dispute.booking
      });

      if (invoice) {
        invoice.status = 'Refunded';
        await invoice.save();
      }

      const booking = await Booking.findById(
        dispute.booking
      );

      if (booking) {
        booking.paymentStatus =
          PAYMENT_STATUS.REFUNDED;

        await booking.save();
      }
    }

    // Notify Customer
    await createNotification({
      recipient: dispute.raisedBy,
      type: 'DISPUTE_UPDATE',
      title: `Dispute ${status}`,
      message:
        `Dispute ticket resolution: ${resolutionNotes.trim()}`,
      relatedEntity: {
        entityType: 'Dispute',
        entityId: dispute._id
      }
    });

    // Notify other booking participant
    await createNotification({
      recipient: dispute.againstUser,
      type: 'DISPUTE_UPDATE',
      title: `Dispute ${status}`,
      message:
        `Dispute ticket resolution: ${resolutionNotes.trim()}`,
      relatedEntity: {
        entityType: 'Dispute',
        entityId: dispute._id
      }
    });

    // Audit Log
    await logAuditAction({
      actor: req.user._id,
      role: req.user.role,
      action:
        `DISPUTE_${status.toUpperCase()}`,
      targetEntity: 'Dispute',
      targetEntityId: dispute._id,
      details: {
        status,
        resolutionNotes:
          resolutionNotes.trim()
      },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message:
        `Dispute ticket resolved as ${status}.`,
      dispute
    });
  } catch (error) {
    next(error);
  }
};