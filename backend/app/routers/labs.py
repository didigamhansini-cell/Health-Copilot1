import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import LabReport, User
from app.schemas import LabAnalyzeRequest, LabReportResponse
from app.services.lab_parser import analyze_biomarkers
from app.routers.auth import get_current_user_obj

router = APIRouter(prefix="/api/labs", tags=["Lab Reports & Biomarkers"])

PRESET_PANELS = [
    {
        "id": "lipid_borderline",
        "title": "Annual Lipid Profile (Borderline)",
        "panel_type": "Lipid & Cardiovascular Panel",
        "description": "Standard lipid panel showing slightly elevated LDL and triglycerides.",
        "sample_text": "Total Cholesterol: 224 mg/dL\nLDL Cholesterol: 142 mg/dL\nHDL Cholesterol: 48 mg/dL\nTriglycerides: 178 mg/dL",
        "structured_data": {
            "total_cholesterol": 224.0,
            "ldl_cholesterol": 142.0,
            "hdl_cholesterol": 48.0,
            "triglycerides": 178.0
        }
    },
    {
        "id": "metabolic_glucose",
        "title": "Metabolic & Blood Glucose Screen",
        "panel_type": "Metabolic & Glycemic Profile",
        "description": "Fasting blood sugar and HbA1c screening for metabolic evaluation.",
        "sample_text": "Fasting Glucose: 108 mg/dL\nHbA1c: 5.9 %\nCreatinine: 0.95 mg/dL\neGFR: 98 mL/min",
        "structured_data": {
            "fasting_glucose": 108.0,
            "hba1c": 5.9,
            "creatinine": 0.95,
            "egfr": 98.0
        }
    },
    {
        "id": "cbc_wellness",
        "title": "Complete Blood Count (CBC)",
        "panel_type": "Hematology Panel",
        "description": "Standard blood count evaluating hemoglobin, white blood cells, and platelets.",
        "sample_text": "Hemoglobin: 14.1 g/dL\nWBC: 6.8 x10^3/uL\nPlatelets: 280 x10^3/uL",
        "structured_data": {
            "hemoglobin": 14.1,
            "wbc": 6.8,
            "platelets": 280.0
        }
    }
]

@router.get("/presets")
def get_lab_presets():
    """Returns sample pre-formatted lab report templates for quick testing."""
    return PRESET_PANELS

@router.post("/analyze", response_model=LabReportResponse)
def analyze_lab_report(req: LabAnalyzeRequest, user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """
    Parses lab test inputs against reference ranges, provides biomarker explanations,
    formulates doctor questions, and saves results strictly for the authenticated user.
    """
    analysis = analyze_biomarkers(raw_text=req.raw_text, structured_data=req.structured_data)

    report_db = LabReport(
        user_id=user.id,
        title=req.title,
        test_date=req.test_date or "Recent",
        panel_type=req.panel_type,
        notes=req.raw_text or "Structured biomarker evaluation",
        results_json=json.dumps(analysis)
    )
    db.add(report_db)
    db.commit()
    db.refresh(report_db)

    return {
        "id": report_db.id,
        "title": report_db.title,
        "test_date": report_db.test_date,
        "panel_type": report_db.panel_type,
        "markers": analysis["markers"],
        "summary_insight": analysis["summary_insight"],
        "questions_for_doctor": analysis["questions_for_doctor"],
        "created_at": report_db.created_at
    }

@router.get("", response_model=List[LabReportResponse])
def list_lab_reports(user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """List historical lab reports analyzed strictly by the authenticated user."""
    reports = db.query(LabReport).filter(LabReport.user_id == user.id).order_by(LabReport.created_at.desc()).all()
    results = []
    for r in reports:
        try:
            parsed = json.loads(r.results_json)
            results.append({
                "id": r.id,
                "title": r.title,
                "test_date": r.test_date,
                "panel_type": r.panel_type,
                "markers": parsed.get("markers", []),
                "summary_insight": parsed.get("summary_insight", ""),
                "questions_for_doctor": parsed.get("questions_for_doctor", []),
                "created_at": r.created_at
            })
        except Exception:
            continue
    return results
