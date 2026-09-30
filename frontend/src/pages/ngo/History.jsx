import React, { useState, useEffect } from 'react';
import { ngoService } from '../../services/ngoService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';

const NGOHistory = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    ngoService.getMyRequests()
      .then(res => {
        if (res.success) setHistory(res.requests.filter(r => r.status === 'COMPLETED'));
      });
  }, []);

  const columns = [
    { header: 'Donation Title', accessor: 'donation_title', cell: (r) => <span className="font-bold text-slate-800">{r.donation_title}</span> },
    { header: 'Donor', accessor: 'donor_name' },
    { header: 'Quantity', accessor: 'donation_quantity' },
    { header: 'Status', accessor: 'status', cell: (r) => <StatusBadge status={r.status} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Completed NGO Distribution History</h2>
        <p className="text-xs text-slate-500 mt-0.5">Past food distributions completed by your shelter</p>
      </div>

      <DataTable columns={columns} data={history} emptyText="No completed historical requests." />
    </div>
  );
};

export default NGOHistory;
