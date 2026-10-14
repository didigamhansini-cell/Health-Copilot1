import React from 'react';
import { AlertTriangle, PhoneCall, ShieldCheck } from 'lucide-react';

export default function DisclaimerBanner({ onOpenEmergencyModal }) {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span className="font-semibold text-emerald-800">Health Copilot Safety Standard:</span>
        <span className="text-amber-800">
          This system provides non-diagnostic educational information only. Always consult a licensed healthcare professional for medical diagnoses.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenEmergencyModal}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full shadow-sm transition-all"
        >
          <PhoneCall className="w-3 h-3 animate-pulse" />
          <span>Emergency SOS (112 / 911)</span>
        </button>
      </div>
    </div>
  );
}
