const BASE_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('HEALTH_COPILOT_AUTH_TOKEN');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  register: async (data) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  login: async (data) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  getMe: async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Appointments
  getDoctors: async () => {
    const res = await fetch(`${BASE_URL}/appointments/doctors`);
    return handleResponse(res);
  },
  getAppointments: async () => {
    const res = await fetch(`${BASE_URL}/appointments`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  bookAppointment: async (data) => {
    const res = await fetch(`${BASE_URL}/appointments/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  cancelAppointment: async (id) => {
    const res = await fetch(`${BASE_URL}/appointments/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Profile
  getProfile: async () => {
    const res = await fetch(`${BASE_URL}/profile`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  updateProfile: async (data) => {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Vitals
  getVitals: async () => {
    const res = await fetch(`${BASE_URL}/vitals`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  logVital: async (data) => {
    const res = await fetch(`${BASE_URL}/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  deleteVital: async (id) => {
    const res = await fetch(`${BASE_URL}/vitals/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Copilot Chat (Multi-language & Voice compatible)
  sendChat: async ({ message, sessionId = 'default', apiKeyOverride, provider, language = 'en' }) => {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        api_key_override: apiKeyOverride,
        provider: provider || 'auto',
        language: language || 'en'
      })
    });
    return handleResponse(res);
  },
  getChatHistory: async (sessionId = 'default') => {
    const res = await fetch(`${BASE_URL}/chat/history?session_id=${sessionId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  clearChatHistory: async (sessionId = 'default') => {
    const res = await fetch(`${BASE_URL}/chat/history?session_id=${sessionId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  getQuickPrompts: async () => {
    const res = await fetch(`${BASE_URL}/chat/quick-prompts`);
    return handleResponse(res);
  },

  // Labs
  getLabPresets: async () => {
    const res = await fetch(`${BASE_URL}/labs/presets`);
    return handleResponse(res);
  },
  analyzeLab: async (payload) => {
    const res = await fetch(`${BASE_URL}/labs/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  getLabReports: async () => {
    const res = await fetch(`${BASE_URL}/labs`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Medications
  getMedications: async () => {
    const res = await fetch(`${BASE_URL}/medications`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  addMedication: async (data) => {
    const res = await fetch(`${BASE_URL}/medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  takeMedication: async (id) => {
    const res = await fetch(`${BASE_URL}/medications/${id}/take`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  deleteMedication: async (id) => {
    const res = await fetch(`${BASE_URL}/medications/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  checkInteractions: async () => {
    const res = await fetch(`${BASE_URL}/medications/interactions/check`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Doctor Report
  getDoctorReport: async () => {
    const res = await fetch(`${BASE_URL}/summary/doctor-report`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  }
};
