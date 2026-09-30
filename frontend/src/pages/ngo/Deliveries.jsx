import React, { useState, useEffect } from 'react';
import { ngoService } from '../../services/ngoService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { CheckCircle2, Users, FileCheck } from 'lucide-react';

const NGODeliveries = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Beneficiary Confirmation Modal State
  const [selectedAssign, setSelectedAssign] = useState(null);
  const [beneficiaryCount, setBeneficiaryCount] = useState('45');
  const [beneficiaryNotes, setBeneficiaryNotes] = useState('Distributed to evening shelter residents.');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await ngoService.getAssignments();
      if (res.success) setAssignments(res.assignments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssign) return;

    // Delivery ID is extracted or created
    try {
      await ngoService.confirmDelivery(selectedAssign.id, parseInt(beneficiaryCount), beneficiaryNotes);
      alert('Delivery confirmed & marked COMPLETED! NGO OK!');
      setSelectedAssign(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const columns = [
    { header: 'Donation Title', accessor: 'request_details', cell: (r) => <span className="font-bold text-slate-800">{r.request_details?.donation_title || 'Food Item'}</span> },
    { header: 'Assigned Volunteer', accessor: 'volunteer_name', cell: (r) => <span className="font-medium text-slate-700">{r.volunteer_name} ({r.volunteer_phone || 'Phone'})</span> },
    { header: 'Delivery Status', accessor: 'status', cell: (r) => <StatusBadge status={r.status} /> },
    {
      header: 'Beneficiary Confirmation',
      cell: (r) => (
        <div>
          {r.status === 'COMPLETED' ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> NGO OK Completed
            </span>
          ) : (
            <Button size="sm" variant="success" icon={FileCheck} onClick={() => setSelectedAssign(r)}>
              Mark as Done NGO OK
            </Button>
          )}
        </div>
      )
    }
  ];

  if (loading) return <Loading text="Loading Delivery Records..." />;
  if (error) return <ErrorMessage message={error} retry={fetchData} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Food Deliveries & Beneficiary Proof</h2>
        <p className="text-xs text-slate-500 mt-0.5">Verify volunteer delivery proof photo and submit beneficiary distribution count</p>
      </div>

      <DataTable columns={columns} data={assignments} emptyText="No active delivery assignments." />

      {/* Confirmation Modal */}
      {selectedAssign && (
        <Modal isOpen={!!selectedAssign} onClose={() => setSelectedAssign(null)} title="Confirm Delivery & Beneficiary Details">
          <form onSubmit={handleConfirmSubmit} className="space-y-4 text-sm">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="font-bold text-slate-800">{selectedAssign.request_details?.donation_title}</p>
              <p className="text-xs text-slate-600">Volunteer: {selectedAssign.volunteer_name} ({selectedAssign.volunteer_phone})</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Total Beneficiaries Fed</label>
              <input
                type="number"
                value={beneficiaryCount}
                onChange={(e) => setBeneficiaryCount(e.target.value)}
                placeholder="Number of people fed"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Distribution Notes</label>
              <textarea
                value={beneficiaryNotes}
                onChange={(e) => setBeneficiaryNotes(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setSelectedAssign(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="success">
                Mark as Done NGO OK
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default NGODeliveries;
