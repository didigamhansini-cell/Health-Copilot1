import re
from typing import Dict, Any

MEDICAL_DISCLAIMER = (
    "⚠️ Medical Safety Notice: This AI Personal Health Copilot provides educational wellness "
    "information, biomarker context, and lifestyle guidance only. It DOES NOT provide medical "
    "diagnoses, clinical treatment, or prescriptions. Always consult a qualified physician or "
    "healthcare provider for medical concerns. In an emergency, call your local emergency services (112 / 911) immediately."
)

# Emergency Red Flag Rules (High Priority)
RED_FLAG_PATTERNS = [
    {
        "pattern": r"(chest\s+(pain|pressure|tightness|tight|discomfort|crushing)|crushing\s+chest|(pain|tightness|pressure|ache)\s+radiating\s+to\s+(left\s+arm|the\s+arm|arm|jaw|neck|back|shoulder)|heart\s+attack)",
        "flag": "Possible Acute Coronary Syndrome / Heart Attack Alert",
        "instructions": (
            "🚨 CRITICAL EMERGENCY: Your symptoms could indicate a serious cardiovascular emergency. "
            "Please STOP all physical exertion immediately, sit down, and CALL 112 or 911 (or have someone call for you). "
            "Do not drive yourself to the hospital. If you are alone, unlock your front door so emergency responders can enter."
        )
    },
    {
        "pattern": r"(facial\s+droop|slurred\s+speech|arm\s+weakness|sudden\s+numbness\s+on\s+one\s+side|loss\s+of\s+speech|fast\s+symptoms)",
        "flag": "Potential Stroke Warning Signs (FAST)",
        "instructions": (
            "🚨 CRITICAL EMERGENCY: These are classic signs of a potential stroke (Face drooping, Arm weakness, Speech difficulty). "
            "TIME IS BRAIN. Call 112 / 911 immediately. Note the exact time symptoms started for the medical team."
        )
    },
    {
        "pattern": r"(can('?t|not)\s+breathe|severe\s+shortness\s+of\s+breath|lips\s+turning\s+blue|suffocating|choking|gasping\s+for\s+air)",
        "flag": "Severe Respiratory Distress",
        "instructions": (
            "🚨 CRITICAL EMERGENCY: Inability to breathe adequately requires immediate emergency resuscitation. "
            "Sit upright, stay as calm as possible, and call 112 / 911 immediately."
        )
    },
    {
        "pattern": r"(throat\s+closing|anaphylaxis|swollen\s+tongue|severe\s+allergic\s+reaction|cannot\s+swallow)",
        "flag": "Severe Allergic Reaction / Anaphylaxis",
        "instructions": (
            "🚨 CRITICAL EMERGENCY: If you have an Epinephrine Auto-Injector (EpiPen), administer it immediately into the outer thigh. "
            "Call 112 / 911 without delay."
        )
    },
    {
        "pattern": r"(kill\s+myself|suicid(e|al)|end\s+my\s+life|want\s+to\s+die|harm\s+myself)",
        "flag": "Mental Health & Crisis Intervention",
        "instructions": (
            "💙 You are not alone, and help is available right now. Please reach out immediately:\n"
            "- India: 9152987821 (Vandrevala Foundation) or 112 / 14416 (Tele-MANAS)\n"
            "- USA/Canada: Call or text 988 (Suicide & Crisis Lifeline)\n"
            "- UK: 111 or text SHOUT to 85258\n"
            "- International: Contact your nearest emergency medical center or trusted loved one."
        )
    },
    {
        "pattern": r"(vomiting\s+blood|coughing\s+up\s+blood|uncontrolled\s+bleeding|passed\s+out|lost\s+consciousness|blacked\s+out)",
        "flag": "Acute Hemorrhage / Syncope Warning",
        "instructions": (
            "🚨 EMERGENCY: Significant internal/external bleeding or sudden loss of consciousness warrants urgent emergency evaluation. "
            "Contact emergency medical services (112 / 911) promptly."
        )
    }
]

# Urgent / Yellow Flag Patterns (Needs prompt medical attention, but non-immediate crash)
URGENT_PATTERNS = [
    {
        "pattern": r"(fever\s+(over|above|>)\s+(103|104|40)|high\s+fever\s+for\s+(3|4|5|several)\s+days)",
        "flag": "High Persistent Pyrexia / Fever Alert",
        "instructions": "⚠️ Urgent: High persistent fever requires medical evaluation. Stay hydrated, use fever-reducers only as advised by your physician, and visit an urgent care center or doctor today."
    },
    {
        "pattern": r"(severe\s+abdominal\s+pain|sharp\s+lower\s+right\s+stomach\s+pain|appendix)",
        "flag": "Acute Abdominal Evaluation Needed",
        "instructions": "⚠️ Urgent: Severe or localized abdominal pain could signify appendicitis, gallstones, or an infection. Avoid eating or taking heavy pain relievers until examined by a healthcare provider."
    },
    {
        "pattern": r"(bp\s+over\s+180|systolic\s+(>|over)\s+180|blood\s+pressure\s+190|hypertensive\s+crisis)",
        "flag": "Hypertensive Urgency / Crisis Marker",
        "instructions": "⚠️ Urgent: A systolic blood pressure reading exceeding 180 mmHg requires urgent medical attention. If accompanied by headache, blurry vision, or chest pain, seek emergency care immediately."
    }
]

def evaluate_triage(user_message: str) -> Dict[str, Any]:
    """
    Evaluates user input for critical red flags, urgent symptoms, or routine wellness inquiry.
    Returns triage level ('emergency', 'urgent', 'routine'), flag title, instructions, and standard disclaimer.
    """
    cleaned = user_message.lower()

    # Check emergency red flags first
    for rule in RED_FLAG_PATTERNS:
        if re.search(rule["pattern"], cleaned):
            return {
                "level": "emergency",
                "flag": rule["flag"],
                "instructions": rule["instructions"],
                "disclaimer": MEDICAL_DISCLAIMER,
                "is_safe_to_defer": False
            }

    # Check urgent flags
    for rule in URGENT_PATTERNS:
        if re.search(rule["pattern"], cleaned):
            return {
                "level": "urgent",
                "flag": rule["flag"],
                "instructions": rule["instructions"],
                "disclaimer": MEDICAL_DISCLAIMER,
                "is_safe_to_defer": True
            }

    # Routine / Educational
    return {
        "level": "routine",
        "flag": None,
        "instructions": None,
        "disclaimer": MEDICAL_DISCLAIMER,
        "is_safe_to_defer": True
    }
