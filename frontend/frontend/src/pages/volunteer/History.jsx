import React, { useState, useEffect } from 'react';
import { volunteerService } from '../../services/volunteerService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';

const VolunteerHistory = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    volunteerService.getAssignments()
      .then(res => {
        if (res.success) setHistory(res.assignments.filter(a => ['DELIVERED', 'COMPLETED'].includes(a.status)));
      });
  }, []);

  const columns = [
    { header: 'Donation Title', accessor: 'request_details', cell: (r) => <span className="font-bold text-slate-800">{r.request_details?.donation_title || 'Food Pickup'}</span> },
    { header: 'NGO Shelter', accessor: 'request_details', cell: (r) => r.request_details?.ngo_name },
    { header: 'Status', accessor: 'status', cell: (r) => <StatusBadge status={r.status} /> },
    { header: 'Accepted At', accessor: 'accepted_at', cell: (r) => new Date(r.accepted_at).toLocaleDateString() }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Completed Delivery History</h2>
        <p className="text-xs text-slate-500 mt-0.5">Past completed food rescue runs</p>
      </div>

      <DataTable columns={columns} data={history} emptyText="No historical completed deliveries." />
    </div>
  );
};

export default VolunteerHistory;
