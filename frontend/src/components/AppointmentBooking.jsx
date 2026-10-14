import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, UserCheck, Stethoscope, Ticket, CheckCircle2, AlertCircle, Printer, X, Trash2, MapPin, Star
} from 'lucide-react';
import { api } from '../services/api';

export default function AppointmentBooking({ userProfile }) {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [activeTokenModal, setActiveTokenModal] = useState(null); // shows token slip
  const [bookingForm, setBookingForm] = useState({
    doctor_name: '',
    specialty: '',
    appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time_slot: '10:00 AM',
    reason: 'Routine health review & symptom evaluation'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docs, apts] = await Promise.all([
        api.getDoctors(),
        api.getAppointments()
      ]);
      setDoctors(docs);
      setAppointments(apts);
    } catch (err) {
      console.error('Failed to load appointments data', err);
    } finally {
      setLoading(false);
    }
  };

  const openBookModal = (doctor) => {
    setSelectedDoctor(doctor);
    setBookingForm({
      doctor_name: doctor.name,
      specialty: doctor.specialty,
      appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time_slot: doctor.available_slots[0] || '10:00 AM',
      reason: 'Clinical consultation & biomarker review'
    });
    setShowModal(true);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await api.bookAppointment({
        patient_name: userProfile?.name || 'Alex Smith',
        doctor_name: bookingForm.doctor_name,
        specialty: bookingForm.specialty,
        appointment_date: bookingForm.appointment_date,
        time_slot: bookingForm.time_slot,
        reason: bookingForm.reason
      });
      setShowModal(false);
      setActiveTokenModal(created); // Immediately show official Token Pass!
      await loadData();
    } catch (err) {
      alert('Booking failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (confirm('Cancel this appointment and release your queue token?')) {
      try {
        await api.cancelAppointment(id);
        await loadData();
      } catch (err) {
        alert('Failed to cancel: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Doctor Appointments & Queue Tokens</h2>
          <p className="text-xs text-slate-500">
            Schedule specialist consultations and receive verified digital queue tokens with room allocations
          </p>
        </div>

        {appointments.length > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
            <Ticket className="w-4 h-4 text-emerald-600" />
            <span>Active Token: {appointments[0].token_number}</span>
          </div>
        )}
      </div>

      {/* Active Token Cards Section */}
      {appointments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5 text-emerald-600" />
            Your Confirmed Appointment Passes & Token Numbers
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-gradient-to-br from-white to-slate-50 border-2 border-emerald-300 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between"
              >
                {/* Visual Token Header */}
                <div className="border-b border-dashed border-slate-200 pb-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 tracking-wider">
                      Confirmed Token
                    </span>
                    <button
                      onClick={() => handleCancel(apt.id)}
                      className="text-slate-300 hover:text-red-500 p-1"
                      title="Cancel appointment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">TOKEN NUMBER</span>
                      <span className="text-2xl font-black text-emerald-700 tracking-wider">
                        {apt.token_number}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">QUEUE POS</span>
                      <span className="text-lg font-bold text-slate-800">#{apt.queue_position}</span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="font-bold text-slate-900">{apt.doctor_name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pl-5.5">{apt.specialty}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                    <span>{apt.hospital_room}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <span>{apt.appointment_date} at {apt.time_slot}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setActiveTokenModal(apt)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View & Print Token Slip</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-medium">Room Assigned</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Specialists Directory */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
          Available Hospital Specialists & Departments
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{doc.name}</h4>
                    <span className="text-[11px] font-semibold text-emerald-700 block mt-0.5">
                      {doc.specialty}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-amber-800 text-[11px] font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{doc.rating}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1 my-3">
                  <p><span className="font-semibold text-slate-700">Credentials:</span> {doc.qualification}</p>
                  <p><span className="font-semibold text-slate-700">Experience:</span> {doc.experience_years} years clinical practice</p>
                  <p className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-3 h-3 text-rose-500" /> {doc.hospital_room}
                  </p>
                </div>

                {/* Slots */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Available Slots Today:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.available_slots.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => openBookModal(doc)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Book & Generate Token</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Form Modal */}
      {showModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Book Specialist Appointment</h3>
                <p className="text-xs text-slate-500">{selectedDoctor.name}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBook} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Clinic / Room</label>
                <input
                  type="text"
                  disabled
                  value={selectedDoctor.hospital_room}
                  className="w-full px-3 py-2 bg-slate-100 border rounded-xl text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.appointment_date}
                    onChange={(e) => setBookingForm({ ...bookingForm, appointment_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preferred Time Slot</label>
                  <select
                    value={bookingForm.time_slot}
                    onChange={(e) => setBookingForm({ ...bookingForm, time_slot: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {selectedDoctor.available_slots.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Symptoms or Reason for Visit</label>
                <textarea
                  rows={2}
                  value={bookingForm.reason}
                  onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                  placeholder="e.g. Follow-up regarding blood pressure or recent lab results"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800">
                <strong>Instant Token Guarantee:</strong> An official token number and queue position will be issued immediately upon confirmation.
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow"
                >
                  {submitting ? 'Issuing Token...' : 'Confirm & Generate Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Digital Token Slip Modal */}
      {activeTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 print:max-w-none print:shadow-none print:border-none">
            <div className="flex items-center justify-between border-b pb-3 mb-4 print:hidden">
              <span className="font-bold text-slate-800 text-xs">Official Appointment Token Slip</span>
              <button onClick={() => setActiveTokenModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Pass Container */}
            <div className="text-center border-2 border-dashed border-emerald-400 p-5 rounded-2xl bg-gradient-to-b from-emerald-50/50 to-white">
              <div className="inline-block px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                HOSPITAL OPD TOKEN PASS
              </div>

              <div className="my-2">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">YOUR TOKEN NUMBER</span>
                <span className="text-4xl font-black text-emerald-700 tracking-widest">
                  {activeTokenModal.token_number}
                </span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-slate-700 my-2">
                <span>Queue Position:</span>
                <span className="text-emerald-700 font-extrabold">#{activeTokenModal.queue_position}</span>
              </div>

              <div className="text-left bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs mt-3">
                <p><span className="font-semibold text-slate-500">Patient:</span> <span className="font-bold text-slate-800">{activeTokenModal.patient_name}</span></p>
                <p><span className="font-semibold text-slate-500">Doctor:</span> <span className="font-bold text-slate-800">{activeTokenModal.doctor_name}</span></p>
                <p><span className="font-semibold text-slate-500">Department:</span> {activeTokenModal.specialty}</p>
                <p><span className="font-semibold text-slate-500">Room:</span> <span className="font-bold text-rose-700">{activeTokenModal.hospital_room}</span></p>
                <p><span className="font-semibold text-slate-500">Time:</span> {activeTokenModal.appointment_date} at {activeTokenModal.time_slot}</p>
              </div>

              <p className="text-[10px] text-slate-400 mt-3 italic">
                Please present this token slip at the clinic reception 10 minutes prior to your time.
              </p>
            </div>

            <div className="mt-5 flex gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save Slip</span>
              </button>
              <button
                onClick={() => setActiveTokenModal(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
