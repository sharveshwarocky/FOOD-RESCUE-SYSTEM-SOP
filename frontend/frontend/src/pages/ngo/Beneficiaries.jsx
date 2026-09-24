import React from 'react';
import DashboardCard from '../../components/DashboardCard';
import { Users, HeartHandshake, CheckCircle2 } from 'lucide-react';

const NGOBeneficiaries = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Beneficiaries Impact Dashboard</h2>
        <p className="text-xs text-slate-500 mt-0.5">Overview of individuals fed through your shelter distributions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardCard title="Total Beneficiaries Fed" value="480 People" icon={Users} color="emerald" subtitle="Shelter residents & families" />
        <DashboardCard title="Meals Distributed" value="24 Deliveries" icon={CheckCircle2} color="blue" subtitle="Verified deliveries" />
        <DashboardCard title="Food Rescued" value="70.0 kg" icon={HeartHandshake} color="purple" subtitle="Zero waste goal" />
      </div>
    </div>
  );
};

export default NGOBeneficiaries;
