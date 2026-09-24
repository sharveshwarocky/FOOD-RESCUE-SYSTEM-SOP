import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import { ArrowLeft } from 'lucide-react';

const NGORequestDetails = () => {
  return (
    <div className="space-y-6">
      <Link to="/ngo/requests">
        <Button variant="outline" size="sm" icon={ArrowLeft}>Back to Requests</Button>
      </Link>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">NGO Request Details</h2>
        <p className="text-xs text-slate-500 mt-1">Status view of request & volunteer dispatch.</p>
      </div>
    </div>
  );
};

export default NGORequestDetails;
