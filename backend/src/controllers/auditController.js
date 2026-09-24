import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import ServiceRequest from '../models/ServiceRequest.js';
import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';
import Dispute from '../models/Dispute.js';
import { ROLES } from '../config/constants.js';

// @desc    Get Audit Logs (Admin / Ops view)
// @route   GET /api/v1/audit/logs
// @access  Private (Platform Admin, Operations Manager)
export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, role, limit = 100 } = req.query;
    let filter = {};

    if (action) filter.action = new RegExp(action, 'i');
    if (role) filter.role = role;

    const logs = await AuditLog.find(filter)
      .populate('actor', 'name email role')
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Operations & Admin Analytics Dashboard Stats
// @route   GET /api/v1/audit/analytics
// @access  Private (Platform Admin, Operations Manager, Support Agent)
export const getAnalyticsStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const customersCount = await User.countDocuments({ role: ROLES.CUSTOMER });
    const providersCount = await User.countDocuments({ role: ROLES.SERVICE_PROVIDER });
    const opsCount = await User.countDocuments({ role: ROLES.OPS_MANAGER });
    const supportCount = await User.countDocuments({ role: ROLES.SUPPORT_AGENT });
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN });

    const verifiedProviders = await ProviderProfile.countDocuments({ verificationStatus: 'Verified' });
    const pendingVerifications = await ProviderProfile.countDocuments({ verificationStatus: 'Pending' });

    const totalRequests = await ServiceRequest.countDocuments();
    const openRequests = await ServiceRequest.countDocuments({ status: 'Open' });
    const quotedRequests = await ServiceRequest.countDocuments({ status: 'Quoted' });
    const completedRequests = await ServiceRequest.countDocuments({ status: 'Completed' });

    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({ status: { $in: ['Requested', 'Accepted', 'In_Progress'] } });
    const fulfilledBookings = await Booking.countDocuments({ status: 'Fulfilled' });

    // Revenue calculation from paid invoices
    const paidInvoices = await Invoice.find({ status: 'Simulated_Paid' });
    const totalGMV = paidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const platformFees = paidInvoices.reduce((sum, inv) => sum + (inv.platformFee || 0), 0);

    const openDisputes = await Dispute.countDocuments({ status: 'Open' });
    const resolvedDisputes = await Dispute.countDocuments({ status: { $in: ['Resolved', 'Refunded'] } });

    res.status(200).json({
      success: true,
      analytics: {
        users: {
          total: totalUsers,
          customers: customersCount,
          providers: providersCount,
          ops: opsCount,
          support: supportCount,
          admin: adminCount
        },
        providers: {
          verified: verifiedProviders,
          pending: pendingVerifications
        },
        requests: {
          total: totalRequests,
          open: openRequests,
          quoted: quotedRequests,
          completed: completedRequests
        },
        bookings: {
          total: totalBookings,
          active: activeBookings,
          fulfilled: fulfilledBookings
        },
        financials: {
          totalGMV: Math.round(totalGMV * 100) / 100,
          platformFees: Math.round(platformFees * 100) / 100,
          paidInvoicesCount: paidInvoices.length
        },
        disputes: {
          open: openDisputes,
          resolved: resolvedDisputes
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
