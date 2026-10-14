import React, { useState, useEffect } from 'react';
import {
  Activity, Heart, Droplet, Moon, Footprints, AlertTriangle, Plus, Trash2, Calendar, TrendingUp, X, Check
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api } from '../services/api';

export default function VitalsTracker() {
  const [data, setData] = useState({ recent_records: [], averages: {}, status_flags: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    systolic_bp: 120,
    diastolic_bp: 80,
    heart_rate: 72,
    blood_glucose: 95,
    spo2: 98,
    sleep_hours: 7.5,
    steps: 8000,
    water_ml: 2000,
    stress_level: 3,
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVitals();
  }, []);

  const fetchVitals = async () => {
    setLoading(true);
    try {
      const res = await api.getVitals();
      setData(res);
    } catch (err) {
      console.error('Failed to fetch vitals', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVital = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.logVital(form);
      setShowModal(false);
      await fetchVitals();
    } catch (err) {
      alert('Failed to log vital: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this vital sign record?')) {
      try {
        await api.deleteVital(id);
        await fetchVitals();
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    }
  };

  // Prepare chart series
  const chartData = (data.recent_records || []).map((r, i) => {
    const d = new Date(r.timestamp);
    const dateLabel = isNaN(d) ? `Day ${i + 1}` : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return {
      date: dateLabel,
      systolic: r.systolic_bp,
      diastolic: r.diastolic_bp,
      glucose: r.blood_glucose,
      heartRate: r.heart_rate,
      sleep: r.sleep_hours
    };
  });

  const latest = data.recent_records && data.recent_records.length > 0
    ? data.recent_records[data.recent_records.length - 1]
    : null;

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Vitals & Biomarkers Dashboard</h2>
          <p className="text-xs text-slate-500">Track daily physiological trends and detect deviations</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Vitals</span>
        </button>
      </div>

      {/* Anomaly Alerts */}
      {data.status_flags && data.status_flags.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Biomarker Trend Alerts:</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 text-xs text-amber-800">
            {data.status_flags.map((flag, idx) => (
              <div key={idx} className="flex items-start gap-1.5 bg-white/70 p-2 rounded-lg border border-amber-200">
                <span className="text-amber-600 font-bold">•</span>
                <span>{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Blood Pressure */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Blood Pressure</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">
              {latest?.systolic_bp || '--'}/{latest?.diastolic_bp || '--'}
            </span>
            <span className="text-xs text-slate-400">mmHg</span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-500">
            Avg: {data.averages?.systolic_bp || '--'}/{data.averages?.diastolic_bp || '--'} mmHg
          </p>
        </div>

        {/* Heart Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Resting Pulse</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">{latest?.heart_rate || '--'}</span>
            <span className="text-xs text-slate-400">bpm</span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-500">
            Normal: 60 - 100 bpm
          </p>
        </div>

        {/* Glucose */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Blood Glucose</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">{latest?.blood_glucose || '--'}</span>
            <span className="text-xs text-slate-400">mg/dL</span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-500">
            Target Fasting: 70 - 99 mg/dL
          </p>
        </div>

        {/* Sleep */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Sleep Duration</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">{latest?.sleep_hours || '--'}</span>
            <span className="text-xs text-slate-400">hrs</span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-500">
            Goal: 7 - 9 hrs/night
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Blood Pressure Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-500" /> Blood Pressure Trends
              </h3>
              <p className="text-[11px] text-slate-400">Systolic & Diastolic over recent logs</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[60, 160]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="systolic" name="Systolic (mmHg)" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="diastolic" name="Diastolic (mmHg)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Glucose & Heart Rate Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Glucose & Pulse Trends
              </h3>
              <p className="text-[11px] text-slate-400">Glycemic regulation and resting pulse</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[50, 140]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="glucose" name="Glucose (mg/dL)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="heartRate" name="Heart Rate (bpm)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Recent Vital Sign Records</h3>
          <span className="text-xs text-slate-400">{data.recent_records?.length || 0} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">BP (mmHg)</th>
                <th className="p-3">Pulse (bpm)</th>
                <th className="p-3">Glucose</th>
                <th className="p-3">SpO2</th>
                <th className="p-3">Sleep</th>
                <th className="p-3">Notes</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recent_records?.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-medium text-slate-700">
                    {new Date(r.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3 font-semibold text-slate-800">{r.systolic_bp}/{r.diastolic_bp}</td>
                  <td className="p-3">{r.heart_rate}</td>
                  <td className="p-3">{r.blood_glucose} mg/dL</td>
                  <td className="p-3">{r.spo2}%</td>
                  <td className="p-3">{r.sleep_hours}h</td>
                  <td className="p-3 text-slate-500 max-w-xs truncate">{r.notes || '-'}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Vital Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" /> Log Today's Vitals
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVital} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={form.systolic_bp}
                    onChange={(e) => setForm({ ...form, systolic_bp: parseInt(e.target.value) || 0 })}
                    placeholder="120"
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={form.diastolic_bp}
                    onChange={(e) => setForm({ ...form, diastolic_bp: parseInt(e.target.value) || 0 })}
                    placeholder="80"
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pulse (Heart Rate bpm)</label>
                  <input
                    type="number"
                    value={form.heart_rate}
                    onChange={(e) => setForm({ ...form, heart_rate: parseInt(e.target.value) || 0 })}
                    placeholder="72"
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Blood Glucose (mg/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.blood_glucose}
                    onChange={(e) => setForm({ ...form, blood_glucose: parseFloat(e.target.value) || 0 })}
                    placeholder="95.0"
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SpO2 Oxygen (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.spo2}
                    onChange={(e) => setForm({ ...form, spo2: parseFloat(e.target.value) || 0 })}
                    placeholder="98.0"
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sleep Duration (hrs)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.sleep_hours}
                    onChange={(e) => setForm({ ...form, sleep_hours: parseFloat(e.target.value) || 0 })}
                    placeholder="7.5"
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Notes or Symptoms</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Taken 30 mins after waking; slight morning stiffness"
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow"
                >
                  {saving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
