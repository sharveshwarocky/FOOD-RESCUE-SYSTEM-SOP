import React, { useState, useEffect } from 'react';
import { locationService } from '../../services/locationService';
import LiveMap from '../../components/LiveMap';
import { MapPin, RefreshCw, Truck, HeartHandshake, Building2, Phone, Search, Radio, Navigation } from 'lucide-react';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';

const AdminLiveTracking = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [donors, setDonors] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusCoords, setFocusCoords] = useState(null);

  const fetchTracking = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await locationService.getLiveFeed();
      if (res.success) {
        setVolunteers(res.volunteers || []);
        setDonors(res.donors || []);
        setNgos(res.ngos || []);
        setActiveDeliveries(res.active_deliveries || []);
        setCurrentUser(res.current_user || null);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(() => fetchTracking(false), 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleFocusVolunteer = (v) => {
    if (v.latitude && v.longitude) {
      setFocusCoords([v.latitude, v.longitude]);
    }
  };

  const filteredVolunteers = volunteers.filter(v =>
    v.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.vehicle_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.phone?.includes(searchQuery)
  );

  if (loading && volunteers.length === 0) {
    return <Loading text="Loading Live City Rescue Network & Coordinates..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800">City Live Rescue & Tracking Map</h2>
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-semibold">
              <Radio className="w-3 h-3 animate-pulse text-emerald-600" /> Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time GPS coordinates stream connecting Volunteers, Donors, and NGOs across the network
          </p>
        </div>
        <button
          onClick={() => fetchTracking(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Refresh Coordinates'}</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} retry={() => fetchTracking(true)} />}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Volunteers Active</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{volunteers.length}</h3>
            <p className="text-[10px] text-blue-600 mt-0.5">Live GPS Broadcasting</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Active In-Transit</p>
            <h3 className="text-2xl font-bold text-purple-700 mt-1">{activeDeliveries.length}</h3>
            <p className="text-[10px] text-purple-600 mt-0.5">Missions in Progress</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Navigation className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Pickup Points</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">{donors.length}</h3>
            <p className="text-[10px] text-emerald-600 mt-0.5">Registered Donors</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <HeartHandshake className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">NGO Hubs</p>
            <h3 className="text-2xl font-bold text-amber-700 mt-1">{ngos.length}</h3>
            <p className="text-[10px] text-amber-600 mt-0.5">Distribution Centers</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Interactive Live Map */}
      <LiveMap
        volunteers={volunteers}
        donors={donors}
        ngos={ngos}
        activeDeliveries={activeDeliveries}
        userLocation={currentUser?.latitude && currentUser?.longitude ? {
          latitude: currentUser.latitude,
          longitude: currentUser.longitude,
          label: 'Admin Station'
        } : null}
        focusCoords={focusCoords}
        height="h-[520px]"
        onRefresh={() => fetchTracking(true)}
        isRefreshing={refreshing}
      />

      {/* Active Tracking Feed */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Volunteer Fleet Live Stream</h3>
            <p className="text-xs text-slate-500">Click any volunteer to focus and zoom the map directly on their live coordinates</p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search volunteer, vehicle, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredVolunteers.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-400">
              No volunteers matched the search query.
            </div>
          ) : (
            filteredVolunteers.map((v, idx) => (
              <div
                key={v.volunteer_id || idx}
                onClick={() => handleFocusVolunteer(v)}
                className="p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs space-y-2 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 group-hover:text-blue-700 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    {v.full_name}
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                    {v.vehicle_type || 'Bike'}
                  </span>
                </div>

                <div className="space-y-1 text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {v.latitude ? `Lat: ${v.latitude.toFixed(4)}, Lng: ${v.longitude.toFixed(4)}` : 'Coordinates pending'}
                    </span>
                  </p>
                  {v.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{v.phone}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Last ping: {v.timestamp ? new Date(v.timestamp).toLocaleTimeString() : 'Static registered profile'}
                  </p>
                </div>

                {v.active_task ? (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-900">
                    <p className="font-semibold">⚡ On Delivery: {v.active_task.donation_title}</p>
                    <p className="truncate text-slate-600">Dropoff: {v.active_task.ngo_name}</p>
                  </div>
                ) : (
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Available for rescue assignments
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLiveTracking;
