# AI-Powered Personal Health Copilot

An intelligent, safety-first personal health copilot and clinical wellness dashboard. It empowers users to monitor their vitals, explore symptoms, decode complex laboratory bloodwork, schedule medications with interaction alerts, and generate physician-ready visit summaries.

---

## ⚠️ Medical Safety Guardrails & Disclaimers
- **Non-Diagnostic Notice**: This application provides educational health insights, lifestyle recommendations, and biomarker context only. It **does not claim to diagnose diseases**, prescribe medication, or provide formal clinical diagnoses.
- **Automated Emergency Triage**: Built-in clinical algorithms scan for acute red flags (e.g. acute coronary syndromes, FAST stroke signs, respiratory distress, anaphylaxis, crisis distress). When detected, the application immediately diverts to emergency protocols, instructing the user to contact local emergency services (**112 / 911**).

---

## Key Features

1. **AI Conversational Health Copilot**
   - Contextual health dialogue remembering age, chronic conditions, and allergies.
   - Dual-engine: Works 100% offline using a built-in clinical intelligence knowledge base, or seamlessly with Google Gemini / OpenAI when an API key is provided.
   - Clinical triage indicators (Routine, Urgent, Emergency) and suggested follow-up queries.

2. **Vitals & Biomarkers Dashboard**
   - Track Blood Pressure, Resting Heart Rate, Fasting Blood Glucose, SpO2, Sleep Duration, and Daily Steps.
   - Interactive trend lines (Recharts) with standard physiological reference intervals.
   - Automatic anomaly detection highlighting deviations.

3. **Lab Report Analyzer & Biomarker Explainer**
   - Pre-loaded panels (Lipid Panel, Metabolic Screen, CBC) or paste custom lab text.
   - Evaluates each biomarker (NORMAL, ELEVATED, LOW, CRITICAL).
   - Translates laboratory jargon into clear, actionable explanations and formulates smart doctor questions.

4. **Medications & Supplement Log with Drug Interaction Checker**
   - Daily pill schedule with adherence logging.
   - Real-time cross-referencing against known drug and supplement interaction patterns (e.g. Aspirin + Ibuprofen, Statins + Grapefruit, Metformin + Alcohol).

5. **Physician Visit Summary Brief**
   - Generates a structured 1-page clinical visit report.
   - Print or save as PDF with one click.

---

## Tech Stack
- **Backend**: Python 3.15, FastAPI, Uvicorn, SQLite, SQLAlchemy, Pydantic V2, Pytest.
- **Frontend**: Node.js, React 19, Vite, Tailwind CSS, Lucide React, Recharts.

---

## Quick Start Guide

### Option 1: One-Click Launch (Recommended for Windows)
Double-click `start_all.bat` or run in terminal:
```powershell
.\start_all.bat
```
This automatically starts both the FastAPI backend (`http://127.0.0.1:8000`) and the React dashboard (`http://localhost:5173`).

---

### Option 2: Running Components Individually

#### 1. Backend (FastAPI)
```powershell
cd backend
.\venv\Scripts\activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`

#### 2. Frontend (React + Vite)
```powershell
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`

---

## Running Automated Tests
To run the automated clinical triage and API test suite:
```powershell
cd backend
.\venv\Scripts\activate
pytest -v
```
All 12 unit and integration tests will verify triage guardrails, vitals persistence, and lab parsing.
