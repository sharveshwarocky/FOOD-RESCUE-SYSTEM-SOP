import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Bell, Check } from 'lucide-react';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg relative transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          <div className="p-3 px-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm">Notifications</h4>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
              {unreadCount} New
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-xs text-slate-400">No notifications available</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 text-xs transition-colors flex items-start gap-3 ${
                    n.is_read ? 'bg-white opacity-70' : 'bg-emerald-50/40'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{n.title}</p>
                    <p className="text-slate-600 mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      title="Mark as read"
                      className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-md"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
