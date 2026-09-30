import React from 'react';

const FilterBar = ({ options, value, onChange, label = 'Filter' }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-slate-500 uppercase">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterBar;
