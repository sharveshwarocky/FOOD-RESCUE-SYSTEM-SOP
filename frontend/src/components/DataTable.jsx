import React from 'react';

const DataTable = ({ columns, data, emptyText = 'No records found.' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
        <p className="text-sm">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
      <table className="w-full text-left text-sm text-slate-700">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-5 py-3.5">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-slate-50/80 transition-colors">
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="px-5 py-4">
                  {col.cell ? col.cell(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
