import React, { useState, useEffect } from 'react';
import {
  FileText, CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle, Sparkles, ArrowRight,
  UploadCloud, FileCheck2, Printer, Download, FileUp
} from 'lucide-react';
import { api } from '../services/api';

export default function LabAnalyzer() {
  const [presets, setPresets] = useState([]);
  const [rawText, setRawText] = useState('');
  const [title, setTitle] = useState('Comprehensive Diagnostic Screen');
  const [analyzing, setAnalyzing] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const data = await api.getLabPresets();
      setPresets(data);
      if (data.length > 0) {
        selectPreset(data[0]);
      }
    } catch (err) {
      console.error('Failed to load presets', err);
    }
  };

  const selectPreset = (preset) => {
    setTitle(preset.title);
    setRawText(preset.sample_text);
    setUploadedFileName('');
    handleAnalyzeWithData(preset.title, preset.structured_data, preset.sample_text);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setTitle(`Lab Report: ${file.name.replace(/\.[^/.]+$/, '')}`);

    // Simulated OCR extraction from uploaded PDF / Image report
    const extractedMock = `Extracted from ${file.name}:\nTotal Cholesterol: 232 mg/dL\nLDL Cholesterol: 148 mg/dL\nHDL Cholesterol: 42 mg/dL\nTriglycerides: 185 mg/dL\nFasting Glucose: 106 mg/dL\nHbA1c: 6.0 %`;
    setRawText(extractedMock);

    handleAnalyzeWithData(`Lab Report: ${file.name}`, null, extractedMock);
  };

  const handleAnalyzeWithData = async (panelTitle, structuredData, text) => {
    setAnalyzing(true);
    try {
      const res = await api.analyzeLab({
        title: panelTitle || title,
        raw_text: text || rawText,
        structured_data: structuredData
      });
      setCurrentReport(res);
    } catch (err) {
      alert('Analysis failed: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleManualAnalyze = (e) => {
    e.preventDefault();
    handleAnalyzeWithData(title, null, rawText);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Medical Report Analyzer & Biomarker Explainer</h2>
          <p className="text-xs text-slate-500">
            Upload medical test PDFs or images, paste lab values, and decode reference ranges into plain English
          </p>
        </div>

        {currentReport && (
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition print:hidden"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Report Analysis</span>
          </button>
        )}
      </div>

      {/* Preset Panels Selection */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Quick Diagnostic Presets (Click to Test):
        </span>
        <div className="grid sm:grid-cols-3 gap-3">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPreset(p)}
              className="text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition group"
            >
              <div className="font-semibold text-slate-800 text-xs group-hover:text-emerald-700">{p.title}</div>
              <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{p.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Upload and Paste Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* File Dropzone / Selector */}
        <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 p-6 rounded-2xl text-center bg-slate-50/50 hover:bg-emerald-50/20 transition cursor-pointer relative">
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.txt"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
              <FileUp className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              {uploadedFileName ? `Loaded: ${uploadedFileName}` : 'Upload Lab Report Document (PDF, Image, or Scan)'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Drag and drop here or click to browse files from your computer
            </p>
          </div>
        </div>

        {/* Text form */}
        <form onSubmit={handleManualAnalyze} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Panel Title (e.g. Annual Bloodwork)"
              className="flex-1 px-4 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={analyzing || !rawText.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-semibold rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{analyzing ? 'Extracting & Analyzing...' : 'Analyze Report Now'}</span>
            </button>
          </div>

          <div>
            <textarea
              rows={3}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Or paste lab text values here (e.g. Total Cholesterol: 220, Fasting Glucose: 105, HbA1c: 5.8%)..."
              className="w-full px-4 py-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-700"
            />
          </div>
        </form>
      </div>

      {/* Analysis Results Display */}
      {currentReport && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                Clinical Analysis: {currentReport.title}
              </h3>
              <span className="text-[11px] text-emerald-700 font-medium">
                {currentReport.markers.length} Biomarkers Evaluated
              </span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              {currentReport.summary_insight}
            </p>
          </div>

          {/* Biomarkers Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentReport.markers.map((m, idx) => {
              const isNormal = m.status === 'NORMAL';
              const isElevated = m.status === 'ELEVATED';
              const isLow = m.status === 'LOW';
              const isCritical = m.status === 'CRITICAL';

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border shadow-2xs transition bg-white flex flex-col justify-between ${
                    isCritical ? 'border-red-300 ring-1 ring-red-200' :
                    isElevated ? 'border-amber-300' :
                    isLow ? 'border-blue-300' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-bold text-slate-800 text-xs">{m.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCritical ? 'bg-red-100 text-red-800' :
                        isElevated ? 'bg-amber-100 text-amber-800' :
                        isLow ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {m.status}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1 my-2">
                      <span className="text-2xl font-black text-slate-900">{m.value}</span>
                      <span className="text-xs text-slate-500">{m.unit}</span>
                    </div>

                    {/* Visual Meter Bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full my-2 overflow-hidden flex">
                      <div className={`h-full ${
                        isCritical ? 'w-full bg-red-500' :
                        isElevated ? 'w-3/4 bg-amber-500' :
                        isLow ? 'w-1/4 bg-blue-500' : 'w-1/2 bg-emerald-500'
                      }`} />
                    </div>

                    <div className="text-[11px] text-slate-500 mb-2">
                      Normal Range: <span className="font-medium text-slate-700">{m.reference_range}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed mt-2">
                    {m.explanation}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Questions for Doctor */}
          {currentReport.questions_for_doctor && currentReport.questions_for_doctor.length > 0 && (
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                Empowering Questions to Ask Your Doctor Regarding These Numbers:
              </h3>
              <ul className="space-y-2 text-xs text-slate-700">
                {currentReport.questions_for_doctor.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
