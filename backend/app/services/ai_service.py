import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx
from app.config import settings
from app.services.triage import evaluate_triage, MEDICAL_DISCLAIMER

# Clinical knowledge base for offline intelligent response generation
CLINICAL_TOPICS = {
    "headache": {
        "keywords": ["headache", "head pain", "migraine", "temple pain", "throbbing head"],
        "info": (
            "Headaches can arise from several common sources including tension/stress, dehydration, screen eye-strain, "
            "poor posture, or lack of sleep. Migraines may present with sensitivity to light or sound and throbbing pain on one side.\n\n"
            "**Recommended Self-Care Steps:**\n"
            "• Drink 500ml of water and rest in a dim, quiet room.\n"
            "• Apply a cool cloth or gentle warm compress to your forehead or neck.\n"
            "• Take scheduled screen breaks (20-20-20 rule).\n\n"
            "**When to seek immediate medical attention:**\n"
            "A sudden 'thunderclap' headache (worst headache of your life), headache with high fever and stiff neck, "
            "or headache following head trauma."
        ),
        "followups": ["Has the headache been throbbing or steady?", "Are you sensitive to bright light or loud sounds?", "How much water have you drank today?"]
    },
    "fatigue": {
        "keywords": ["fatigue", "tired", "exhausted", "low energy", "drowsy", "lethargic"],
        "info": (
            "Persistent fatigue is a very common concern and can be influenced by multiple factors:\n"
            "• **Sleep quality & consistency**: Irregular sleep schedules, sleep apnea, or insufficient deep sleep.\n"
            "• **Nutritional & metabolic factors**: Iron/ferritin deficiency, Vitamin D, Vitamin B12, or thyroid (TSH) irregularities.\n"
            "• **Chronic stress & burnout**: Elevated cortisol levels and mental strain.\n"
            "• **Hydration**: Mild dehydration frequently manifests as brain fog and physical exhaustion.\n\n"
            "**Actionable Next Steps:**\n"
            "• Track 7-8 hours of continuous sleep for 5 days.\n"
            "• Ensure adequate protein, leafy greens, and water intake.\n"
            "• Consider discussing routine blood work (CBC, Ferritin, Thyroid panel, Vitamin D/B12) with your doctor."
        ),
        "followups": ["How many hours of sleep did you get last night?", "Do you wake up feeling refreshed or groggy?", "Are you experiencing any other symptoms like cold sensitivity or dizziness?"]
    },
    "cold_flu": {
        "keywords": ["cold", "flu", "cough", "runny nose", "sore throat", "sneezing", "congestion"],
        "info": (
            "Upper respiratory viral symptoms typically resolve over 7 to 10 days with supportive self-care.\n\n"
            "**Evidence-Supported Supportive Care:**\n"
            "• **Hydration**: Warm broths, herbal teas with honey (honey helps soothe throat tickles and coughs).\n"
            "• **Saline nasal rinse & steam**: Helps clear sinus congestion without medication rebounds.\n"
            "• **Salt water gargles**: 1/2 tsp salt in warm water reduces throat irritation.\n"
            "• **Rest**: Prioritize sleep to empower your immune response.\n\n"
            "**Red Flags**: High fever lasting > 3 days, difficulty breathing, persistent pain in the chest, or inability to keep fluids down."
        ),
        "followups": ["Is the cough dry or producing phlegm?", "Do you currently have a fever?", "How many days have symptoms been present?"]
    },
    "blood_pressure": {
        "keywords": ["blood pressure", "hypertension", "systolic", "diastolic", "high bp", "low bp"],
        "info": (
            "Blood pressure measures the force of circulating blood on blood vessel walls.\n\n"
            "**Clinical Categories (AHA/ACC):**\n"
            "• **Normal**: Systolic < 120 and Diastolic < 80 mmHg\n"
            "• **Elevated**: Systolic 120-129 and Diastolic < 80 mmHg\n"
            "• **Stage 1**: Systolic 130-139 or Diastolic 80-89 mmHg\n"
            "• **Stage 2**: Systolic >= 140 or Diastolic >= 90 mmHg\n\n"
            "**Healthy Lifestyle Foundations:**\n"
            "• Reduce excess dietary sodium (< 2,300 mg/day).\n"
            "• Focus on potassium-rich whole foods (bananas, spinach, sweet potatoes).\n"
            "• 150 minutes of moderate aerobic exercise weekly.\n"
            "• Practice structured daily relaxation or deep breathing (e.g. 4-7-8 breathing)."
        ),
        "followups": ["What was your most recent blood pressure reading?", "Are you currently taking any antihypertensive medication?", "Do you check your BP at the same time each day?"]
    },
    "blood_sugar": {
        "keywords": ["blood sugar", "glucose", "diabetes", "prediabetes", "insulin", "hba1c"],
        "info": (
            "Managing blood glucose is fundamental to long-term vascular, kidney, and metabolic health.\n\n"
            "**Key Targets:**\n"
            "• **Fasting Blood Glucose**: 70-99 mg/dL (Normal), 100-125 mg/dL (Prediabetes), >=126 mg/dL (Diabetes benchmark).\n"
            "• **HbA1c**: Below 5.7% (Normal), 5.7% - 6.4% (Prediabetes), >= 6.5% (Diabetes benchmark).\n\n"
            "**Nutrition & Lifestyle Tips:**\n"
            "• Pair carbohydrates with dietary fiber, healthy fats, or protein to blunt glycemic spikes.\n"
            "• Take a light 10-15 minute walk after meals to promote glucose uptake by muscles.\n"
            "• Prioritize consistent restorative sleep (sleep debt increases insulin resistance)."
        ),
        "followups": ["Was your reading taken fasting or after a meal?", "Have you experienced increased thirst or frequent urination?", "Do you monitor your HbA1c periodically?"]
    },
    "stress_sleep": {
        "keywords": ["stress", "anxiety", "insomnia", "can't sleep", "trouble sleeping", "worry"],
        "info": (
            "Sleep and stress are intimately connected through the autonomic nervous system and cortisol regulation.\n\n"
            "**Sleep Hygiene Principles:**\n"
            "• Keep a consistent wake-up time 7 days a week.\n"
            "• Discontinue blue-light screens 60 minutes before bedtime.\n"
            "• Keep your bedroom cool (around 18-20°C / 65-68°F), dark, and quiet.\n"
            "• Avoid caffeine after 1:00 PM and heavy meals within 3 hours of sleep.\n\n"
            "**Stress Management Protocol:**\n"
            "• Box breathing (4 sec inhale, 4 sec hold, 4 sec exhale, 4 sec hold) for 3 minutes.\n"
            "• Journaling racing thoughts onto paper before sleep to clear cognitive load."
        ),
        "followups": ["What time do you usually go to bed and wake up?", "Do you have difficulty falling asleep or waking up early?", "Have you consumed caffeine or alcohol in the evening?"]
    }
}

