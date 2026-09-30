import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import Button from './Button';

const LocationPicker = ({ address, setAddress, latitude, setLatitude, longitude, setLongitude }) => {
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          if (!address) {
            setAddress(`GPS Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`);
          }
        },
        (err) => alert('Geolocation error: ' + err.message)
      );
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Pickup Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 123 Main Street, Sector 18, City Center"
          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
          required
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" icon={Navigation} onClick={getCurrentLocation}>
          Use Current GPS Location
        </Button>
        <div className="text-xs text-slate-500 font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Lat: {latitude ? latitude.toFixed(4) : '28.6139'}, Lng: {longitude ? longitude.toFixed(4) : '77.2090'}</span>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
