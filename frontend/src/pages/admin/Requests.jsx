import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';


const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await adminService.getRequests();
      if (res.success) setRequests(res.requests);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const columns = [
    { header: 'Donation Title', accessor: 'donation_title', cell: (r) => <span className="font-bold text-slate-800">{r.donation_title}</span> },
    { header: 'Requesting NGO', accessor: 'ngo_name' },
    { header: 'Donor', accessor: 'donor_name' },
    { header: 'Quality Verification', accessor: 'quality_status', cell: (r) => <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">{r.quality_status}</span> },
    { header: 'Status', accessor: 'status', cell: (r) => <StatusBadge status={r.status} /> },
    { header: 'Requested At', accessor: 'requested_at', cell: (r) => new Date(r.requested_at).toLocaleDateString() }
  ];


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">NGO Food Requests</h2>
        <p className="text-xs text-slate-500 mt-0.5">Track food requests submitted by NGOs to donors</p>
      </div>

      <DataTable columns={columns} data={requests} emptyText="No NGO requests found." />
    </div>
  );
};

export default AdminRequests;
