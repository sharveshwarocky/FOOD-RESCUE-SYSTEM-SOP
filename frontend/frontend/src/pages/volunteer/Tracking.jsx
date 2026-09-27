import React from 'react';
import LiveMap from '../../components/LiveMap';
import { useGeolocation } from '../../hooks/useGeolocation';
import { Navigation } from 'lucide-react';

const VolunteerTracking = () => {
  const { location, error } = useGeolocation(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Live GPS Broadcast & Map</h2>
          <p className="text-xs text-slate-500 mt-0.5">Streaming your location periodically to Flask API (`/api/volunteer/location`)</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-800">
          <Navigation className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Active GPS: {location.latitude ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Detecting...'}</span>
        </div>
      </div>

      <LiveMap />
    </div>
  );
};

export default VolunteerTracking;
