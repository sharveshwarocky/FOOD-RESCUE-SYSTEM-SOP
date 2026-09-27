import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { volunteerService } from '../../services/volunteerService';
import { useGeolocation } from '../../hooks/useGeolocation';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { Truck, CheckSquare, PackageCheck, MapPin, Navigation } from 'lucide-react';

const VolunteerDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // HTML5 Geolocation WatchPosition Hook (broadcasts location to Flask API)
  const { location, error: geoError } = useGeolocation(true);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await volunteerService.getAssignments();
      if (res.success) setAssignments(res.assignments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  if (loading) return <Loading text="Loading Volunteer Dashboard..." />;
  if (error) return <ErrorMessage message={error} retry={fetchAssignments} />;

  const activeAssign = assignments.find(a => ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(a.status));
  const completedAssigns = assignments.filter(a => ['DELIVERED', 'COMPLETED'].includes(a.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Volunteer Delivery Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage food rescue pickups and broadcast live GPS location to backend</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-800">
          <Navigation className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>GPS Tracking Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Total Assignments" value={assignments.length} icon={CheckSquare} color="emerald" subtitle="Assigned by admin" />
        <DashboardCard title="Active Duty" value={activeAssign ? 1 : 0} icon={Truck} color="blue" subtitle={activeAssign ? activeAssign.status : 'Free'} />
        <DashboardCard title="Completed Runs" value={completedAssigns.length} icon={PackageCheck} color="purple" subtitle="Delivered to NGOs" />
        <DashboardCard title="GPS Broadcasting" value={location.latitude ? 'Active' : 'Standby'} icon={Navigation} color="amber" subtitle="HTML5 Geolocation API" />
      </div>

      {/* Active Assignment Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">Current Active Assignment</h3>
          <Link to="/volunteer/assignments">
            <Button size="sm" variant="outline">View All ({assignments.length})</Button>
          </Link>
        </div>

        {activeAssign ? (
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h4 className="font-bold text-slate-800 text-base">{activeAssign.request_details?.donation_title}</h4>
                <p className="text-xs text-slate-500">NGO: {activeAssign.request_details?.ngo_name}</p>
              </div>
              <StatusBadge status={activeAssign.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <p>📍 <strong>Pickup:</strong> {activeAssign.request_details?.donation_pickup_address}</p>
              <p>🏢 <strong>Delivery NGO:</strong> {activeAssign.request_details?.ngo_address}</p>
            </div>

            <div className="pt-2">
              <Link to="/volunteer/assignments">
                <Button size="sm" className="w-full sm:w-auto">Update Delivery Workflow Status</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-500 text-sm">
            You currently have no active delivery assignment on duty.
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerDashboard;
