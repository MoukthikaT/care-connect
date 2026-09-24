export const ROLES = {
  ADMIN: 'Platform Admin',
  OPS_MANAGER: 'Operations Manager',
  SERVICE_PROVIDER: 'Service Provider',
  CUSTOMER: 'Customer',
  SUPPORT_AGENT: 'Support Agent'
};

export const ALL_ROLES = Object.values(ROLES);

// Only Customer and Service Provider can self-register.
export const PUBLIC_REGISTER_ROLES = [
  ROLES.CUSTOMER,
  ROLES.SERVICE_PROVIDER
];

export const BOOKING_STATUS = {
  REQUESTED: 'Requested',
  CONFIRMED: 'Confirmed',
  PROVIDER_IN_TRANSIT: 'Provider_In_Transit',
  CHECKED_IN: 'Checked_In',
  WORK_IN_PROGRESS: 'Work_In_Progress',
  WORK_COMPLETED: 'Work_Completed',
  CUSTOMER_SIGNED_OFF: 'Customer_Signed_Off',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed'
};

export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  SIMULATED_PAID: 'Simulated_Paid',
  REFUNDED: 'Refunded',
  ESCROW_HELD: 'Escrow_Held'
};

export const DISPUTE_STATUS = {
  OPEN: 'Open',
  UNDER_REVIEW: 'Under_Review',
  RESOLVED_REFUNDED: 'Resolved_Refunded',
  RESOLVED_DISMISSED: 'Resolved_Dismissed'
};