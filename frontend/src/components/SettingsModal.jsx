import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, Check, ShieldCheck } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('auto');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('HEALTH_COPILOT_API_KEY') || '';
    const storedProvider = localStorage.getItem('HEALTH_COPILOT_PROVIDER') || 'auto';
    setApiKey(storedKey);
    setProvider(storedProvider);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('HEALTH_COPILOT_API_KEY', apiKey.trim());
    localStorage.setItem('HEALTH_COPILOT_PROVIDER', provider);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">AI Engine Settings</h2>
              <p className="text-xs text-slate-500">Configure LLM providers or use offline engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">AI Intelligence Mode</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="auto">Automatic (Gemini / OpenAI with Offline Fallback)</option>
              <option value="gemini">Google Gemini (Requires API Key)</option>
              <option value="openai">OpenAI (Requires API Key)</option>
              <option value="offline">Clinical Knowledge Engine (100% Offline / No Key Needed)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Custom API Key (Optional)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter AIza... (Gemini) or sk-... (OpenAI)"
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
            />
            <p className="mt-1.5 text-[11px] text-slate-500">
              Leave blank to automatically use the built-in clinical triage and educational reasoning engine.
            </p>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-800 text-[11px]">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Your keys remain stored locally in your browser session and are never logged or stored remotely.
            </span>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow transition"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" /> Saved!
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
