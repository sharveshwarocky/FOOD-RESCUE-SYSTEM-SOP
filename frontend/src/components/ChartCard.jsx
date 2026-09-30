import React from 'react';
import { Card } from './Card';

const ChartCard = ({ title, subtitle, children }) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h3 className="font-bold text-slate-800 text-base">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="h-64 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
