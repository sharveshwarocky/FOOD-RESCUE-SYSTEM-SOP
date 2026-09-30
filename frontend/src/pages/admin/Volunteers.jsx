import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import SearchBar from '../../components/SearchBar';


const AdminVolunteers = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getVolunteers();
      if (res.success) setVolunteers(res.volunteers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const handleStatusUpdate = async (userId, status) => {
    try {
      await adminService.updateUserStatus(userId, status);
      fetchVolunteers();
    } catch (err) {
      alert('Error updating Volunteer status: ' + err.message);
    }
  };

  const filtered = volunteers.filter(v =>
    (v.full_name || v.username || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: 'Volunteer Name', accessor: 'full_name', cell: (r) => <span className="font-bold text-slate-800">{r.full_name || r.username}</span> },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Vehicle Type', accessor: 'vehicle_type', cell: (r) => <span className="text-xs font-semibold bg-slate-100 px-2 py-1 rounded">{r.vehicle_type || 'Bike'}</span> },
    { header: 'Availability', accessor: 'is_available', cell: (r) => r.is_available ? <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Available</span> : <span className="text-xs text-slate-500">Busy</span> },
    { header: 'Status', accessor: 'approval_status', cell: (r) => <StatusBadge status={r.approval_status} /> },
    {
      header: 'Actions',
      cell: (r) => (
        <div className="flex items-center gap-2">
          {r.approval_status !== 'APPROVED' && (
            <Button size="sm" variant="success" onClick={() => handleStatusUpdate(r.user_id, 'APPROVED')}>Approve</Button>
          )}
          {r.approval_status === 'APPROVED' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(r.user_id, 'DEACTIVATED')}>Deactivate</Button>
          )}
          {r.approval_status === 'DEACTIVATED' && (
            <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(r.user_id, 'APPROVED')}>Reactivate</Button>
          )}
        </div>
      )
    }
  ];


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Volunteer Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Approve and monitor active delivery volunteers</p>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search volunteer name..." />
      </div>

      <DataTable columns={columns} data={filtered} emptyText="No Volunteers registered." />
    </div>
  );
};

export default AdminVolunteers;