async def call_external_llm(user_message: str, patient_context: str, api_key: str, provider: str = "gemini") -> Optional[str]:
    """
    Calls Google Gemini or OpenAI if configured and available.
    """
    system_instruction = (
        "You are an empathetic, clinical AI Health Copilot. "
        "Strict rules: 1) You provide health education and lifestyle insights only. "
        "2) NEVER state a definitive diagnosis or prescribe prescription drugs. "
        "3) Emphasize safe self-care, doctor discussion points, and red flags. "
        "4) Contextualize responses with the user's patient profile: " + patient_context
    )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            if provider == "gemini" or (provider == "auto" and api_key.startswith("AIza")):
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                payload = {
                    "contents": [{
                        "parts": [
                            {"text": f"{system_instruction}\n\nUser Question: {user_message}"}
                        ]
                    }]
                }
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if text:
                            return text

            elif provider == "openai" or (provider == "auto" and api_key.startswith("sk-")):
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": user_message}
                    ],
                    "temperature": 0.5
                }
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        return choices[0].get("message", {}).get("content", "")
    except Exception:
        # Fall back gracefully to offline clinical engine
        pass
    return None

def generate_offline_clinical_reply(user_message: str, user_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Generates intelligent, educational, evidence-informed responses using the built-in clinical engine.
    """
    cleaned = user_message.lower()

    profile_note = ""
    if user_profile:
        conditions = user_profile.get("chronic_conditions", "None")
        allergies = user_profile.get("allergies", "None documented")
        age = user_profile.get("age", 32)
        if conditions and conditions.lower() != "none":
            profile_note = f"\n\n*Note for your health profile (Age {age}, Noted condition: {conditions})*: Always confirm with your doctor how your known history interacts with these symptoms."

    # Search for matching clinical topics
    matched_topic = None
    for topic_key, topic_data in CLINICAL_TOPICS.items():
        for kw in topic_data["keywords"]:
            if kw in cleaned:
                matched_topic = topic_data
                break
        if matched_topic:
            break

    if matched_topic:
        reply = (
            f"Here is educational clinical context regarding your inquiry:\n\n"
            f"{matched_topic['info']}"
            f"{profile_note}\n\n"
            f"**Questions to consider for your doctor:**\n"
            f"• 'Given my history, what diagnostic or preventative checks are indicated?'\n"
            f"• 'What symptom timeline or threshold warrants an in-person clinic visit?'"
        )
        return {
            "reply": reply,
            "suggested_followups": matched_topic["followups"]
        }

    # General supportive wellness synthesis
    generic_reply = (
        f"Thank you for sharing your health inquiry. While I cannot diagnose conditions, here is practical guidance to help you navigate this:\n\n"
        f"• **Track & Observe**: Note down the exact onset, severity (1-10 scale), triggers, and what relieves or worsens the symptom.\n"
        f"• **Supportive Self-Care**: Ensure adequate hydration (2-2.5 liters of water daily unless fluid-restricted), restful sleep, and balanced nutrition.\n"
        f"• **Monitor Red Flags**: Seek immediate medical care if you develop sudden severe pain, high persistent fever, shortness of breath, or neurological changes.\n"
        f"{profile_note}\n\n"
        f"Would you like to log your recent vitals, check potential medication interactions, or formulate specific questions to review with your healthcare provider?"
    )
    return {
        "reply": generic_reply,
        "suggested_followups": [
            "How long have you been experiencing this symptom?",
            "What medications or treatments have you tried so far?",
            "Would you like to log your vitals today?"
        ]
    }

LOCALIZED_DISCLAIMERS = {
    "en": "⚠️ Medical Safety Notice: This AI Personal Health Copilot provides educational wellness information only and does not diagnose diseases. In an emergency, call 112 / 911.",
    "hi": "⚠️ चिकित्सा सुरक्षा सूचना: यह एआई स्वास्थ्य सहायक केवल शैक्षिक जानकारी प्रदान करता है, कोई निदान नहीं। आपात स्थिति में तुरंत 112 / 911 पर कॉल करें।",
    "es": "⚠️ Aviso de Seguridad Médica: Este Copiloto de Salud brinda orientación educativa y no sustituye el diagnóstico médico. En emergencias, llame al 112 / 911.",
    "fr": "⚠️ Avis Médical: Cet assistant fournit des informations éducatives et ne remplace pas un diagnostic médical. En cas d'urgence, appelez le 112 / 15.",
    "de": "⚠️ Medizinischer Hinweis: Dieser Copilot dient nur zu Informationszwecken und ersetzt keine ärztliche Diagnose. Im Notfall rufen Sie 112 an.",
    "zh": "⚠️ 医疗安全声明：此AI健康助手仅提供健康科普，不代替医生诊断。如遇紧急情况，请立即拨打急救电话 120 / 911。"
}

async def process_chat_message(
    user_message: str,
    user_profile: Optional[Dict[str, Any]] = None,
    api_key_override: Optional[str] = None,
    provider: Optional[str] = None,
    language: Optional[str] = "en"
) -> Dict[str, Any]:
    """
    Main copilot entrypoint:
    1. Evaluates emergency / urgent triage red flags.
    2. Diverts immediately with life-saving triage instructions if critical red flag.
    3. Calls external LLM if configured; otherwise utilizes offline clinical engine.
    4. Appends medical safety disclaimer and returns structured response.
    """
    # 1. Triage safety check
    triage = evaluate_triage(user_message)

    if triage["level"] == "emergency":
        emergency_reply = (
            f"{triage['instructions']}\n\n"
            f"⚠️ **Emergency Protocols Activated**: AI Health Copilot cannot evaluate life-threatening emergencies. "
            f"Please reach emergency dispatch immediately (Call 112 / 911)."
        )
        return {
            "reply": emergency_reply,
            "triage_level": "emergency",
            "triage_flag": triage["flag"],
            "disclaimer": triage["disclaimer"],
            "suggested_followups": [
                "Call 112 / 911 immediately",
                "Contact designated emergency contact",
                "Stay seated in a safe position"
            ],
            "timestamp": datetime.now(timezone.utc)
        }

    # 2. Check for external LLM or Offline engine
    api_key = api_key_override or settings.GEMINI_API_KEY or settings.OPENAI_API_KEY
    chosen_provider = provider or settings.DEFAULT_AI_PROVIDER

    patient_ctx = "None"
    if user_profile:
        patient_ctx = (
            f"Age: {user_profile.get('age')}, Sex: {user_profile.get('gender')}, "
            f"Conditions: {user_profile.get('chronic_conditions')}, Allergies: {user_profile.get('allergies')}"
        )

    ai_text = None
    if api_key and chosen_provider != "offline":
        ai_text = await call_external_llm(user_message, patient_ctx, api_key, chosen_provider)

    if not ai_text:
        offline_result = generate_offline_clinical_reply(user_message, user_profile)
        reply = offline_result["reply"]
        suggested = offline_result["suggested_followups"]
    else:
        reply = ai_text
        suggested = [
            "What lifestyle adjustments could help?",
            "What specific questions should I ask my doctor?",
            "Are there any red flags I should monitor?"
        ]

    # Prepend warning for urgent symptoms
    if triage["level"] == "urgent":
        reply = f"⚠️ **URGENT ALERT**: {triage['flag']}\n{triage['instructions']}\n\n---\n{reply}"

    return {
        "reply": reply,
        "triage_level": triage["level"],
        "triage_flag": triage["flag"],
        "disclaimer": LOCALIZED_DISCLAIMERS.get(language, triage["disclaimer"]),
        "suggested_followups": suggested,
        "timestamp": datetime.now(timezone.utc)
    }
