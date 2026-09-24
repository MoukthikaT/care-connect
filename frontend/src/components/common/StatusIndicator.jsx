import React from 'react';

export const StatusIndicator = ({ status, variant = 'pill' }) => {
  let pillClass = 'pill-open';
  let displayLabel = status;

  switch (status) {
    case 'Open':
      pillClass = 'pill-open';
      displayLabel = '● Open Request';
      break;
    case 'Quoted':
      pillClass = 'pill-quoted';
      displayLabel = '✦ Quoted by Pro';
      break;
    case 'Assigned':
      pillClass = 'pill-assigned';
      displayLabel = '● Confirmed & Booked';
      break;
    case 'In_Progress':
    case 'Work_In_Progress':
      pillClass = 'pill-assigned';
      displayLabel = '● Work in progress';
      break;
    case 'Fulfilled':
    case 'Work_Completed':
    case 'Completed':
    case 'Verified':
      pillClass = 'pill-fulfilled';
      displayLabel = '● Service completed';
      break;
    case 'Cancelled':
    case 'Rejected':
      pillClass = 'pill-cancelled';
      displayLabel = '● Cancelled';
      break;
    case 'Disputed':
    case 'Raised':
      pillClass = 'pill-disputed';
      displayLabel = '● Action needed / Disputed';
      break;
    default:
      pillClass = 'pill-open';
      displayLabel = `● ${status}`;
  }

  return (
    <span className={`pill-badge ${pillClass}`}>
      {displayLabel}
    </span>
  );
};

export default StatusIndicator;
