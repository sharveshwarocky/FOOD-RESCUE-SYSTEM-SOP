import React, { useState, useEffect } from 'react';
import LiveMap from '../../components/LiveMap';
import { adminService } from '../../services/adminService';
import Loading from '../../components/Loading';

const NGOTracking = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getLiveTracking()
      .then(res => {
        if (res.success) setVolunteers(res.volunteers);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Loading Volunteer Live Map Tracking..." />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Volunteer Live GPS Tracking</h2>
        <p className="text-xs text-slate-500 mt-0.5">Track live pickup & delivery location of assigned volunteers</p>
      </div>

      <LiveMap volunteers={volunteers} />

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-800 text-sm">Assigned Volunteer Contact Details</h3>
        {volunteers.map((v, idx) => (
          <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-800">{v.full_name}</p>
              <p className="text-slate-500">Vehicle: {v.vehicle_type || 'Bike'}</p>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                Phone: {v.phone || '+91 9876543213'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NGOTracking;
