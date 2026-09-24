import React from 'react';
import LiveMap from '../../components/LiveMap';

const DonorTracking = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Active Pickup Tracking</h2>
        <p className="text-xs text-slate-500 mt-0.5">Track volunteer arrival and pickup status in real-time</p>
      </div>

      <LiveMap />
    </div>
  );
};

export default DonorTracking;
