import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { calculateDistanceKm, formatDistance } from '../utils/distance';
import { Navigation, Crosshair, RefreshCw, Layers, Phone, MapPin, Truck, Building2, HeartHandshake, Eye } from 'lucide-react';

// Custom HTML DivIcons with inline SVGs for 100% reliable rendering without CDN dependencies
const createCustomIcon = (type, label = '', isActive = false) => {
  let bgClass = 'bg-blue-600';
  let borderClass = 'border-blue-200';
  let shadowClass = 'shadow-blue-500/50';
  let iconSvg = '';
  let pulseHtml = '';

  if (type === 'volunteer') {
    bgClass = isActive ? 'bg-blue-600 ring-4 ring-blue-300' : 'bg-indigo-600';
    borderClass = 'border-white';
    shadowClass = 'shadow-indigo-500/50';
    // Truck SVG
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18.5" r="2.5"/><circle cx="7" cy="18.5" r="2.5"/></svg>`;
    if (isActive) {
      pulseHtml = `<span class="absolute -inset-2 rounded-full bg-blue-400 opacity-60 animate-ping"></span>`;
    }
  } else if (type === 'donor') {
    bgClass = 'bg-emerald-600';
    borderClass = 'border-white';
    shadowClass = 'shadow-emerald-500/50';
    // Food / Package Heart SVG
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/><path d="M19 12a7 7 0 0 0-14 0"/><path d="M12 3v3"/></svg>`;
  } else if (type === 'ngo') {
    bgClass = 'bg-amber-600';
    borderClass = 'border-white';
    shadowClass = 'shadow-amber-500/50';
    // Building SVG
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>`;
  } else if (type === 'user') {
    bgClass = 'bg-rose-600 ring-4 ring-rose-300';
    borderClass = 'border-white';
    shadowClass = 'shadow-rose-500/50';
    // Target Compass SVG
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
    pulseHtml = `<span class="absolute -inset-2.5 rounded-full bg-rose-400 opacity-60 animate-ping"></span>`;
  }

  const badgeText = label ? `<div class="mt-1 px-1.5 py-0.5 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-semibold rounded whitespace-nowrap shadow-md pointer-events-none text-center max-w-[120px] truncate">${label}</div>` : '';

  const html = `
    <div class="relative flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
      ${pulseHtml}
      <div class="w-9 h-9 rounded-full ${bgClass} border-2 ${borderClass} shadow-lg ${shadowClass} flex items-center justify-center text-white transition-transform hover:scale-110">
        ${iconSvg}
      </div>
      ${badgeText}
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-live-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22]
  });
};

// Map Controller for smooth flyTo and dynamic bounds auto-fitting
const MapController = ({ focusCoords, bounds, userLocation, triggerRecenter }) => {
  const map = useMap();
  const hasCenteredInitially = useRef(false);

  // Focus on specific coordinates when requested
  useEffect(() => {
    if (focusCoords && focusCoords[0] && focusCoords[1]) {
      map.flyTo(focusCoords, 15, { animate: true, duration: 1.2 });
    }
  }, [focusCoords, map]);

  // Recenter / Fit All trigger
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      try {
        const leafletBounds = L.latLngBounds(bounds);
        if (leafletBounds.isValid()) {
          map.fitBounds(leafletBounds, { padding: [50, 50], maxZoom: 14 });
          hasCenteredInitially.current = true;
          return;
        }
      } catch (err) {
        console.warn('Map fitBounds error:', err);
      }
    }
    if (userLocation && userLocation.latitude && userLocation.longitude && !hasCenteredInitially.current) {
      map.setView([userLocation.latitude, userLocation.longitude], 13);
      hasCenteredInitially.current = true;
    }
  }, [triggerRecenter, bounds, userLocation, map]);

  return null;
};

const LiveMap = ({
  center = [28.6180, 77.2130],
  zoom = 12,
  volunteers = [],
  donors = [],
  ngos = [],
  activeDeliveries = [],
  userLocation = null,
  focusCoords = null,
  height = 'h-[500px]',
  showControls = true,
  onRefresh = null,
  isRefreshing = false
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'volunteers' | 'donors' | 'ngos' | 'deliveries'
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [activeFocus, setActiveFocus] = useState(null);

  // Sync external focusCoords
  useEffect(() => {
    if (focusCoords) {
      setActiveFocus(focusCoords);
    }
  }, [focusCoords]);

  // Filter items
  const filteredVolunteers = useMemo(() => {
    if (filter === 'donors' || filter === 'ngos') return [];
    return volunteers.filter(v => v.latitude && v.longitude && v.latitude !== 0);
  }, [volunteers, filter]);

  const filteredDonors = useMemo(() => {
    if (filter === 'volunteers' || filter === 'ngos') return [];
    return donors.filter(d => d.latitude && d.longitude && d.latitude !== 0);
  }, [donors, filter]);

  const filteredNgos = useMemo(() => {
    if (filter === 'volunteers' || filter === 'donors') return [];
    return ngos.filter(n => n.latitude && n.longitude && n.latitude !== 0);
  }, [ngos, filter]);

  const filteredDeliveries = useMemo(() => {
    if (filter !== 'all' && filter !== 'deliveries') return [];
    return activeDeliveries;
  }, [activeDeliveries, filter]);

  // Collect all valid coordinates for bounding box calculation
  const allCoordinates = useMemo(() => {
    const coords = [];
    filteredVolunteers.forEach(v => coords.push([v.latitude, v.longitude]));
    filteredDonors.forEach(d => coords.push([d.latitude, d.longitude]));
    filteredNgos.forEach(n => coords.push([n.latitude, n.longitude]));
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      coords.push([userLocation.latitude, userLocation.longitude]);
    }
    return coords;
  }, [filteredVolunteers, filteredDonors, filteredNgos, userLocation]);

  // Dynamic initial center fallback
  const mapCenter = useMemo(() => {
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      return [userLocation.latitude, userLocation.longitude];
    }
    if (filteredVolunteers.length > 0) {
      return [filteredVolunteers[0].latitude, filteredVolunteers[0].longitude];
    }
    if (filteredDonors.length > 0) {
      return [filteredDonors[0].latitude, filteredDonors[0].longitude];
    }
    if (filteredNgos.length > 0) {
      return [filteredNgos[0].latitude, filteredNgos[0].longitude];
    }
    return center;
  }, [userLocation, filteredVolunteers, filteredDonors, filteredNgos, center]);

  const handleCenterOnMe = () => {
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      setActiveFocus([userLocation.latitude, userLocation.longitude]);
    } else {
      alert('Your GPS location is not currently available. Please allow location permissions in your browser.');
    }
  };

  const handleFitAll = () => {
    setActiveFocus(null);
    setRecenterTrigger(prev => prev + 1);
  };

  return (
    <div className={`relative ${height} w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md z-0 flex flex-col`}>
      {/* Top Map Control Bar */}
      {showControls && (
        <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-200/80 shadow-md pointer-events-auto text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({volunteers.length + donors.length + ngos.length})
            </button>
            <button
              onClick={() => setFilter('volunteers')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                filter === 'volunteers' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Truck className="w-3.5 h-3.5" /> Volunteers ({volunteers.length})
            </button>
            <button
              onClick={() => setFilter('donors')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                filter === 'donors' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" /> Donors ({donors.length})
            </button>
            <button
              onClick={() => setFilter('ngos')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                filter === 'ngos' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> NGOs ({ngos.length})
            </button>
            {activeDeliveries.length > 0 && (
              <button
                onClick={() => setFilter('deliveries')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                  filter === 'deliveries' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ⚡ In-Transit ({activeDeliveries.length})
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 shadow-md transition-all active:scale-95 disabled:opacity-60"
                title="Refresh live GPS feeds"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
            <button
              onClick={handleCenterOnMe}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 shadow-md transition-all active:scale-95"
              title="Center on My Location"
            >
              <Navigation className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Locate Me</span>
            </button>
            <button
              onClick={handleFitAll}
              className="p-1.5 bg-white/95 backdrop-blur-md hover:bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 shadow-md transition-all active:scale-95"
              title="Fit all markers in view"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Leaflet Map */}
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full flex-1"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          focusCoords={activeFocus}
          bounds={allCoordinates}
          userLocation={userLocation}
          triggerRecenter={recenterTrigger}
        />

        {/* Current User Marker ("You") */}
        {userLocation && userLocation.latitude && userLocation.longitude && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={createCustomIcon('user', userLocation.label || 'You (Live)', true)}
          >
            <Popup>
              <div className="p-1 text-xs font-sans space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-600">
                  <Navigation className="w-4 h-4" />
                  <span>Your Current Location</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  GPS: {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
                </p>
                {userLocation.accuracy && (
                  <p className="text-[10px] text-slate-400">Accuracy: ±{Math.round(userLocation.accuracy)}m</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Volunteers Markers */}
        {filteredVolunteers.map((v, idx) => {
          const isCurrentlyActive = !!v.active_task || (v.timestamp && (new Date() - new Date(v.timestamp)) < 15 * 60 * 1000);
          const distFromUser = userLocation ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, v.latitude, v.longitude) : null;

          return (
            <Marker
              key={`vol-${v.volunteer_id || idx}`}
              position={[v.latitude, v.longitude]}
              icon={createCustomIcon('volunteer', v.full_name?.split(' ')[0] || 'Volunteer', isCurrentlyActive)}
            >
              <Popup>
                <div className="p-1.5 text-xs font-sans space-y-2 min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-bold text-blue-700 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" /> {v.full_name}
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                      {v.vehicle_type || 'Bike'}
                    </span>
                  </div>

                  <div className="text-slate-600 space-y-0.5 text-[11px]">
                    <p className="flex items-center justify-between">
                      <span>Status:</span>
                      <span className={`font-semibold ${v.active_task ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {v.active_task ? `On Mission (${v.active_task.status})` : 'Available'}
                      </span>
                    </p>
                    {distFromUser !== null && (
                      <p className="flex items-center justify-between">
                        <span>Distance:</span>
                        <span className="font-mono font-semibold text-slate-800">{formatDistance(distFromUser)}</span>
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      Last ping: {v.timestamp ? new Date(v.timestamp).toLocaleTimeString() : 'Profile static'}
                    </p>
                  </div>

                  {v.phone && (
                    <a
                      href={`tel:${v.phone}`}
                      className="mt-1 flex items-center justify-center gap-1.5 w-full py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold text-[11px] transition-colors"
                    >
                      <Phone className="w-3 h-3" /> Call {v.phone}
                    </a>
                  )}

                  {v.active_task && (
                    <div className="mt-1 p-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-900">
                      <p className="font-bold">Active Delivery:</p>
                      <p className="truncate">📦 {v.active_task.donation_title}</p>
                      <p className="truncate text-slate-600">🏢 Dest: {v.active_task.ngo_name}</p>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Donors / Pickup Points Markers */}
        {filteredDonors.map((d, idx) => {
          const distFromUser = userLocation ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, d.latitude, d.longitude) : null;

          return (
            <Marker
              key={`donor-${d.donor_id || idx}`}
              position={[d.latitude, d.longitude]}
              icon={createCustomIcon('donor', d.organization_name || 'Pickup')}
            >
              <Popup>
                <div className="p-1.5 text-xs font-sans space-y-1.5 min-w-[190px]">
                  <div className="flex items-center gap-1 font-bold text-emerald-700 border-b border-slate-100 pb-1">
                    <HeartHandshake className="w-4 h-4 text-emerald-600" />
                    <span>{d.organization_name || 'Donor Location'}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-2">{d.address || 'Address registered'}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Active Food:</span>
                    <span className="font-bold text-emerald-700">{d.active_donations_count || 0} listings</span>
                  </div>

                  {distFromUser !== null && (
                    <p className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Distance:</span>
                      <span className="font-mono font-semibold text-slate-800">{formatDistance(distFromUser)}</span>
                    </p>
                  )}

                  {d.phone && (
                    <a
                      href={`tel:${d.phone}`}
                      className="mt-1 flex items-center justify-center gap-1.5 w-full py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-semibold text-[11px] transition-colors"
                    >
                      <Phone className="w-3 h-3" /> Call {d.phone}
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* NGOs / Hub Markers */}
        {filteredNgos.map((n, idx) => {
          const distFromUser = userLocation ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, n.latitude, n.longitude) : null;

          return (
            <Marker
              key={`ngo-${n.ngo_id || idx}`}
              position={[n.latitude, n.longitude]}
              icon={createCustomIcon('ngo', n.ngo_name || 'NGO')}
            >
              <Popup>
                <div className="p-1.5 text-xs font-sans space-y-1.5 min-w-[190px]">
                  <div className="flex items-center gap-1 font-bold text-amber-700 border-b border-slate-100 pb-1">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span>{n.ngo_name}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-2">{n.address || 'Registered NGO center'}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Active Requests:</span>
                    <span className="font-bold text-amber-700">{n.active_requests_count || 0}</span>
                  </div>

                  {distFromUser !== null && (
                    <p className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Distance:</span>
                      <span className="font-mono font-semibold text-slate-800">{formatDistance(distFromUser)}</span>
                    </p>
                  )}

                  {n.phone && (
                    <a
                      href={`tel:${n.phone}`}
                      className="mt-1 flex items-center justify-center gap-1.5 w-full py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-semibold text-[11px] transition-colors"
                    >
                      <Phone className="w-3 h-3" /> Call {n.phone}
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Active Deliveries Route Polylines */}
        {filteredDeliveries.map((del, idx) => {
          const volCoords = del.volunteer?.latitude && del.volunteer?.longitude ? [del.volunteer.latitude, del.volunteer.longitude] : null;
          const donorCoords = del.donation?.latitude && del.donation?.longitude ? [del.donation.latitude, del.donation.longitude] : (del.donor?.latitude ? [del.donor.latitude, del.donor.longitude] : null);
          const ngoCoords = del.ngo?.latitude && del.ngo?.longitude ? [del.ngo.latitude, del.ngo.longitude] : null;

          return (
            <React.Fragment key={`delivery-route-${del.assignment_id || idx}`}>
              {/* Volunteer -> Donor Pickup route */}
              {volCoords && donorCoords && (
                <Polyline
                  positions={[volCoords, donorCoords]}
                  pathOptions={{
                    color: '#2563eb', // Blue
                    weight: 3.5,
                    dashArray: '6, 8',
                    opacity: 0.85
                  }}
                />
              )}
              {/* Donor Pickup -> NGO Delivery route */}
              {donorCoords && ngoCoords && (
                <Polyline
                  positions={[donorCoords, ngoCoords]}
                  pathOptions={{
                    color: '#059669', // Emerald
                    weight: 3.5,
                    dashArray: '6, 8',
                    opacity: 0.85
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Bottom Map Legend */}
      <div className="bg-white/95 backdrop-blur-md px-3 py-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600 z-10">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-slate-700">Map Legend:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm"></span>
            Volunteer (Live Moving)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-sm"></span>
            Donor (Pickup Point)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shadow-sm"></span>
            NGO (Dropoff Hub)
          </span>
          {userLocation && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-sm animate-pulse"></span>
              Your Location
            </span>
          )}
          {filteredDeliveries.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-blue-600"></span>
              En-Route Path
            </span>
          )}
        </div>
        <div className="text-[10px] text-slate-400">
          OpenStreetMap &bull; High Precision Geolocation
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
