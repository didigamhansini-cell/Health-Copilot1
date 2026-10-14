import React from 'react';
import {
  HeartPulse, Bot, Activity, FileText, Pill, FileCheck, Settings, User, LogOut, Ticket
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  profile,
  currentUser,
  onLogout,
  onOpenProfile,
  onOpenSettings,
  onOpenEmergency
}) {
  const tabs = [
    { id: 'chat', label: 'AI Health Copilot', icon: Bot },
    { id: 'appointments', label: 'Doctor Tokens', icon: Ticket },
    { id: 'vitals', label: 'Vitals & Trends', icon: Activity },
    { id: 'labs', label: 'Report Analyzer', icon: FileText },
    { id: 'meds', label: 'Medications', icon: Pill },
    { id: 'summary', label: 'Doctor Summary', icon: FileCheck },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-sm">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
              Health<span className="text-emerald-600">Copilot</span>
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Clinical Portal
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* User profile button */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-xs"
            title="Edit health profile"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px]">
              {currentUser?.name ? currentUser.name[0].toUpperCase() : (profile?.name ? profile.name[0].toUpperCase() : 'U')}
            </div>
            <div className="hidden lg:block text-left">
              <span className="font-bold text-slate-800 block text-[11px] leading-tight">
                {currentUser?.name || profile?.name || 'User'}
              </span>
              <span className="text-[10px] text-slate-400">
                {profile?.age || 32}y • {profile?.blood_type || 'O+'}
              </span>
            </div>
          </button>

          {/* Engine Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
            title="AI Engine Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Logout button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="flex md:hidden overflow-x-auto border-t border-slate-100 bg-slate-50/70 px-2 py-1 gap-1 text-xs no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold ${
                isActive ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
