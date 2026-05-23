import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User as UserIcon, Trash2, Star, Coffee } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Student lecture slots: 7 lectures + 1 lunch break
const STUDENT_SLOTS = [
  { slot: 1, time: '09:00 AM', label: 'Lecture 1' },
  { slot: 2, time: '10:00 AM', label: 'Lecture 2' },
  { slot: 3, time: '11:00 AM', label: 'Lecture 3' },
  { slot: 4, time: '12:00 PM', label: 'Lecture 4' },
  { slot: 'lunch', time: '01:00 PM', label: 'Lunch Break', isBreak: true },
  { slot: 5, time: '02:00 PM', label: 'Lecture 5' },
  { slot: 6, time: '03:00 PM', label: 'Lecture 6' },
  { slot: 7, time: '04:00 PM', label: 'Lecture 7' },
];

export default function TimetableDashboard() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    classroomId: '', day: 'Monday', subject: '', faculty: '',
    time: '', department: '', year: '', section: ''
  });

  const days = DAYS_ORDER;

  useEffect(() => { fetchTimetable(); }, []);

  const fetchTimetable = async () => {
    try {
      const res = await api.get('/user/timetable');
      setTimetable(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classrooms/timetable', formData);
      toast.success('Schedule Slot Added');
      setShowForm(false);
      fetchTimetable();
      setFormData({ classroomId: '', day: 'Monday', subject: '', faculty: '', time: '', department: '', year: '', section: '' });
    } catch (e) { toast.error('Failed to add slot'); }
  };

  const handleDeleteTimetable = async (id) => {
    if (!window.confirm('Remove this schedule entry?')) return;
    try {
      setDeletingId(id);
      setTimeout(async () => {
        await api.delete(`/classrooms/timetable/${id}`);
        toast.success('Entry Removed');
        fetchTimetable();
        setDeletingId(null);
      }, 300);
    } catch (e) {
      toast.error('Delete failed');
      setDeletingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Timetable...</div>;

  // ─── STUDENT VIEW ──────────────────────────────────────────────────────────
  if (user.role === 'student') {
    // Define the real 9AM-5PM schedule with lunch at 1PM
    const FULL_DAY = [
      { key: 'L1', time: '09:00 AM - 10:00 AM', isBreak: false },
      { key: 'L2', time: '10:00 AM - 11:00 AM', isBreak: false },
      { key: 'L3', time: '11:00 AM - 12:00 PM', isBreak: false },
      { key: 'L4', time: '12:00 PM - 01:00 PM', isBreak: false },
      { key: 'LUNCH', time: '01:00 PM - 02:00 PM', isBreak: true },
      { key: 'L5', time: '02:00 PM - 03:00 PM', isBreak: false },
      { key: 'L6', time: '03:00 PM - 04:00 PM', isBreak: false },
      { key: 'L7', time: '04:00 PM - 05:00 PM', isBreak: false },
    ];

    return (
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">My Weekly Timetable</h1>
          <p className="text-slate-500 mt-2">7 lectures per day · 09:00 AM – 05:00 PM · Lunch: 01:00–02:00 PM</p>
        </div>

        {timetable.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No timetable entries found for your class.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
            {DAYS_ORDER.map(day => {
              // Get entries for this day sorted by time
              const dayEntries = timetable
                .filter(t => t.day === day)
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

              // Map each FULL_DAY slot to a timetable entry by index (L1→idx0, L2→idx1, etc.)
              let lectureIdx = 0;
              const slotMap = FULL_DAY.map(slot => {
                if (slot.isBreak) return { ...slot, entry: null };
                const entry = dayEntries[lectureIdx] || null;
                lectureIdx++;
                return { ...slot, entry };
              });

              return (
                <div key={day} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  {/* Day header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-center">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">{day}</h2>
                    <p className="text-[10px] text-blue-100 mt-0.5">7 Lectures · 9AM – 5PM</p>
                  </div>

                  <div className="p-2.5 flex-1 space-y-1.5 bg-slate-50/50">
                    {slotMap.map((slot) => {
                      // Lunch break row
                      if (slot.isBreak) {
                        return (
                          <div key="lunch" className="flex items-center gap-2 px-2.5 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                            <Coffee className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <div>
                              <p className="text-[9px] font-black text-amber-600 uppercase tracking-wider">Lunch Break</p>
                              <p className="text-[10px] text-amber-500 font-medium">01:00 PM – 02:00 PM</p>
                            </div>
                          </div>
                        );
                      }

                      // Lecture row
                      const { entry } = slot;
                      return (
                        <div
                          key={slot.key}
                          className="bg-white rounded-xl border border-blue-100 px-2.5 py-2 shadow-sm hover:border-blue-300 transition-all"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">{slot.key}</span>
                            <span className="text-[9px] text-slate-400 font-medium">{slot.time.split(' - ')[0]}</span>
                          </div>
                          {entry ? (
                            <>
                              <p className="text-[11px] font-bold text-slate-800 leading-tight">{entry.subject}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <UserIcon className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                                <span className="text-[9px] text-slate-500 font-medium line-clamp-1">{entry.faculty}</span>
                              </div>
                            </>
                          ) : (
                            <p className="text-[10px] text-slate-300 font-medium italic">{slot.time}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── FACULTY / HOD VIEW ───────────────────────────────────────────────────
  if (user.role === 'faculty' || user.role === 'hod') {
    // Time slot order for correct sorting
    const timeOrder = [
      '09:00 AM - 10:00 AM',
      '10:00 AM - 11:00 AM',
      '11:00 AM - 12:00 PM',
      '12:00 PM - 01:00 PM',
      '02:00 PM - 03:00 PM',
      '03:00 PM - 04:00 PM',
      '04:00 PM - 05:00 PM',
    ];
    const sortByTime = (a, b) => timeOrder.indexOf(a.time) - timeOrder.indexOf(b.time);

    return (
      <div className="max-w-6xl mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">My Teaching Schedule</h1>
          <p className="text-slate-500 mt-1 text-sm">
            All your assigned lectures across classrooms — sorted 9:00 AM to 5:00 PM.
          </p>
        </div>

        {timetable.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No timetable assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {days.map(day => {
              const dayEntries = timetable
                .filter(t => t.day === day)
                .sort(sortByTime);

              return (
                <div key={day} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Day header */}
                  <div className="bg-slate-800 px-6 py-3 flex items-center justify-between">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">{day}</h2>
                    <span className="text-xs text-slate-400 font-semibold">{dayEntries.length} lecture{dayEntries.length !== 1 ? 's' : ''}</span>
                  </div>

                  {dayEntries.length === 0 ? (
                    <div className="px-6 py-8 text-center text-slate-300 text-sm font-medium">
                      <Calendar className="w-6 h-6 mx-auto mb-1 opacity-30" /> No classes
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {/* Table header */}
                      <div className="grid grid-cols-12 gap-4 px-6 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <div className="col-span-3">Time</div>
                        <div className="col-span-4">Subject</div>
                        <div className="col-span-3">Classroom</div>
                        <div className="col-span-2">Type</div>
                      </div>

                      {/* Lunch position tracker */}
                      {(() => {
                        let lunchInserted = false;
                        const rows = [];
                        dayEntries.forEach((cls, idx) => {
                          // Insert lunch break row before 02:00 PM entry
                          if (!lunchInserted && cls.time && cls.time.startsWith('02:00')) {
                            lunchInserted = true;
                            rows.push(
                              <div key="lunch" className="grid grid-cols-12 gap-4 px-6 py-3 bg-amber-50 items-center">
                                <div className="col-span-3 text-xs font-bold text-amber-600 flex items-center gap-1.5">
                                  <Coffee className="w-3.5 h-3.5" /> 01:00 – 02:00 PM
                                </div>
                                <div className="col-span-9 text-xs font-bold text-amber-500 uppercase tracking-wider">☕ Lunch Break</div>
                              </div>
                            );
                          }
                          const isCoord = cls.isCoordinated;
                          rows.push(
                            <div
                              key={cls.id || idx}
                              className={`grid grid-cols-12 gap-4 px-6 py-3.5 items-center transition-colors hover:bg-slate-50/80
                                ${isCoord ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : 'border-l-4 border-l-transparent'}`}
                            >
                              {/* Time */}
                              <div className="col-span-3 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                <span className="text-xs font-bold text-slate-600">{cls.time ? cls.time.split(' - ')[0] : '—'}</span>
                              </div>
                              {/* Subject */}
                              <div className="col-span-4">
                                <p className="text-sm font-bold text-slate-800 leading-tight">{cls.subject}</p>
                              </div>
                              {/* Classroom */}
                              <div className="col-span-3">
                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                                  {cls.classroomLabel || `${cls.department} Y${cls.year}–${cls.section}`}
                                </span>
                              </div>
                              {/* Badge */}
                              <div className="col-span-2">
                                {isCoord ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                    <Star className="w-2.5 h-2.5 fill-white" /> Coord
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Teaching</span>
                                )}
                              </div>
                            </div>
                          );
                        });
                        return rows;
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── ADMIN VIEW ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Global Timetable</h1>
          <p className="text-slate-500 mt-2">Manage campus-wide schedule for all departments.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-6 py-2 rounded-xl font-bold text-sm shadow-lg transition-colors ${showForm ? 'bg-slate-200 text-slate-700' : 'bg-slate-900 text-white'}`}
        >
          {showForm ? 'Cancel' : 'Add Slot'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Day</label>
            <select value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} className="w-full border rounded-xl p-2 text-sm font-bold bg-slate-50">
              {days.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Subject</label>
            <input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full border rounded-xl p-2 text-sm font-bold bg-slate-50" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Faculty</label>
            <input value={formData.faculty} onChange={e => setFormData({...formData, faculty: e.target.value})} className="w-full border rounded-xl p-2 text-sm font-bold bg-slate-50" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Time</label>
            <input value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full border rounded-xl p-2 text-sm font-bold bg-slate-50" placeholder="e.g. 10:00 AM" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Dept</label>
            <input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full border rounded-xl p-2 text-sm font-bold bg-slate-50" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Year</label>
            <input value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full border rounded-xl p-2 text-sm font-bold bg-slate-50" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Section</label>
            <input value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} className="w-full border rounded-xl p-2 text-sm font-bold bg-slate-50" />
          </div>
          <button type="submit" className="bg-blue-600 text-white p-2 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700">Save</button>
        </form>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {days.map(day => {
          const dayClasses = timetable
            .filter(t => t.day === day)
            .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

          return (
            <div key={day} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="bg-blue-50 py-4 border-b border-blue-100 text-center">
                <h2 className="text-lg font-black text-blue-800 uppercase tracking-widest">{day}</h2>
              </div>
              <div className="p-4 flex-1 bg-slate-50/50">
                {dayClasses.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                    <Calendar className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm font-medium">No Classes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dayClasses.map(cls => (
                      <div
                        key={cls.id}
                        className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all relative overflow-hidden group ${deletingId === cls.id ? 'opacity-0 scale-95' : 'opacity-100'}`}
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 group-hover:bg-blue-600 transition-colors" />
                        <div className="flex justify-between items-start pl-2 mb-2">
                          <h3 className="font-bold text-slate-800 text-sm leading-tight">{cls.subject}</h3>
                          <button
                            onClick={() => handleDeleteTimetable(cls.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="space-y-1.5 pl-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-blue-500" /> {cls.time}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" /> {cls.department} Y{cls.year} – {cls.section}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <UserIcon className="w-3.5 h-3.5 text-emerald-500" /> {cls.faculty}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
