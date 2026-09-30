import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AppContext } from '../context/AppContext';
import NotificationBell from './NotificationBell';
import { Menu, LogOut, ShieldCheck, HeartHandshake, Building2, Truck, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { toggleSidebar } = useContext(AppContext);

  const getRoleBadge = (role) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full"><ShieldCheck className="w-3 h-3" /> Admin</span>;
      case 'DONOR':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full"><HeartHandshake className="w-3 h-3" /> Donor</span>;
      case 'NGO':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"><Building2 className="w-3 h-3" /> NGO</span>;
      case 'VOLUNTEER':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"><Truck className="w-3 h-3" /> Volunteer</span>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-emerald-200">
              FR
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">Food Rescue System</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Zero Waste, Zero Hunger</p>
            </div>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-slate-800 leading-none">{user.username}</p>
                <div className="mt-1">{getRoleBadge(user.role)}</div>
              </div>
              <div className="w-9 h-9 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center border border-slate-200 font-semibold">
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
