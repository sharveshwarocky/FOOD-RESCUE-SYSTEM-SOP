import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import DashboardCard from '../../components/DashboardCard';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { Activity, Server, Database, ShieldCheck, Cpu } from 'lucide-react';

const AdminMonitoring = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMonitoring = async () => {
    try {
      setLoading(true);
      const res = await adminService.getMonitoring();
      if (res.success) setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoring();
  }, []);

  if (loading) return <Loading text="Fetching System Monitoring State..." />;
  if (error) return <ErrorMessage message={error} retry={fetchMonitoring} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">System Control & Monitoring</h2>
        <p className="text-xs text-slate-500 mt-0.5">Real-time health status of Flask API server & SQLite database</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="System Status" value={data.system_status} icon={ShieldCheck} color="emerald" subtitle="All operational" />
        <DashboardCard title="Uptime SLA" value={data.uptime} icon={Server} color="blue" subtitle="Continuous availability" />
        <DashboardCard title="API Latency" value={data.api_latency} icon={Cpu} color="purple" subtitle="Response speed" />
        <DashboardCard title="Active Sessions" value={data.active_sessions} icon={Activity} color="amber" subtitle="Connected users" />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-600" /> Database & Infrastructure Health
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="font-semibold text-slate-700">Database Connection</span>
            <p className="text-emerald-700 font-bold text-base">{data.database}</p>
            <p className="text-xs text-slate-500">Path: database/food_rescue.db</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="font-semibold text-slate-700">Flask REST Server</span>
            <p className="text-blue-700 font-bold text-base">Running on http://127.0.0.1:5000</p>
            <p className="text-xs text-slate-500">JWT Token Auth Active</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMonitoring;
