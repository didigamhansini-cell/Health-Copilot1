import React, { useState, useEffect } from 'react';
import { Printer, RefreshCw, Heart, AlertCircle, FileCheck, CheckCircle2, Shield } from 'lucide-react';
import { api } from '../services/api';

export default function DoctorSummary() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await api.getDoctorReport();
      setReport(data);
    } catch (err) {
      console.error('Failed to load doctor report', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-emerald-600" />
        Compiling clinical health summary...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center p-12 text-slate-400 text-xs">
        Failed to generate summary. Please check backend connection.
      </div>
    );
  }

  const v = report.vital_signs_summary || {};

  return (
    <div className="space-y-6">
      {/* Top action header (hidden during printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Doctor Visit Summary Brief</h2>
          <p className="text-xs text-slate-500">
            Exportable clinical snapshot aggregating recent vitals, active regimens, and questions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadReport}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition"
          >
            Refresh
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Clinical Sheet */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b pb-4 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                Clinical Brief
              </span>
              <h1 className="text-lg font-black text-slate-900">Patient Health Summary & Discussion Plan</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">Generated: {report.generated_at}</p>
          </div>

          <div className="text-right text-xs">
            <p className="font-bold text-slate-900">{report.patient_name}</p>
            <p className="text-slate-500">Age: {report.patient_age} years</p>
          </div>
        </div>

        {/* Patient Profile & Allergies */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div>
            <span className="font-semibold text-slate-500 block">Documented Allergies:</span>
            <span className="font-bold text-rose-700">{report.known_allergies || 'None documented'}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block">Chronic Conditions / Baseline:</span>
            <span className="font-bold text-slate-800">{report.chronic_conditions || 'None'}</span>
          </div>
        </div>

        {/* Vital Signs Overview */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b pb-1">
            Recent Vital Signs Summary ({v.record_count || 0} Logs Analyzed)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border">
              <span className="text-slate-400 block text-[11px]">Latest Blood Pressure</span>
              <span className="text-base font-bold text-slate-800">
                {v.latest_systolic_bp || '--'}/{v.latest_diastolic_bp || '--'} mmHg
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Avg: {v.avg_systolic_bp || '--'}/{v.avg_diastolic_bp || '--'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border">
              <span className="text-slate-400 block text-[11px]">Latest Heart Rate</span>
              <span className="text-base font-bold text-slate-800">{v.latest_heart_rate || '--'} bpm</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Resting pulse</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border">
              <span className="text-slate-400 block text-[11px]">Latest Blood Glucose</span>
              <span className="text-base font-bold text-slate-800">{v.latest_blood_glucose || '--'} mg/dL</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Fasting</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border">
              <span className="text-slate-400 block text-[11px]">Avg Sleep Duration</span>
              <span className="text-base font-bold text-slate-800">{v.avg_sleep_hours || '--'} hrs</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Per night</span>
            </div>
          </div>
        </div>

        {/* Flagged Anomalies */}
        {report.recent_anomalies_or_concerns && report.recent_anomalies_or_concerns.length > 0 && (
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
            <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Noted Physiological Deviations to Review:
            </h3>
            <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
              {report.recent_anomalies_or_concerns.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Active Medications List */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b pb-1">
            Current Active Medications & Supplements
          </h3>
          {report.active_medications && report.active_medications.length > 0 ? (
            <div className="border rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-slate-600 font-semibold">
                  <tr>
                    <th className="p-2.5">Medication</th>
                    <th className="p-2.5">Dosage</th>
                    <th className="p-2.5">Frequency</th>
                    <th className="p-2.5">Indication</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.active_medications.map((m, i) => (
                    <tr key={i}>
                      <td className="p-2.5 font-bold text-slate-800">{m.name}</td>
                      <td className="p-2.5">{m.dosage}</td>
                      <td className="p-2.5">{m.frequency}</td>
                      <td className="p-2.5 text-slate-600">{m.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No active medications logged.</p>
          )}
        </div>

        {/* Prepared Questions */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b pb-1">
            Suggested Consultation Agenda for Physician
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {report.questions_to_discuss?.map((q, i) => (
              <li key={i} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="font-bold text-emerald-600">•</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Medical Non-Diagnostic Disclaimer */}
        <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 leading-relaxed">
          {report.disclaimer}
        </div>
      </div>
    </div>
  );
}
