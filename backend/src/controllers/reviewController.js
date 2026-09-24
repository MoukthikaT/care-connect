import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import ProviderProfile from '../models/ProviderProfile.js';
import User from '../models/User.js';

import { logAuditAction } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';

import {
  ROLES,
  BOOKING_STATUS
} from '../config/constants.js';

// @desc    Submit a Review for a Closed Booking
// @route   POST /api/v1/reviews
// @access  Private (Customer)
export const createReview = async (req, res, next) => {
  try {
    const {
      bookingId,
      rating,
      punctualityRating,
      qualityRating,
      comment
    } = req.body;

    // Validate rating
    if (
      !bookingId ||
      rating === undefined ||
      rating === null ||
      Number(rating) < 1 ||
      Number(rating) > 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          'bookingId and a valid rating (1-5) are required.'
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    // Customer ownership check
    if (
      booking.customer.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Access denied. You can only review your own bookings.'
      });
    }

    // Review is allowed only after complete closure
    if (booking.status !== BOOKING_STATUS.CLOSED) {
      return res.status(400).json({
        success: false,
        message:
          'A review can only be submitted after the booking is closed.'
      });
    }

    // Prevent duplicate reviews
    const existing = await Review.findOne({
      booking: bookingId
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          'You have already submitted a review for this booking.'
      });
    }

    // Validate optional ratings
    if (
      punctualityRating !== undefined &&
      punctualityRating !== null &&
      (
        Number(punctualityRating) < 1 ||
        Number(punctualityRating) > 5
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Punctuality rating must be between 1 and 5.'
      });
    }

    if (
      qualityRating !== undefined &&
      qualityRating !== null &&
      (
        Number(qualityRating) < 1 ||
        Number(qualityRating) > 5
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Quality rating must be between 1 and 5.'
      });
    }

    const review = await Review.create({
      booking: booking._id,
      customer: req.user._id,
      provider: booking.provider,
      rating: Number(rating),

      punctualityRating:
        punctualityRating !== undefined &&
        punctualityRating !== null
          ? Number(punctualityRating)
          : Number(rating),

      qualityRating:
        qualityRating !== undefined &&
        qualityRating !== null
          ? Number(qualityRating)
          : Number(rating),

      comment:
        comment
          ? comment.trim()
          : ''
    });

    // Recalculate provider aggregate rating
    const allProviderReviews =
      await Review.find({
        provider: booking.provider
      });

    const totalRatingSum =
      allProviderReviews.reduce(
        (sum, r) => sum + r.rating,
        0
      );

    const avgRating =
      allProviderReviews.length > 0
        ? Math.round(
            (totalRatingSum /
              allProviderReviews.length) *
              10
          ) / 10
        : 0;

    await ProviderProfile.findOneAndUpdate(
  { user: booking.provider },
  {
    'rating.average': avgRating,
    'rating.count': allProviderReviews.length
  }
);

    await User.findByIdAndUpdate(
      booking.provider,
      {
        rating: avgRating
      }
    );

    // Notify provider
    await createNotification({
      recipient: booking.provider,
      type: 'SYSTEM_ALERT',
      title: 'New Review Received',
      message:
        `Customer left a ${Number(rating)}-star review for Booking ${booking.bookingNumber}.`,
      relatedEntity: {
        entityType: 'Booking',
        entityId: booking._id
      }
    });

    // Audit log
    await logAuditAction({
      actor: req.user._id,
      role: req.user.role,
      action: 'REVIEW_SUBMITTED',
      targetEntity: 'Review',
      targetEntityId: review._id,
      details: {
        rating: Number(rating),
        providerId: booking.provider
      },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message:
        'Review submitted successfully.',
      review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Reviews for a Provider Profile
// @route   GET /api/v1/reviews/provider/:providerId
// @access  Public / Authenticated
export const getReviewsForProvider = async (
  req,
  res,
  next
) => {
  try {
    const reviews = await Review.find({
      provider: req.params.providerId
    })
      .populate(
        'customer',
        'name avatar'
      )
      .populate(
        'booking',
        'bookingNumber scheduledDate'
      )
      .sort({
        createdAt: -1
      });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Provider Reply to a Review
// @route   PATCH /api/v1/reviews/:id/reply
// @access  Private (Provider)
export const replyToReview = async (
  req,
  res,
  next
) => {
  try {
    const { providerReply } = req.body;

    if (
      !providerReply ||
      !providerReply.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Reply text is required.'
      });
    }

    const review = await Review.findById(
      req.params.id
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.'
      });
    }

    // Provider ownership check
    if (
      review.provider.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Access denied. You can only reply to reviews on your profile.'
      });
    }

    review.providerReply =
      providerReply.trim();

    await review.save();

    // Notify customer about provider reply
    await createNotification({
      recipient: review.customer,
      type: 'SYSTEM_ALERT',
      title: 'Provider Replied to Your Review',
      message:
        'The service provider has replied to your review.',
      relatedEntity: {
        entityType: 'Review',
        entityId: review._id
      }
    });

    // Audit log
    await logAuditAction({
      actor: req.user._id,
      role: req.user.role,
      action: 'REVIEW_REPLY_POSTED',
      targetEntity: 'Review',
      targetEntityId: review._id,
      details: {
        providerId: review.provider
      },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message:
        'Reply posted successfully.',
      review
    });
  } catch (error) {
    next(error);
  }
};