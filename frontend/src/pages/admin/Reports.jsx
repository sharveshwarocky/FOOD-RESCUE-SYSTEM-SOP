import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import DataTable from '../../components/DataTable';
import { FileText, Download } from 'lucide-react';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await adminService.getReports();
      if (res.success) setReports(res.reports);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = (r) => {
    const csvContent = `Month,Year,Total Donations,Total Deliveries,Beneficiaries Served,Food Saved\n"${r.month}",${r.year},${r.total_donations},${r.total_deliveries},${r.beneficiaries},"${r.food_saved}"`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Food_Rescue_Report_${r.month}_${r.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    { header: 'Period', accessor: 'month', cell: (r) => <span className="font-bold text-slate-800">{r.month} {r.year}</span> },
    { header: 'Total Donations', accessor: 'total_donations' },
    { header: 'Deliveries Completed', accessor: 'total_deliveries' },
    { header: 'Beneficiaries Served', accessor: 'beneficiaries', cell: (r) => <span className="font-semibold text-emerald-700">{r.beneficiaries} people</span> },
    { header: 'Food Saved', accessor: 'food_saved', cell: (r) => <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{r.food_saved}</span> },
    {
      header: 'Export',
      cell: (r) => (
        <button
          onClick={() => handleExportCSV(r)}
          className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> CSV Report
        </button>
      )
    }
  ];

 
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Monthly System Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">Calculated performance stats & exportable CSV audit summary</p>
        </div>
      </div>

      <DataTable columns={columns} data={reports} emptyText="No reports generated." />
    </div>
  );
};

export default AdminReports;
