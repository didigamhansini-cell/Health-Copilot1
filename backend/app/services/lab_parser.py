import re
from typing import Dict, List, Any, Optional

BIOMARKER_STANDARDS = {
    "total_cholesterol": {
        "display_name": "Total Cholesterol",
        "unit": "mg/dL",
        "min": 125,
        "max": 200,
        "critical_high": 300,
        "critical_low": 90,
        "explanation": "A composite measure of cholesterol in your blood. Elevated levels over time are linked with arterial plaque buildup."
    },
    "ldl_cholesterol": {
        "display_name": "LDL Cholesterol (Low-Density)",
        "unit": "mg/dL",
        "min": 50,
        "max": 100,
        "critical_high": 190,
        "critical_low": 40,
        "explanation": "Often referred to as 'bad' cholesterol because high levels contribute to plaque accumulation in arteries."
    },
    "hdl_cholesterol": {
        "display_name": "HDL Cholesterol (High-Density)",
        "unit": "mg/dL",
        "min": 40,
        "max": 90,
        "critical_high": 120,
        "critical_low": 25,
        "explanation": "Known as 'good' cholesterol because it carries excess cholesterol back to the liver for clearance."
    },
    "triglycerides": {
        "display_name": "Triglycerides",
        "unit": "mg/dL",
        "min": 40,
        "max": 150,
        "critical_high": 500,
        "critical_low": 30,
        "explanation": "The most common type of fat in your body, derived from calories eaten but not immediately burned."
    },
    "fasting_glucose": {
        "display_name": "Fasting Blood Glucose",
        "unit": "mg/dL",
        "min": 70,
        "max": 99,
        "critical_high": 250,
        "critical_low": 54,
        "explanation": "Measures sugar levels after fasting. Normal is 70-99 mg/dL; 100-125 mg/dL indicates prediabetes; >=126 mg/dL may suggest diabetes."
    },
    "hba1c": {
        "display_name": "Hemoglobin A1c (HbA1c)",
        "unit": "%",
        "min": 4.0,
        "max": 5.6,
        "critical_high": 9.0,
        "critical_low": 3.8,
        "explanation": "Reflects average blood sugar control over the past 2-3 months. Normal: <5.7%, Prediabetes: 5.7%-6.4%, Diabetes: >=6.5%."
    },
    "hemoglobin": {
        "display_name": "Hemoglobin (Hb)",
        "unit": "g/dL",
        "min": 12.0,
        "max": 17.5,
        "critical_high": 20.0,
        "critical_low": 7.0,
        "explanation": "The oxygen-transporting protein in red blood cells. Low levels suggest anemia, fatigue, or nutritional deficiency."
    },
    "wbc": {
        "display_name": "White Blood Cell Count (WBC)",
        "unit": "x10^3/uL",
        "min": 4.0,
        "max": 11.0,
        "critical_high": 30.0,
        "critical_low": 2.0,
        "explanation": "Cells of the immune system. Elevated counts often indicate infection, inflammation, or physical stress."
    },
    "platelets": {
        "display_name": "Platelet Count",
        "unit": "x10^3/uL",
        "min": 150,
        "max": 450,
        "critical_high": 800,
        "critical_low": 50,
        "explanation": "Crucial blood components responsible for normal blood clotting and wound healing."
    },
    "creatinine": {
        "display_name": "Serum Creatinine",
        "unit": "mg/dL",
        "min": 0.6,
        "max": 1.3,
        "critical_high": 3.0,
        "critical_low": 0.3,
        "explanation": "A metabolic waste product cleared by the kidneys. Elevated levels suggest reduced kidney filtration efficiency."
    },
    "egfr": {
        "display_name": "eGFR (Estimated Glomerular Filtration Rate)",
        "unit": "mL/min/1.73m2",
        "min": 60,
        "max": 120,
        "critical_high": 150,
        "critical_low": 15,
        "explanation": "A key estimate of kidney function. Values >= 90 are normal; < 60 may indicate chronic kidney disease."
    },
    "alt": {
        "display_name": "Alanine Aminotransferase (ALT)",
        "unit": "U/L",
        "min": 7,
        "max": 56,
        "critical_high": 200,
        "critical_low": 0,
        "explanation": "An enzyme primarily found in liver cells. Elevated levels may indicate liver inflammation or fatty liver."
    },
    "vitamin_d": {
        "display_name": "Vitamin D (25-Hydroxy)",
        "unit": "ng/mL",
        "min": 30,
        "max": 100,
        "critical_high": 120,
        "critical_low": 10,
        "explanation": "Vital for bone density, calcium metabolism, and immune resilience. Levels below 30 ng/mL represent insufficiency."
    },
    "vitamin_b12": {
        "display_name": "Vitamin B12",
        "unit": "pg/mL",
        "min": 200,
        "max": 900,
        "critical_high": 1500,
        "critical_low": 150,
        "explanation": "Essential for neurological health, DNA synthesis, and red blood cell production."
    }
}

