import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { CreditCard, PlusCircle } from 'lucide-react';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [amount, setAmount] = useState('500');
  const [purpose, setPurpose] = useState('Volunteer Fuel & Logistics Grant');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const [payRes, volRes] = await Promise.all([
        adminService.getPayments(),
        adminService.getVolunteers()
      ]);
      if (payRes.success) setPayments(payRes.payments);
      if (volRes.success) setVolunteers(volRes.volunteers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    try {
      await adminService.processPayment({
        user_id: selectedUser,
        amount: parseFloat(amount),
        purpose
      });
      setModalOpen(false);
      fetchPayments();
    } catch (err) {
      alert('Error processing mock payment: ' + err.message);
    }
  };

  const columns = [
    { header: 'Transaction ID', accessor: 'transaction_id', cell: (r) => <code className="font-mono text-xs font-bold text-slate-800">{r.transaction_id}</code> },
    { header: 'Recipient User', accessor: 'username' },
    { header: 'Purpose', accessor: 'purpose' },
    { header: 'Amount', accessor: 'amount', cell: (r) => <span className="font-bold text-emerald-700">₹{r.amount}</span> },
    { header: 'Status', accessor: 'status', cell: (r) => <StatusBadge status={r.status} /> },
    { header: 'Date', accessor: 'created_at', cell: (r) => new Date(r.created_at).toLocaleDateString() }
  ];

  if (loading) return <Loading text="Loading Payment Transactions..." />;
  if (error) return <ErrorMessage message={error} retry={fetchPayments} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Mock Logistics Payment Module</h2>
          <p className="text-xs text-slate-500 mt-0.5">Disburse fuel grants and logistics support payments to volunteers</p>
        </div>
        <Button icon={PlusCircle} onClick={() => setModalOpen(true)}>
          Disburse New Grant
        </Button>
      </div>

      <DataTable columns={columns} data={payments} emptyText="No payment transactions recorded." />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Process Mock Grant Payment">
        <form onSubmit={handleProcessPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Volunteer / User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
              required
            >
              <option value="">-- Choose Recipient --</option>
              {volunteers.map(v => (
                <option key={v.user_id} value={v.user_id}>
                  {v.full_name} ({v.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Amount (₹ INR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Purpose / Description</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Process Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPayments;
