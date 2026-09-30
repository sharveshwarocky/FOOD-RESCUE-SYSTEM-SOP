import React from 'react';
import { AlertTriangle, XCircle, CheckCircle2, MinusCircle } from 'lucide-react';

const STYLES = {
  EXPIRED: { cls: 'text-rose-700 bg-rose-50 border-rose-200', Icon: XCircle, label: 'EXPIRED' },
  EXPIRING_SOON: { cls: 'text-amber-700 bg-amber-50 border-amber-200', Icon: AlertTriangle, label: 'EXPIRING SOON' },
  FRESH: { cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', Icon: CheckCircle2, label: 'FRESH' },
  NO_EXPIRY_INFO: { cls: 'text-slate-500 bg-slate-100 border-slate-200', Icon: MinusCircle, label: 'NO EXPIRY INFO' },
};

// Renders the donation's computed expiry_state from the API (fresh / expiring-soon / expired)
const ExpiryBadge = ({ state }) => {
  const style = STYLES[state] || STYLES.NO_EXPIRY_INFO;
  const Icon = style.Icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.cls}`}>
      <Icon className="w-3 h-3 shrink-0" /> {style.label}
    </span>
  );
};

export default ExpiryBadge;
