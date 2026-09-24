import Notification from '../models/Notification.js';

export const createNotification = async ({
  recipient,
  type = 'SYSTEM_ALERT',
  title,
  message,
  relatedEntity = null
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedEntity
    });
    return notification;
  } catch (error) {
    console.error('[Notification Error] Failed to create notification:', error.message);
    return null;
  }
};
