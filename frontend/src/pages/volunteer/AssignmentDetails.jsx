import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import { ArrowLeft } from 'lucide-react';

const VolunteerAssignmentDetails = () => {
  return (
    <div className="space-y-6">
      <Link to="/volunteer/assignments">
        <Button variant="outline" size="sm" icon={ArrowLeft}>Back to Assignments</Button>
      </Link>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Assignment Details</h2>
        <p className="text-xs text-slate-500 mt-1">Detailed view of your food rescue assignment.</p>
      </div>
    </div>
  );
};

export default VolunteerAssignmentDetails;
