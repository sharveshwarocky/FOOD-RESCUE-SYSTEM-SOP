import React, { useState, useEffect } from 'react';
import { ngoService } from '../../services/ngoService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';

const NGORequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await ngoService.getMyRequests();
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
    { header: 'Donor', accessor: 'donor_name' },
    { header: 'Quantity', accessor: 'donation_quantity' },
    { header: 'Quality Status', accessor: 'quality_status', cell: (r) => <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">{r.quality_status}</span> },
    { header: 'Request Status', accessor: 'status', cell: (r) => <StatusBadge status={r.status} /> },
    { header: 'Requested Date', accessor: 'requested_at', cell: (r) => new Date(r.requested_at).toLocaleDateString() }
  ];

  if (loading) return <Loading text="Loading My Food Requests..." />;
  if (error) return <ErrorMessage message={error} retry={fetchRequests} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">My Food Requests</h2>
        <p className="text-xs text-slate-500 mt-0.5">Track status of food requests submitted to donors</p>
      </div>

      <DataTable columns={columns} data={requests} emptyText="No requests submitted yet." />
    </div>
  );
};

export default NGORequests;
