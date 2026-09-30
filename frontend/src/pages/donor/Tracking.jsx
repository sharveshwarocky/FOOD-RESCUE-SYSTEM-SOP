import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { locationService } from '../../services/locationService';
import LiveMap from '../../components/LiveMap';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { calculateDistanceKm, formatDistance } from '../../utils/distance';
import { Truck, Phone, MapPin, Building2, HeartHandshake, Radio, RefreshCw, Navigation, PlusCircle, CheckCircle } from 'lucide-react';

const DonorTracking = () => {
  const [feedData, setFeedData] = useState({
    volunteers: [],
    donors: [],
    ngos: [],
    active_deliveries: [],
    current_user: null
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [focusCoords, setFocusCoords] = useState(null);

  const fetchTracking = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await locationService.getLiveFeed();
      if (res.success) {
        setFeedData(res);
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
    const interval = setInterval(() => fetchTracking(false), 10000); // 10s live poll
    return () => clearInterval(interval);
  }, []);

  const currentUser = feedData.current_user;

  // Filter deliveries for this donor's donations
  const myPickups = feedData.active_deliveries.filter(del =>
    (currentUser && del.donor?.id && del.donor.id === currentUser.id) ||
    (currentUser && del.donor?.name && currentUser.name && del.donor.name.toLowerCase().includes(currentUser.name.toLowerCase()))
  );

  // Deliveries to show on map (my pickups or all active deliveries if none specific)
  const deliveriesToDisplay = myPickups.length > 0 ? myPickups : feedData.active_deliveries;

  if (loading && feedData.volunteers.length === 0) {
    return <Loading text="Loading Live Food Pickup & Volunteer Tracking..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800">Active Food Pickup Tracking</h2>
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-semibold">
              <Radio className="w-3 h-3 animate-pulse text-emerald-600" /> Live Stream
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Watch assigned volunteers travel to your pickup address and track delivery progress to partner NGOs
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/donor/post-food"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Post Surplus Food
          </Link>
          <button
            onClick={() => fetchTracking(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} retry={() => fetchTracking(true)} />}

      {/* Live Map */}
      <LiveMap
        volunteers={feedData.volunteers}
        donors={feedData.donors}
        ngos={feedData.ngos}
        activeDeliveries={deliveriesToDisplay}
        userLocation={currentUser?.latitude && currentUser?.longitude ? {
          latitude: currentUser.latitude,
          longitude: currentUser.longitude,
          label: currentUser.name || 'Your Pickup Location'
        } : null}
        focusCoords={focusCoords}
        height="h-[480px]"
        onRefresh={() => fetchTracking(true)}
        isRefreshing={refreshing}
      />

      {/* Active Food Pickups Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-600" />
          <span>Your Active Food Rescue Pickups</span>
          {myPickups.length > 0 && (
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-semibold">
              {myPickups.length} ongoing
            </span>
          )}
        </h3>

        {myPickups.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No Active Volunteer Pickups Currently</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When an NGO requests your posted food and a volunteer claims the task, you will see the volunteer's live GPS location, ETA, and phone number right here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPickups.map((del, idx) => {
              const volLat = del.volunteer?.latitude;
              const volLng = del.volunteer?.longitude;
              const pickupLat = currentUser?.latitude || del.donation?.latitude || del.donor?.latitude;
              const pickupLng = currentUser?.longitude || del.donation?.longitude || del.donor?.longitude;
              const distanceKm = (volLat && volLng && pickupLat && pickupLng) ? calculateDistanceKm(volLat, volLng, pickupLat, pickupLng) : null;

              const isPickedUp = ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(del.status);

              return (
                <div
                  key={del.assignment_id || idx}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {del.status?.replace('_', ' ')}
                      </span>
                      <h4 className="font-bold text-slate-800 text-base mt-1.5">{del.donation?.title}</h4>
                      <p className="text-xs text-slate-500">Quantity: {del.donation?.quantity || 'Full batch'}</p>
                    </div>

                    <button
                      onClick={() => volLat && volLng && setFocusCoords([volLat, volLng])}
                      className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-semibold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Locate
                    </button>
                  </div>

                  {/* Visual Status Steps */}
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[11px] font-semibold text-slate-700 mb-2">Pickup Progress:</p>
                    <div className="flex items-center justify-between text-[10px] relative">
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">1</div>
                        <span className="text-emerald-700 font-semibold">Accepted</span>
                      </div>
                      <div className={`flex-1 h-0.5 ${isPickedUp ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-white ${isPickedUp ? 'bg-emerald-600' : 'bg-blue-600 animate-pulse'}`}>2</div>
                        <span className={isPickedUp ? 'text-emerald-700 font-semibold' : 'text-blue-600 font-semibold'}>
                          {isPickedUp ? 'Picked Up' : 'En Route'}
                        </span>
                      </div>
                      <div className={`flex-1 h-0.5 ${del.status === 'DELIVERED' ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-white ${del.status === 'DELIVERED' ? 'bg-emerald-600' : 'bg-slate-300'}`}>3</div>
                        <span className={del.status === 'DELIVERED' ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>Delivered</span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Volunteer Card */}
                  <div className="flex items-center justify-between bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                        {del.volunteer?.name?.charAt(0) || 'V'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{del.volunteer?.name || 'Assigned Volunteer'}</p>
                        <p className="text-[10px] text-slate-500">{del.volunteer?.vehicle_type || 'Vehicle'} &bull; Live GPS Streaming</p>
                      </div>
                    </div>

                    <div className="text-right">
                      {distanceKm !== null ? (
                        <div>
                          <p className="text-xs font-mono font-bold text-emerald-800">{formatDistance(distanceKm)}</p>
                          <p className="text-[10px] text-slate-400">from your location</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">GPS active</span>
                      )}
                    </div>
                  </div>

                  {/* Destination NGO */}
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-700">Delivering to NGO: </span>
                      <span>{del.ngo?.name || 'Partner NGO'}</span>
                      {del.ngo?.address && <p className="text-[11px] text-slate-400">{del.ngo.address}</p>}
                    </div>
                  </div>

                  {del.volunteer?.phone && (
                    <a
                      href={`tel:${del.volunteer.phone}`}
                      className="flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Volunteer ({del.volunteer.phone})
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* City Network Overview */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-600" />
          <span>Partner NGO Distribution Hubs in Your Area</span>
        </h3>
        <p className="text-xs text-slate-500">
          These verified NGOs receive surplus food donations and distribute them to community shelters
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {feedData.ngos.map((ngo, idx) => (
            <div
              key={ngo.ngo_id || idx}
              onClick={() => ngo.latitude && ngo.longitude && setFocusCoords([ngo.latitude, ngo.longitude])}
              className="p-3 bg-slate-50 hover:bg-amber-50/50 border border-slate-200 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all"
            >
              <div>
                <p className="font-bold text-slate-800">{ngo.ngo_name}</p>
                <p className="text-slate-500 text-[11px] line-clamp-1">{ngo.address || 'Verified center'}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  {ngo.active_requests_count || 0} active
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DonorTracking;
