import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Bot, User, AlertOctagon, AlertTriangle, Trash2, Sparkles, PhoneCall, RefreshCw,
  Mic, MicOff, Volume2, VolumeX, Globe
} from 'lucide-react';
import { api } from '../services/api';

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', voiceLang: 'en-US' },
  { code: 'hi', label: 'हिन्दी (Hindi)', voiceLang: 'hi-IN' },
  { code: 'es', label: 'Español (Spanish)', voiceLang: 'es-ES' },
  { code: 'fr', label: 'Français (French)', voiceLang: 'fr-FR' },
  { code: 'de', label: 'Deutsch (German)', voiceLang: 'de-DE' },
  { code: 'zh', label: '中文 (Mandarin)', voiceLang: 'zh-CN' },
];

export default function ChatCopilot({ profile, onOpenEmergencyModal }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState([]);
  const [language, setLanguage] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
    loadPrompts();

    // Initialize Speech Recognition if supported by browser
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const history = await api.getChatHistory();
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        setMessages([
          {
            id: 0,
            role: 'assistant',
            content: `Hello ${profile?.name || 'there'}! I am your AI Personal Health Copilot.\n\nI can assist you with:\n• Explaining symptoms, vitals, and complex lab reports in multiple languages.\n• Voice conversations via speech input and audio readouts.\n• Booking doctor appointments with verified queue token numbers.\n\n*Important: I provide educational wellness guidance only and do not diagnose illnesses. For emergencies, please call 112 / 911.*`,
            triage_level: 'routine',
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  };

  const loadPrompts = async () => {
    try {
      const prompts = await api.getQuickPrompts();
      setQuickPrompts(prompts);
    } catch (err) {
      console.error('Failed to load prompts', err);
    }
  };

  // Toggle Microphone Speech-to-Text
  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language);
      recognitionRef.current.lang = currentLangObj ? currentLangObj.voiceLang : 'en-US';
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition', err);
      }
    }
  };

  // Text-to-Speech audio readout
  const handleSpeak = (msgId, text) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#•_]/g, ''); // strip markdown characters for natural voice
    const utterance = new SpeechSynthesisUtterance(cleanText);

    const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language);
    utterance.lang = currentLangObj ? currentLangObj.voiceLang : 'en-US';
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    if (speakingMsgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    }

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: textToSend,
      triage_level: 'routine',
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const apiKeyOverride = localStorage.getItem('HEALTH_COPILOT_API_KEY') || undefined;
      const provider = localStorage.getItem('HEALTH_COPILOT_PROVIDER') || undefined;

      const response = await api.sendChat({
        message: textToSend,
        apiKeyOverride,
        provider,
        language
      });

      const asstMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.reply,
        triage_level: response.triage_level,
        triage_flag: response.triage_flag,
        disclaimer: response.disclaimer,
        suggested_followups: response.suggested_followups,
        timestamp: response.timestamp
      };

      setMessages((prev) => [...prev, asstMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: 'Sorry, I encountered an issue processing your request: ' + err.message,
          triage_level: 'routine',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear your conversation history?')) {
      if (speakingMsgId) window.speechSynthesis.cancel();
      await api.clearChatHistory();
      setMessages([]);
      loadChatHistory();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header with Language Selector & Voice Status */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Health Copilot Agent</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Voice & Multi-Lang
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Personalized for {profile?.name || 'User'} ({profile?.age || 32}y)
            </p>
          </div>
        </div>

        {/* Right Controls: Language Dropdown & Clear */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-xl text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer text-xs"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition text-xs flex items-center gap-1"
            title="Clear Conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          const isEmergency = m.triage_level === 'emergency';
          const isUrgent = m.triage_level === 'urgent';
          const isSpeaking = speakingMsgId === m.id;

          return (
            <div key={m.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isEmergency
                      ? 'bg-red-600 text-white animate-pulse'
                      : isUrgent
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isEmergency ? <AlertOctagon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : isEmergency
                    ? 'bg-red-50 text-red-950 border-2 border-red-400 rounded-tl-none shadow-md'
                    : isUrgent
                    ? 'bg-amber-50 text-amber-950 border border-amber-300 rounded-tl-none'
                    : 'bg-slate-100 text-slate-800 rounded-tl-none'
                }`}
              >
                {/* Triage Alert Badge on Assistant Messages */}
                {!isUser && isEmergency && (
                  <div className="mb-3 p-2.5 bg-red-600 text-white rounded-xl font-bold flex items-center justify-between gap-2 shadow">
                    <div className="flex items-center gap-1.5 text-xs">
                      <AlertOctagon className="w-4 h-4" />
                      <span>{m.triage_flag || 'EMERGENCY RED FLAG DETECTED'}</span>
                    </div>
                    <button
                      onClick={onOpenEmergencyModal}
                      className="px-2.5 py-1 bg-white text-red-700 text-xs rounded-lg font-bold hover:bg-red-50 transition"
                    >
                      Call 112 / 911
                    </button>
                  </div>
                )}

                {!isUser && isUrgent && (
                  <div className="mb-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-200 text-amber-900 rounded-lg text-xs font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{m.triage_flag || 'Urgent Attention Recommended'}</span>
                  </div>
                )}

                {/* Content */}
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Bottom actions for assistant message: Audio TTS Speaker button */}
                {!isUser && (
                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-200/50">
                    <button
                      onClick={() => handleSpeak(m.id, m.content)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                        isSpeaking
                          ? 'bg-emerald-600 text-white animate-pulse'
                          : 'text-slate-500 hover:text-emerald-700 hover:bg-white'
                      }`}
                      title={isSpeaking ? 'Stop reading' : 'Read guidance aloud'}
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isSpeaking ? 'Listening...' : 'Listen to Advice'}</span>
                    </button>
                    <span className="text-[10px] text-slate-400">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* Follow-up suggestions */}
                {!isUser && m.suggested_followups && m.suggested_followups.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60">
                    <p className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" /> Suggested next queries:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.suggested_followups.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(q)}
                          className="px-2.5 py-1 rounded-full text-[11px] bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 items-center text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 px-3.5 py-2 rounded-2xl">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Analyzing health context in {SUPPORTED_LANGUAGES.find(l => l.code === language)?.label}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      {quickPrompts.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 flex-shrink-0">Quick Topics:</span>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p.prompt)}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-emerald-400 hover:text-emerald-700 rounded-full text-slate-600 whitespace-nowrap text-[11px] transition shadow-2xs"
            >
              {p.category}
            </button>
          ))}
        </div>
      )}

      {/* Input Form with Microphone Button */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 sm:p-4 border-t border-slate-200 bg-white flex items-center gap-2"
      >
        <button
          type="button"
          onClick={toggleSpeechRecognition}
          className={`p-2.5 rounded-xl border transition flex items-center justify-center ${
            isListening
              ? 'bg-red-500 text-white border-red-600 animate-pulse'
              : 'bg-slate-50 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200'
          }`}
          title={isListening ? 'Listening... Click to stop' : 'Click to speak symptoms (Voice Input)'}
        >
          {isListening ? <MicOff className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isListening
              ? 'Listening to your voice... Speak now...'
              : `Ask symptoms, vitals, or lab questions in ${SUPPORTED_LANGUAGES.find(l => l.code === language)?.label}...`
          }
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-xs sm:text-sm transition focus:ring-2 focus:ring-emerald-100"
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 sm:px-5 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-semibold flex items-center gap-1.5 transition shadow"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Ask Copilot</span>
        </button>
      </form>
    </div>
  );
}
