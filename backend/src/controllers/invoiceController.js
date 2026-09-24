import Invoice from '../models/Invoice.js';
import Booking from '../models/Booking.js';
import { PAYMENT_STATUS, ROLES } from '../config/constants.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditAction } from '../services/auditService.js';


// @desc    Generate Invoice for a Booking
// @route   POST /api/v1/invoices
// @access  Private (Provider, Ops, Admin)
export const createInvoice = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'bookingId is required.'
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate('serviceRequest');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    // Provider can only create invoice for their own booking.
    if (
      req.user.role === ROLES.SERVICE_PROVIDER &&
      booking.provider.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You can only create invoices for your assigned bookings.'
      });
    }

    // Check if invoice already exists.
    const existing = await Invoice.findOne({
      booking: bookingId
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Invoice already exists for this booking.',
        invoice: existing
      });
    }

    const subtotal = Number(booking.agreedPrice) || 50;

    const platformFee =
      Math.round(subtotal * 0.10 * 100) / 100;

    const tax =
      Math.round(subtotal * 0.05 * 100) / 100;

    const totalAmount =
      Math.round(
        (subtotal + platformFee + tax) * 100
      ) / 100;

    const invoiceNumber =
      `INV-${Date.now().toString().slice(-6)}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

    const lineItems = [
      {
        description:
          `Service Fulfillment - ${
            booking.serviceRequest?.title ||
            'CareConnect Service'
          }`,
        quantity: 1,
        unitPrice: subtotal,
        total: subtotal
      }
    ];

    const invoice = await Invoice.create({
      invoiceNumber,
      booking: booking._id,
      customer: booking.customer,
      provider: booking.provider,
      lineItems,
      subtotal,
      platformFee,
      tax,
      totalAmount,
      status: 'Issued'
    });

    // Notify customer.
    await createNotification({
      recipient: booking.customer,
      type: 'PAYMENT_RECEIPT',
      title: 'Invoice Issued',
      message:
        `Invoice ${invoiceNumber} for $${totalAmount} has been generated for Booking ${booking.bookingNumber}.`,
      relatedEntity: {
        entityType: 'Invoice',
        entityId: invoice._id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully.',
      invoice
    });

  } catch (error) {
    next(error);
  }
};


// @desc    Get Invoice for a Booking
// @route   GET /api/v1/invoices/booking/:bookingId
// @access  Private
export const getInvoiceByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    const isParticipant = [
      booking.customer,
      booking.provider
    ].some(
      id =>
        id.toString() === req.user._id.toString()
    );

    const isStaff = [
      ROLES.OPS_MANAGER,
      ROLES.ADMIN,
      ROLES.SUPPORT_AGENT
    ].includes(req.user.role);

    if (!isParticipant && !isStaff) {
      return res.status(403).json({
        success: false,
        message:
          'You are not authorized to view this invoice.'
      });
    }

    let invoice = await Invoice.findOne({
      booking: bookingId
    })
      .populate(
        'customer',
        'name email phone'
      )
      .populate(
        'provider',
        'name email phone'
      );

    // Generate invoice if it does not exist.
    if (!invoice) {
      const subtotal =
        Number(booking.agreedPrice) || 50;

      const platformFee =
        Math.round(subtotal * 0.10 * 100) / 100;

      const tax =
        Math.round(subtotal * 0.05 * 100) / 100;

      const totalAmount =
        Math.round(
          (subtotal + platformFee + tax) * 100
        ) / 100;

      const invoiceNumber =
        `INV-${Date.now().toString().slice(-6)}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;

      invoice = await Invoice.create({
        invoiceNumber,
        booking: booking._id,
        customer: booking.customer,
        provider: booking.provider,
        lineItems: [
          {
            description: 'Home Service Fee',
            quantity: 1,
            unitPrice: subtotal,
            total: subtotal
          }
        ],
        subtotal,
        platformFee,
        tax,
        totalAmount,
        status: 'Issued'
      });

      invoice = await invoice.populate(
        'customer provider'
      );
    }

    res.status(200).json({
      success: true,
      invoice
    });

  } catch (error) {
    next(error);
  }
};


// @desc    Get my invoices
// @route   GET /api/v1/invoices/my
// @access  Private
export const getMyInvoices = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === ROLES.CUSTOMER) {
      query.customer = req.user._id;
    }

    else if (
      req.user.role === ROLES.SERVICE_PROVIDER
    ) {
      query.provider = req.user._id;
    }

    else if (
      [
        ROLES.OPS_MANAGER,
        ROLES.ADMIN,
        ROLES.SUPPORT_AGENT
      ].includes(req.user.role)
    ) {
      // Staff can view all invoices.
    }

    const invoices = await Invoice.find(query)
      .populate(
        'customer',
        'name email'
      )
      .populate(
        'provider',
        'name email'
      )
      .populate(
        'booking',
        'bookingNumber scheduledDate status'
      )
      .sort({
        createdAt: -1
      });

    res.status(200).json({
      success: true,
      count: invoices.length,
      invoices
    });

  } catch (error) {
    next(error);
  }
};


// @desc    Pay Invoice (Simulated Payment)
// @route   POST /api/v1/invoices/:id/pay
// @access  Private (Customer)
export const payInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(
      req.params.id
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found.'
      });
    }

    // Ownership check.
    if (
      req.user.role === ROLES.CUSTOMER &&
      invoice.customer.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Access denied. You can only pay your own invoices.'
      });
    }

    // Already paid.
    if (
      invoice.status === 'Simulated_Paid'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already paid.'
      });
    }

    // Mark invoice as paid.
    invoice.status = 'Simulated_Paid';
    invoice.paidAt = new Date();

    await invoice.save();


    // Update associated booking payment status.
    const booking = await Booking.findById(
      invoice.booking
    );

    if (booking) {
      booking.paymentStatus =
        PAYMENT_STATUS.SIMULATED_PAID;

      await booking.save();
    }


    // Notify customer.
    await createNotification({
      recipient: invoice.customer,
      type: 'PAYMENT_RECEIPT',
      title: 'Payment Successful',
      message:
        `Payment of $${invoice.totalAmount} for Invoice ${invoice.invoiceNumber} was successfully processed.`,
      relatedEntity: {
        entityType: 'Invoice',
        entityId: invoice._id
      }
    });


    // Notify provider.
    await createNotification({
      recipient: invoice.provider,
      type: 'PAYMENT_RECEIPT',
      title: 'Payment Received',
      message:
        `Customer paid $${invoice.totalAmount} for Invoice ${invoice.invoiceNumber}.`,
      relatedEntity: {
        entityType: 'Invoice',
        entityId: invoice._id
      }
    });


    // Audit log.
    await logAuditAction({
      actor: req.user._id,
      role: req.user.role,
      action: 'INVOICE_PAID',
      targetEntity: 'Invoice',
      targetEntityId: invoice._id,
      details: {
        totalAmount: invoice.totalAmount,
        invoiceNumber: invoice.invoiceNumber
      },
      ipAddress: req.ip
    });


    res.status(200).json({
      success: true,
      message:
        `Payment of $${invoice.totalAmount} processed successfully.`,
      invoice
    });

  } catch (error) {
    next(error);
  }
};