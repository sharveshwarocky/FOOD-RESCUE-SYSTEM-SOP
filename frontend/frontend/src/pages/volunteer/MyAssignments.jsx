import React, { useState, useEffect } from 'react';
import { volunteerService } from '../../services/volunteerService';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import ImageUpload from '../../components/ImageUpload';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { CheckCircle2, Truck, Package, Check, Camera } from 'lucide-react';

const VolunteerMyAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Proof Upload Modal
  const [proofAssignId, setProofAssignId] = useState(null);
  const [proofFile, setProofFile] = useState(null);

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

  const handleRespond = async (id, action) => {
    try {
      const res = await volunteerService.respondAssignment(id, action);
      if (res.success) {
        alert(`Assignment ${action.lower()}ed successfully!`);
        fetchAssignments();
      }
    } catch (err) {
      alert(err.message); // Shows "This assignment has already been accepted by another volunteer."
    }
  };

  const handleStatusTransition = async (assignmentId, nextStatus) => {
    try {
      await volunteerService.updateStatus(assignmentId, nextStatus);
      fetchAssignments();
    } catch (err) {
      alert('Error updating delivery status: ' + err.message);
    }
  };

  const handleProofSubmit = async (e) => {
    e.preventDefault();
    if (!proofAssignId || !proofFile) return alert('Select photo file first.');

    const formData = new FormData();
    formData.append('assignment_id', proofAssignId);
    formData.append('proof_image', proofFile);

    try {
      const res = await volunteerService.uploadProof(formData);
      if (res.success) {
        alert('Delivery proof photo uploaded successfully! Status updated to DELIVERED.');
        setProofAssignId(null);
        fetchAssignments();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <Loading text="Loading Assignments..." />;
  if (error) return <ErrorMessage message={error} retry={fetchAssignments} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">My Delivery Assignments</h2>
        <p className="text-xs text-slate-500 mt-0.5">Enforce delivery workflow: ASSIGNED → ACCEPTED → PICKED UP → OUT FOR DELIVERY → DELIVERED</p>
      </div>

      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
            No delivery assignments currently assigned to you.
          </div>
        ) : (
          assignments.map((a) => (
            <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{a.request_details?.donation_title || 'Food Rescue Pickup'}</h3>
                  <p className="text-xs text-slate-500 font-semibold">NGO Shelter: {a.request_details?.ngo_name}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="font-bold text-slate-800 mb-1">📍 Pickup Details (Donor):</p>
                  <p><strong>Name:</strong> {a.request_details?.donor_name}</p>
                  <p><strong>Address:</strong> {a.request_details?.donation_pickup_address}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-1">🏢 Delivery Details (NGO):</p>
                  <p><strong>NGO:</strong> {a.request_details?.ngo_name}</p>
                  <p><strong>Phone:</strong> {a.request_details?.ngo_phone}</p>
                  <p><strong>Address:</strong> {a.request_details?.ngo_address}</p>
                </div>
              </div>

              {/* Workflow Status Transition Action Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {a.status === 'ASSIGNED' && (
                  <>
                    <Button size="sm" variant="success" onClick={() => handleRespond(a.id, 'ACCEPT')}>
                      ACCEPT ASSIGNMENT
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleRespond(a.id, 'REJECT')}>
                      REJECT ASSIGNMENT
                    </Button>
                  </>
                )}

                {a.status === 'ACCEPTED' && (
                  <Button size="sm" variant="primary" icon={Package} onClick={() => handleStatusTransition(a.id, 'PICKED_UP')}>
                    MARK AS PICKED UP
                  </Button>
                )}

                {a.status === 'PICKED_UP' && (
                  <Button size="sm" variant="warning" icon={Truck} onClick={() => handleStatusTransition(a.id, 'OUT_FOR_DELIVERY')}>
                    MARK AS OUT FOR DELIVERY
                  </Button>
                )}

                {a.status === 'OUT_FOR_DELIVERY' && (
                  <Button size="sm" variant="success" icon={Camera} onClick={() => setProofAssignId(a.id)}>
                    UPLOAD PROOF & MARK DELIVERED
                  </Button>
                )}

                {['DELIVERED', 'COMPLETED'].includes(a.status) && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Delivery Workflow Completed
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Proof Photo Modal */}
      {proofAssignId && (
        <Modal isOpen={!!proofAssignId} onClose={() => setProofAssignId(null)} title="Upload Delivery Proof Photo">
          <form onSubmit={handleProofSubmit} className="space-y-4">
            <ImageUpload onChange={setProofFile} label="Take Picture or Upload Delivery Proof Photo" />
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setProofAssignId(null)}>Cancel</Button>
              <Button type="submit" variant="success">Upload Proof & Complete Delivery</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default VolunteerMyAssignments;
