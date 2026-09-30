import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import SearchBar from '../../components/SearchBar';
import FilterBar from '../../components/FilterBar';
import Loading from '../../components/Loading';


const AdminNGOs = () => {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchNGOs = async () => {
    try {
      setLoading(true);
      const res = await adminService.getNGOs();
      if (res.success) {
        setNgos(res.ngos);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNGOs();
  }, []);

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      fetchNGOs();
    } catch (err) {
      alert('Error updating NGO status: ' + err.message);
    }
  };

  const filteredNGOs = ngos.filter(n => {
    const matchesSearch = n.ngo_name.toLowerCase().includes(search.toLowerCase()) ||
                          n.registration_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || n.approval_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { header: 'NGO Name', accessor: 'ngo_name', cell: (r) => <span className="font-bold text-slate-800">{r.ngo_name}</span> },
    { header: 'Reg Number', accessor: 'registration_number', cell: (r) => <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">{r.registration_number}</code> },
    { header: 'Contact Phone', accessor: 'phone', cell: (r) => r.phone || 'N/A' },
    { header: 'Address', accessor: 'address', cell: (r) => <span className="text-xs text-slate-600 max-w-xs block truncate">{r.address}</span> },
    { header: 'Status', accessor: 'approval_status', cell: (r) => <StatusBadge status={r.approval_status} /> },
    {
      header: 'Actions',
      cell: (r) => (
        <div className="flex items-center gap-2">
          {r.approval_status !== 'APPROVED' && (
            <Button size="sm" variant="success" onClick={() => handleStatusUpdate(r.user_id, 'APPROVED')}>
              Approve
            </Button>
          )}
          {r.approval_status !== 'REJECTED' && r.approval_status === 'PENDING' && (
            <Button size="sm" variant="danger" onClick={() => handleStatusUpdate(r.user_id, 'REJECTED')}>
              Reject
            </Button>
          )}
          {r.approval_status === 'APPROVED' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(r.user_id, 'DEACTIVATED')}>
              Deactivate
            </Button>
          )}
          {r.approval_status === 'DEACTIVATED' && (
            <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(r.user_id, 'APPROVED')}>
              Reactivate
            </Button>
          )}
        </div>
      )
    }
  ];


 
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">NGO Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Verify and manage NGO partner registrations</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search NGO name or reg #..." />
          <FilterBar
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Approved', value: 'APPROVED' },
              { label: 'Rejected', value: 'REJECTED' },
              { label: 'Deactivated', value: 'DEACTIVATED' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      <DataTable columns={columns} data={filteredNGOs} emptyText="No NGOs matching filter criteria." />
    </div>
  );
};

export default AdminNGOs;
