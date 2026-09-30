import React from 'react';

const StatusBadge = ({ status }) => {
  const getStyle = (st) => {
    switch (st?.toUpperCase()) {
      case 'PENDING':
      case 'PENDING_ADMIN_APPROVAL':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'APPROVED':
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
      case 'NGO_ACCEPTED':
      case 'DONOR_ACCEPTED':
        return 'bg-cyan-50 text-cyan-800 border-cyan-300 font-bold';
      case 'NGO_REQUESTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'VOLUNTEER_ASSIGNED':
      case 'ASSIGNED':
      case 'ACCEPTED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold';
      case 'PICKED_UP':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'OUT_FOR_DELIVERY':
        return 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse';
      case 'DELIVERED':
        return 'bg-teal-50 text-teal-800 border-teal-300';
      case 'COMPLETED':
      case 'SUCCESS':
        return 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold';
      case 'REJECTED':
      case 'DEACTIVATED':
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getDisplayText = (st) => {
    switch (st?.toUpperCase()) {
      case 'APPROVED':
      case 'AVAILABLE':
        return 'DONATION AVAILABLE';
      case 'NGO_ACCEPTED':
        return 'NGO ACCEPTED';
      case 'VOLUNTEER_ASSIGNED':
        return 'VOLUNTEER ASSIGNED';
      case 'COMPLETED':
        return 'COMPLETED (BENEFICIARIES FED)';
      default:
        return st?.replace(/_/g, ' ');
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyle(status)}`}>
      {getDisplayText(status)}
    </span>
  );
};

export default StatusBadge;
