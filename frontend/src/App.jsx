import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DisclaimerBanner from './components/DisclaimerBanner';
import LoginPage from './components/LoginPage';
import ChatCopilot from './components/ChatCopilot';
import AppointmentBooking from './components/AppointmentBooking';
import VitalsTracker from './components/VitalsTracker';
import LabAnalyzer from './components/LabAnalyzer';
import MedicationLog from './components/MedicationLog';
import DoctorSummary from './components/DoctorSummary';
import ProfileModal from './components/ProfileModal';
import SettingsModal from './components/SettingsModal';
import EmergencyModal from './components/EmergencyModal';
import { api } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [profile, setProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  const checkAuthAndLoadProfile = async () => {
    setAuthChecking(true);
    try {
      const token = localStorage.getItem('HEALTH_COPILOT_AUTH_TOKEN');
      if (token) {
        const user = await api.getMe().catch(() => null);
        if (user) {
          setCurrentUser(user);
        }
      }
      const profData = await api.getProfile().catch(() => null);
      if (profData) {
        setProfile(profData);
      }
    } catch (err) {
      console.warn('Auth check error', err);
    } finally {
      setAuthChecking(false);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    checkAuthAndLoadProfile();
  };

  const handleLogout = () => {
    localStorage.removeItem('HEALTH_COPILOT_AUTH_TOKEN');
    setCurrentUser(null);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Initializing AI Health Copilot Portal...</span>
        </div>
      </div>
    );
  }

  // If not logged in, show clean Login/Register page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Clinical Safety Disclaimer & Emergency SOS Banner */}
      <DisclaimerBanner onOpenEmergencyModal={() => setShowEmergencyModal(true)} />

      {/* Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenEmergency={() => setShowEmergencyModal(true)}
      />

      {/* Main Application Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'chat' && (
          <ChatCopilot
            profile={profile}
            onOpenEmergencyModal={() => setShowEmergencyModal(true)}
          />
        )}

        {activeTab === 'appointments' && (
          <AppointmentBooking userProfile={profile} />
        )}

        {activeTab === 'vitals' && <VitalsTracker />}

        {activeTab === 'labs' && <LabAnalyzer />}

        {activeTab === 'meds' && <MedicationLog />}

        {activeTab === 'summary' && <DoctorSummary />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI-Powered Personal Health Copilot • v1.1.0</span>
          <span className="text-[11px] text-slate-400">
            Authenticated Patient Portal • Non-diagnostic education only • Emergency triage active (112 / 911)
          </span>
        </div>
      </footer>

      {/* Modals */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={profile}
        onProfileUpdated={(updated) => setProfile(updated)}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <EmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        profile={profile}
      />
    </div>
  );
}