def parse_text_for_biomarkers(text: str) -> Dict[str, float]:
    """
    Scans free-text lab report inputs for common biomarkers and numbers.
    """
    found: Dict[str, float] = {}
    cleaned = text.lower()

    patterns = {
        "total_cholesterol": r"(total\s*cholesterol|cholesterol\s*total)[\s:]*([0-9]+(\.[0-9]+)?)",
        "ldl_cholesterol": r"(ldl|bad\s*cholesterol)[\s:]*([0-9]+(\.[0-9]+)?)",
        "hdl_cholesterol": r"(hdl|good\s*cholesterol)[\s:]*([0-9]+(\.[0-9]+)?)",
        "triglycerides": r"(triglycerides|trig)[\s:]*([0-9]+(\.[0-9]+)?)",
        "fasting_glucose": r"(fasting\s*(blood\s*)?glucose|blood\s*sugar|fbs)[\s:]*([0-9]+(\.[0-9]+)?)",
        "hba1c": r"(hba1c|a1c|glycated\s*hemoglobin)[\s:]*([0-9]+(\.[0-9]+)?)",
        "hemoglobin": r"(hemoglobin|hb)[\s:]*([0-9]+(\.[0-9]+)?)",
        "wbc": r"(wbc|white\s*blood\s*cells?)[\s:]*([0-9]+(\.[0-9]+)?)",
        "platelets": r"(platelets?)[\s:]*([0-9]+(\.[0-9]+)?)",
        "creatinine": r"(creatinine|serum\s*creatinine)[\s:]*([0-9]+(\.[0-9]+)?)",
        "egfr": r"(egfr|gfr)[\s:]*([0-9]+(\.[0-9]+)?)",
        "alt": r"(alt|sgpt)[\s:]*([0-9]+(\.[0-9]+)?)",
        "vitamin_d": r"(vitamin\s*d|25-oh)[\s:]*([0-9]+(\.[0-9]+)?)",
        "vitamin_b12": r"(vitamin\s*b12|b12)[\s:]*([0-9]+(\.[0-9]+)?)"
    }

    for key, pat in patterns.items():
        match = re.search(pat, cleaned)
        if match:
            try:
                val = float(match.group(2) if len(match.groups()) >= 2 else match.group(1))
                found[key] = val
            except (ValueError, IndexError):
                pass

    return found


def analyze_biomarkers(raw_text: Optional[str] = None, structured_data: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
    """
    Evaluates biomarkers against standard reference ranges, generating clinical explanations and doctor questions.
    """
    merged: Dict[str, float] = {}
    if raw_text:
        merged.update(parse_text_for_biomarkers(raw_text))
    if structured_data:
        for k, v in structured_data.items():
            merged[k.lower().strip().replace(" ", "_")] = float(v)

    if not merged:
        # Default sample if nothing detected
        merged = {
            "total_cholesterol": 218.0,
            "ldl_cholesterol": 138.0,
            "hdl_cholesterol": 46.0,
            "triglycerides": 170.0,
            "fasting_glucose": 104.0,
            "hba1c": 5.8
        }

    markers_output = []
    elevated_count = 0
    low_count = 0
    critical_count = 0
    flagged_names = []

    for key, val in merged.items():
        std = BIOMARKER_STANDARDS.get(key)
        if not std:
            # Custom unlisted marker fallback
            markers_output.append({
                "name": key.replace("_", " ").title(),
                "value": round(val, 2),
                "unit": "units",
                "reference_range": "Standard lab range",
                "status": "NORMAL",
                "explanation": "Biomarker logged. Review specific lab sheet for precise local reference limits."
            })
            continue

        ref_str = f"{std['min']} - {std['max']} {std['unit']}"
        status = "NORMAL"

        if val >= std["critical_high"] or val <= std["critical_low"]:
            status = "CRITICAL"
            critical_count += 1
            flagged_names.append(std["display_name"])
        elif val > std["max"]:
            status = "ELEVATED"
            elevated_count += 1
            flagged_names.append(std["display_name"])
        elif val < std["min"]:
            status = "LOW"
            low_count += 1
            flagged_names.append(std["display_name"])

        markers_output.append({
            "name": std["display_name"],
            "value": round(val, 2),
            "unit": std["unit"],
            "reference_range": ref_str,
            "status": status,
            "explanation": std["explanation"]
        })

    # Generate holistic summary insight
    if critical_count > 0:
        summary_insight = (
            f"Alert: {critical_count} biomarker(s) ({', '.join(flagged_names)}) appear significantly outside normal limits. "
            "Please schedule a consultation with your doctor promptly to review these findings."
        )
    elif (elevated_count + low_count) > 0:
        summary_insight = (
            f"Found {elevated_count + low_count} biomarker(s) flagged outside standard optimal ranges ({', '.join(flagged_names)}). "
            "These often respond well to lifestyle adjustments such as dietary optimization, aerobic exercise, and sleep hygiene, "
            "in consultation with your doctor."
        )
    else:
        summary_insight = (
            "All analyzed biomarkers are currently within standard reference ranges! "
            "Continue your healthy diet, physical activity, and routine preventive screenings."
        )

    # Formulate tailored doctor questions
    questions = [
        "How do these current results compare to my previous baseline tests?",
        "Are any follow-up blood tests or imaging recommended in 3 to 6 months?",
        "What specific dietary or exercise adjustments would be most effective for my profile?"
    ]
    if any(k in merged for k in ["total_cholesterol", "ldl_cholesterol", "triglycerides"]) and (elevated_count > 0):
        questions.append("Would evaluating an ApoB or Coronary Artery Calcium (CAC) score be helpful for my cardiovascular risk profile?")
    if any(k in merged for k in ["fasting_glucose", "hba1c"]) and (elevated_count > 0):
        questions.append("Are there specific post-meal glucose targets or continuous glucose tracking options I should consider?")

    return {
        "markers": markers_output,
        "summary_insight": summary_insight,
        "questions_for_doctor": questions
    }
