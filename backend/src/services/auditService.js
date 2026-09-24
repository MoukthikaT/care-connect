import AuditLog from '../models/AuditLog.js';

export const logAuditAction = async ({
  actor,
  role,
  action,
  targetEntity = '',
  targetEntityId = '',
  details = {},
  ipAddress = ''
}) => {
  try {
    const log = await AuditLog.create({
      actor,
      role,
      action,
      targetEntity,
      targetEntityId,
      details,
      ipAddress
    });
    return log;
  } catch (error) {
    console.error('[AuditLog Error] Failed to record audit log:', error.message);
    return null;
  }
};
