import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, retry }) => {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 my-4">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-semibold text-sm">Error Occurred</h4>
        <p className="text-sm mt-0.5">{message}</p>
        {retry && (
          <button
            onClick={retry}
            className="mt-2 text-xs font-semibold underline hover:text-red-800"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
