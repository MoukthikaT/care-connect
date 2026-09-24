import Booking from '../models/Booking.js';
import ServiceRequest from '../models/ServiceRequest.js';

import { createNotification } from '../services/notificationService.js';
import { logAuditAction } from '../services/auditService.js';

import {
  BOOKING_STATUS,
  ROLES
} from '../config/constants.js';

/**
 * Check whether a provider already has an active booking
 * for the same date and time slot.
 */
export const hasOverlappingBooking = async (
  providerId,
  scheduledDate,
  timeSlot,
  excludeBookingId = null
) => {
  const targetDate = new Date(scheduledDate);

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const query = {
    provider: providerId,
    scheduledDate: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    timeSlot,
    status: {
      $in: [
        BOOKING_STATUS.REQUESTED,
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.PROVIDER_IN_TRANSIT,
        BOOKING_STATUS.CHECKED_IN,
        BOOKING_STATUS.WORK_IN_PROGRESS
      ]
    }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const existing = await Booking.findOne(query);

  return !!existing;
};


/**
 * @desc    Get bookings for current logged-in user
 * @route   GET /api/v1/bookings
 * @access  Private
 */
export const getMyBookings = async (req, res, next) => {
  try {
    const { role, _id: userId } = req.user;

    let query = {};

    if (role === ROLES.CUSTOMER) {
      query.customer = userId;
    }

    else if (role === ROLES.SERVICE_PROVIDER) {
      query.provider = userId;
    }

    else if (
      [
        ROLES.OPS_MANAGER,
        ROLES.ADMIN,
        ROLES.SUPPORT_AGENT
      ].includes(role)
    ) {
      if (req.query.status) {
        query.status = req.query.status;
      }

      if (req.query.customer) {
        query.customer = req.query.customer;
      }

      if (req.query.provider) {
        query.provider = req.query.provider;
      }
    }

    const bookings = await Booking.find(query)
      .populate({
        path: 'serviceRequest',
        populate: {
          path: 'category',
          select: 'name icon'
        }
      })
      .populate(
        'customer',
        'name email phone avatar'
      )
      .populate(
        'provider',
        'name email phone avatar'
      )
      .populate(
        'quote',
        'estimatedCost breakdown notes'
      )
      .sort({
        scheduledDate: -1,
        createdAt: -1
      });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });

  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Get single booking by ID
 * @route   GET /api/v1/bookings/:id
 * @access  Private
 */
export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'serviceRequest',
        populate: {
          path: 'category',
          select: 'name icon description'
        }
      })
      .populate(
        'customer',
        'name email phone avatar'
      )
      .populate(
        'provider',
        'name email phone avatar'
      )
      .populate('quote');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    // Customer ownership check
    const isCustomer =
      req.user.role === ROLES.CUSTOMER &&
      booking.customer._id.toString() ===
        req.user._id.toString();

    // Provider ownership check
    const isProvider =
      req.user.role === ROLES.SERVICE_PROVIDER &&
      booking.provider._id.toString() ===
        req.user._id.toString();

    // Staff access
    const isStaff = [
      ROLES.OPS_MANAGER,
      ROLES.ADMIN,
      ROLES.SUPPORT_AGENT
    ].includes(req.user.role);

    if (!isCustomer && !isProvider && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this booking.'
      });
    }

    res.status(200).json({
      success: true,
      booking
    });

  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Update booking status
 * @route   PATCH /api/v1/bookings/:id/status
 * @access  Private
 */
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // Validate requested status
    if (
      !status ||
      !Object.values(BOOKING_STATUS).includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid booking status. Allowed values: ${Object.values(
          BOOKING_STATUS
        ).join(', ')}`
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('serviceRequest')
      .populate(
        'customer',
        'name email'
      )
      .populate(
        'provider',
        'name email'
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    const isCustomer =
      req.user.role === ROLES.CUSTOMER &&
      booking.customer._id.toString() ===
        req.user._id.toString();

    const isProvider =
      req.user.role === ROLES.SERVICE_PROVIDER &&
      booking.provider._id.toString() ===
        req.user._id.toString();

    const isStaff = [
      ROLES.OPS_MANAGER,
      ROLES.ADMIN
    ].includes(req.user.role);

    if (!isCustomer && !isProvider && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to modify booking status.'
      });
    }

    const currentStatus = booking.status;


    // --------------------------------------------------
    // CUSTOMER PERMISSIONS
    // --------------------------------------------------

    if (
      isCustomer &&
      status !== BOOKING_STATUS.CUSTOMER_SIGNED_OFF
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Customers can only confirm/sign off a completed service.'
      });
    }


    // --------------------------------------------------
    // PROVIDER PERMISSIONS
    // --------------------------------------------------

    if (
      isProvider &&
      ![
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.PROVIDER_IN_TRANSIT,
        BOOKING_STATUS.CHECKED_IN,
        BOOKING_STATUS.WORK_IN_PROGRESS,
        BOOKING_STATUS.WORK_COMPLETED,
        BOOKING_STATUS.CANCELLED
      ].includes(status)
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Providers are not allowed to set this booking status.'
      });
    }


    // --------------------------------------------------
    // DOUBLE BOOKING CHECK
    // --------------------------------------------------

    if (status === BOOKING_STATUS.CONFIRMED) {

      if (!isProvider && !isStaff) {
        return res.status(403).json({
          success: false,
          message:
            'Only the assigned provider or authorized staff can confirm the booking.'
        });
      }

      const isOverlapping =
        await hasOverlappingBooking(
          booking.provider._id,
          booking.scheduledDate,
          booking.timeSlot,
          booking._id
        );

      if (isOverlapping) {
        return res.status(400).json({
          success: false,
          message:
            `Booking Conflict: You already have another active booking scheduled for ${new Date(
              booking.scheduledDate
            ).toLocaleDateString()} during time slot '${booking.timeSlot}'.`
        });
      }
    }


    // --------------------------------------------------
    // VALID BOOKING LIFECYCLE
    // --------------------------------------------------

    const validTransitions = {

      [BOOKING_STATUS.REQUESTED]: [
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.CANCELLED
      ],

      [BOOKING_STATUS.CONFIRMED]: [
        BOOKING_STATUS.PROVIDER_IN_TRANSIT,
        BOOKING_STATUS.CANCELLED
      ],

      [BOOKING_STATUS.PROVIDER_IN_TRANSIT]: [
        BOOKING_STATUS.CHECKED_IN,
        BOOKING_STATUS.CANCELLED
      ],

      [BOOKING_STATUS.CHECKED_IN]: [
        BOOKING_STATUS.WORK_IN_PROGRESS,
        BOOKING_STATUS.CANCELLED
      ],

      [BOOKING_STATUS.WORK_IN_PROGRESS]: [
        BOOKING_STATUS.WORK_COMPLETED,
        BOOKING_STATUS.CANCELLED
      ],

      [BOOKING_STATUS.WORK_COMPLETED]: [
        BOOKING_STATUS.CUSTOMER_SIGNED_OFF,
        BOOKING_STATUS.DISPUTED
      ],

      [BOOKING_STATUS.CUSTOMER_SIGNED_OFF]: [
        BOOKING_STATUS.CLOSED,
        BOOKING_STATUS.DISPUTED
      ],

      [BOOKING_STATUS.CLOSED]: [],

      [BOOKING_STATUS.CANCELLED]: [],

      [BOOKING_STATUS.DISPUTED]: [
        BOOKING_STATUS.CLOSED
      ]
    };


    // Validate transition
    if (
      !validTransitions[currentStatus]?.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Invalid status transition from '${currentStatus}' to '${status}'.`
      });
    }


    // --------------------------------------------------
    // UPDATE BOOKING
    // --------------------------------------------------

    booking.status = status;

    await booking.save();


    // --------------------------------------------------
    // UPDATE SERVICE REQUEST
    // --------------------------------------------------

    if (booking.serviceRequest) {

      const requestDoc =
        await ServiceRequest.findById(
          booking.serviceRequest._id ||
          booking.serviceRequest
        );

      if (requestDoc) {

        if (
          status === BOOKING_STATUS.PROVIDER_IN_TRANSIT ||
          status === BOOKING_STATUS.CHECKED_IN ||
          status === BOOKING_STATUS.WORK_IN_PROGRESS
        ) {
          requestDoc.status = 'In_Progress';
        }

        else if (
          status === BOOKING_STATUS.WORK_COMPLETED ||
          status === BOOKING_STATUS.CUSTOMER_SIGNED_OFF ||
          status === BOOKING_STATUS.CLOSED
        ) {
          requestDoc.status = 'Completed';
        }

        else if (
          status === BOOKING_STATUS.CANCELLED
        ) {
          requestDoc.status = 'Cancelled';
        }

        await requestDoc.save();
      }
    }


    // --------------------------------------------------
    // NOTIFICATION
    // --------------------------------------------------

    let recipient = null;

    if (isProvider) {
      recipient = booking.customer._id;
    }

    else if (isCustomer) {
      recipient = booking.provider._id;
    }

    else if (isStaff) {
      // Staff updates should notify both participants.
      await createNotification({
        recipient: booking.customer._id,
        type: 'BOOKING_UPDATE',
        title: `Booking Status: ${status}`,
        message:
          `Booking ${booking.bookingNumber} status was updated to '${status}'.`,
        relatedEntity: {
          entityType: 'Booking',
          entityId: booking._id
        }
      });

      await createNotification({
        recipient: booking.provider._id,
        type: 'BOOKING_UPDATE',
        title: `Booking Status: ${status}`,
        message:
          `Booking ${booking.bookingNumber} status was updated to '${status}'.`,
        relatedEntity: {
          entityType: 'Booking',
          entityId: booking._id
        }
      });
    }

    if (recipient) {
      await createNotification({
        recipient,
        type: 'BOOKING_UPDATE',
        title: `Booking Status: ${status}`,
        message:
          `Booking ${booking.bookingNumber} status was updated to '${status}'.`,
        relatedEntity: {
          entityType: 'Booking',
          entityId: booking._id
        }
      });
    }


    // --------------------------------------------------
    // AUDIT LOG
    // --------------------------------------------------

    await logAuditAction({
      actor: req.user._id,
      role: req.user.role,
      action:
        `BOOKING_STATUS_${status.toUpperCase()}`,
      targetEntity: 'Booking',
      targetEntityId: booking._id,
      details: {
        fromStatus: currentStatus,
        toStatus: status
      },
      ipAddress: req.ip
    });


    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    res.status(200).json({
      success: true,
      message:
        `Booking status updated to ${status}.`,
      booking
    });

  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Check booking conflicts for a provider
 * @route   POST /api/v1/bookings/check-conflict
 * @access  Private (Provider / Ops / Admin)
 */
export const checkConflict = async (req, res, next) => {
  try {

    const {
      providerId,
      scheduledDate,
      timeSlot
    } = req.body;


    const pId =
      req.user.role === ROLES.SERVICE_PROVIDER
        ? req.user._id
        : (providerId || req.user._id);


    // Providers can only check their own schedule
    if (
      req.user.role === ROLES.SERVICE_PROVIDER &&
      providerId &&
      providerId.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Providers can only check conflicts for their own schedule.'
      });
    }


    if (!scheduledDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message:
          'scheduledDate and timeSlot are required.'
      });
    }


    const isConflict =
      await hasOverlappingBooking(
        pId,
        scheduledDate,
        timeSlot
      );


    res.status(200).json({
      success: true,
      isConflict,
      message:
        isConflict
          ? 'Time slot has an overlapping active booking.'
          : 'Time slot is available.'
    });

  } catch (error) {
    next(error);
  }
};