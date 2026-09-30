import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ text = 'Loading details...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
};

export default Loading;
