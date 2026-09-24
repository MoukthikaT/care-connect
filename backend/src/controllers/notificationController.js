import Notification from '../models/Notification.js';

// @desc    Get user notifications
// @route   GET /api/v1/notifications
// @access  Private (Authenticated)
export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark Notification(s) as Read
// @route   PATCH /api/v1/notifications/mark-read
// @access  Private (Authenticated)
export const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.body;

    if (notificationId) {
      await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: req.user._id },
        { isRead: true, readAt: new Date() }
      );
    } else {
      // Mark all as read
      await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );
    }

    res.status(200).json({ success: true, message: 'Notification(s) marked as read.' });
  } catch (error) {
    next(error);
  }
};
