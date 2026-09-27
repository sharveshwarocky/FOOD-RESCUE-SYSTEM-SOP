import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';

const VolunteerNotifications = () => {
  const { notifications, markAsRead } = useNotifications();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Volunteer Notifications & SMS Alerts</h2>
        <p className="text-xs text-slate-500 mt-0.5">Alerts dispatched to your registered phone number & in-app inbox</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <p className="p-6 text-center text-slate-400 text-sm">No notifications available</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`p-4 flex items-start justify-between gap-4 ${n.is_read ? 'bg-white' : 'bg-emerald-50/30'}`}>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{n.title}</h4>
                <p className="text-slate-600 text-xs mt-0.5">{n.message}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markAsRead(n.id)}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VolunteerNotifications;
