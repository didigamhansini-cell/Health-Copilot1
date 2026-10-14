import React, { useState } from 'react';
import {
  HeartPulse, Lock, Mail, User, ArrowRight, ShieldCheck, Sparkles, Activity, Shield, Heart, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  
  // Clean, separated states for Login and Signup
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: 28,
    gender: 'Female',
    blood_type: 'O+',
    allergies: 'None',
    chronic_conditions: 'None'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login({
        email: loginForm.email,
        password: loginForm.password
      });
      localStorage.setItem('HEALTH_COPILOT_AUTH_TOKEN', res.token);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        age: parseInt(registerForm.age) || 30,
        gender: registerForm.gender,
        blood_type: registerForm.blood_type,
        allergies: registerForm.allergies || 'None documented',
        chronic_conditions: registerForm.chronic_conditions || 'None'
      });
      localStorage.setItem('HEALTH_COPILOT_AUTH_TOKEN', res.token);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Registration failed. Email might already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.login({
        email: 'alex@example.com',
        password: 'health123'
      });
      localStorage.setItem('HEALTH_COPILOT_AUTH_TOKEN', res.token);
      onLoginSuccess(res.user);
    } catch (err) {
      setError('Demo login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center items-center p-4 py-8">
      <div className={`w-full transition-all duration-300 ${isRegister ? 'max-w-xl' : 'max-w-md'}`}>
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xl mb-3">
            <HeartPulse className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Health<span className="text-emerald-400">Copilot</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            {isRegister
              ? 'Create your personalized patient health account'
              : 'Sign in to access your private clinical health workspace'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-xs font-bold">
            <button
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 py-2 rounded-lg transition ${
                !isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In to Existing Account
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 py-2 rounded-lg transition ${
                isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create New Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* SIGN IN FORM */}
          {!isRegister && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-xs"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Health Copilot'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Demo Shortcut */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>One-Click Demo Account (Alex Smith)</span>
                </button>
              </div>
            </form>
          )}

          {/* CREATE ACCOUNT FORM (Enter their own details) */}
          {isRegister && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] leading-relaxed">
                Enter your details to create your personal Health Copilot account. Your profile will be private and dedicated strictly to you.
              </div>

              {/* Section 1: Credentials */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-xs border-b pb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" /> 1. Account Credentials
                </h3>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    placeholder="e.g. John Doe, Maria Garcia"
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="e.g. yourname@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Health Baseline */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-slate-900 text-xs border-b pb-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-500" /> 2. Personal Health Details
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Age</label>
                    <input
                      type="number"
                      value={registerForm.age}
                      onChange={(e) => setRegisterForm({ ...registerForm, age: e.target.value })}
                      placeholder="28"
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      value={registerForm.gender}
                      onChange={(e) => setRegisterForm({ ...registerForm, gender: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Blood Type</label>
                    <select
                      value={registerForm.blood_type}
                      onChange={(e) => setRegisterForm({ ...registerForm, blood_type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-amber-500" /> Allergies
                    </label>
                    <input
                      type="text"
                      value={registerForm.allergies}
                      onChange={(e) => setRegisterForm({ ...registerForm, allergies: e.target.value })}
                      placeholder="e.g. Penicillin, None"
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500" /> Chronic Conditions
                    </label>
                    <input
                      type="text"
                      value={registerForm.chronic_conditions}
                      onChange={(e) => setRegisterForm({ ...registerForm, chronic_conditions: e.target.value })}
                      placeholder="e.g. Asthma, None"
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-xs mt-2"
              >
                <span>{loading ? 'Creating Your Account...' : 'Complete Sign Up & Enter Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Safety Footer */}
        <div className="mt-6 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Clinical non-diagnostic tool • Emergency triage active (112 / 911)</span>
        </div>
      </div>
    </div>
  );
}
