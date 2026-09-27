import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LiveMap from '../../components/LiveMap';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { MapPin, RefreshCw } from 'lucide-react';

const AdminLiveTracking = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [donors, setDonors] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const [volRes, donorRes, ngoRes] = await Promise.all([
        adminService.getLiveTracking(),
        adminService.getDonors(),
        adminService.getNGOs()
      ]);
      if (volRes.success) setVolunteers(volRes.volunteers);
      if (donorRes.success) setDonors(donorRes.donors);
      if (ngoRes.success) setNgos(ngoRes.ngos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Loading text="Initializing GPS Live Map..." />;
  if (error) return <ErrorMessage message={error} retry={fetchTracking} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Volunteer Live Map Tracking</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time GPS coordinates stream from HTML5 Geolocation API</p>
        </div>
        <button
          onClick={fetchTracking}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Coordinates
        </button>
      </div>

      <LiveMap volunteers={volunteers} donors={donors} ngos={ngos} />

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-3">Active Tracking Feed</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {volunteers.map((v, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{v.full_name}</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{v.vehicle_type || 'Bike'}</span>
              </div>
              <p className="text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" /> Lat: {v.latitude?.toFixed(4)}, Lng: {v.longitude?.toFixed(4)}
              </p>
              <p className="text-[10px] text-slate-400">
                Last ping: {v.timestamp ? new Date(v.timestamp).toLocaleTimeString() : 'Static location'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminLiveTracking;
