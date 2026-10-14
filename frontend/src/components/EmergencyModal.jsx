import React from 'react';
import { AlertOctagon, Phone, X, ShieldAlert, HeartPulse } from 'lucide-react';

export default function EmergencyModal({ isOpen, onClose, profile }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-200">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Emergency Guidance (SOS)</h2>
              <p className="text-xs text-red-600 font-semibold uppercase tracking-wider">Immediate Life-Safety Protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Call Emergency Services Immediately if you experience:
            </h3>
            <ul className="mt-2 text-xs text-red-700 space-y-1.5 list-disc list-inside">
              <li>Crushing or radiating chest pain, pressure, or shortness of breath.</li>
              <li>Sudden facial drooping, arm weakness, or slurred speech (FAST stroke signs).</li>
              <li>Throat swelling, difficulty swallowing, or sudden severe allergic reaction.</li>
              <li>Uncontrolled heavy bleeding or sudden loss of consciousness.</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              href="tel:112"
              className="flex flex-col items-center justify-center p-4 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow transition text-center font-bold"
            >
              <Phone className="w-6 h-6 mb-1" />
              <span>Call 112</span>
              <span className="text-[11px] font-normal opacity-90">National Emergency</span>
            </a>
            <a
              href="tel:911"
              className="flex flex-col items-center justify-center p-4 bg-rose-700 hover:bg-rose-800 text-white rounded-xl shadow transition text-center font-bold"
            >
              <Phone className="w-6 h-6 mb-1" />
              <span>Call 911</span>
              <span className="text-[11px] font-normal opacity-90">US / Canada Emergency</span>
            </a>
          </div>

          {profile && (
            <div className="p-3 bg-slate-50 border rounded-xl text-xs space-y-1">
              <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                Personal Emergency Contact:
              </p>
              <p className="text-slate-600">
                <span className="font-medium">{profile.emergency_contact_name || 'Designated Contact'}</span>: {profile.emergency_contact_phone || '112'}
              </p>
            </div>
          )}

          <div className="text-[11px] text-slate-500 text-center">
            Do not wait for AI responses during critical emergencies. Keep calm and contact first responders.
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
          >
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
}
