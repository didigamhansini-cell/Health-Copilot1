import React, { useState, useEffect } from 'react';
import { Pill, Plus, Check, Clock, AlertTriangle, ShieldAlert, Trash2, X, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function MedicationLog() {
  const [meds, setMeds] = useState([]);
  const [interactions, setInteractions] = useState({ total_active: 0, has_interactions: false, interactions: [] });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    dosage: '10mg',
    frequency: 'Once daily',
    schedule_time: '08:00 AM',
    purpose: 'General health',
    instructions: 'Take after meal with water'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    setLoading(true);
    try {
      const data = await api.getMedications();
      setMeds(data);
      const interData = await api.checkInteractions();
      setInteractions(interData);
    } catch (err) {
      console.error('Failed to load medications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMed = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.addMedication(form);
      setShowAddModal(false);
      setForm({
        name: '',
        dosage: '10mg',
        frequency: 'Once daily',
        schedule_time: '08:00 AM',
        purpose: 'General health',
        instructions: 'Take after meal with water'
      });
      await loadMedications();
    } catch (err) {
      alert('Failed to add medication: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTakeDose = async (id) => {
    try {
      await api.takeMedication(id);
      await loadMedications();
    } catch (err) {
      alert('Failed to mark taken: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this medication from your active list?')) {
      try {
        await api.deleteMedication(id);
        await loadMedications();
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Medications & Supplements Schedule</h2>
          <p className="text-xs text-slate-500">
            Monitor daily doses, adherence timestamps, and automatic drug-supplement interactions
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medication</span>
        </button>
      </div>

      {/* Drug Interactions Card */}
      {interactions.has_interactions && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-red-900">
            <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
            <span>Potential Medication Interaction Detected:</span>
          </div>

          <div className="space-y-2">
            {interactions.interactions.map((item, idx) => (
              <div key={idx} className="p-3 bg-white rounded-xl border border-red-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-red-800">
                    {item.medications_involved.join(' + ')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700">
                    {item.severity} Severity
                  </span>
                </div>
                <p className="text-slate-700 text-[11px] mb-1.5">{item.description}</p>
                <p className="text-red-700 font-medium text-[11px] bg-red-50 p-2 rounded-lg">
                  Clinical Action: {item.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medications Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {meds.map((m) => {
          const isTakenToday = m.last_taken_at && (
            new Date(m.last_taken_at).toDateString() === new Date().toDateString()
          );

          return (
            <div
              key={m.id}
              className={`p-4 rounded-2xl border bg-white shadow-2xs transition flex flex-col justify-between ${
                isTakenToday ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-xs">{m.name}</h3>
                      <span className="text-[11px] text-slate-400 font-medium">{m.dosage}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-slate-300 hover:text-red-500 p-1 rounded transition"
                    title="Remove medication"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 my-3 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{m.frequency} • {m.schedule_time}</span>
                  </div>
                  <div className="text-slate-700">
                    <span className="font-semibold">Indication:</span> {m.purpose}
                  </div>
                  <div className="text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px]">
                    {m.instructions}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleTakeDose(m.id)}
                  disabled={isTakenToday}
                  className={`w-full py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition ${
                    isTakenToday
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isTakenToday ? 'Taken Today' : 'Log Taken Dose'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-600" /> Add Medication or Supplement
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMed} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medication Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Metformin or Vitamin D"
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    value={form.dosage}
                    onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                    placeholder="e.g. 500mg"
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="As needed (PRN)">As needed (PRN)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Schedule Time</label>
                  <input
                    type="text"
                    value={form.schedule_time}
                    onChange={(e) => setForm({ ...form, schedule_time: e.target.value })}
                    placeholder="e.g. 08:00 AM"
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purpose / Indication</label>
                <input
                  type="text"
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  placeholder="e.g. Blood pressure or Bone health"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Special Instructions</label>
                <input
                  type="text"
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  placeholder="e.g. Take with breakfast"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow"
                >
                  {saving ? 'Adding...' : 'Add Medication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
