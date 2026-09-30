import React from 'react';

const Card = ({ children, className = '', title, subtitle, action }) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            {title && <h3 className="font-bold text-slate-800 text-lg">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};

export default Card;
