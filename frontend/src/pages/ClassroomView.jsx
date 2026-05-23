import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen, FileText, Calendar, Bell, Download, Upload, AlertCircle, Folder, Plus, Edit, CheckSquare, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ClassroomView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assignments');
  const [data, setData] = useState({ assignments: [], notes: [], folders: [], timetable: [], alerts: [] });
  const [loading, setLoading] = useState(true);

  // Folder state
  const [currentFolder, setCurrentFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');

  // Attendance state
  const [students, setStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceSubject, setAttendanceSubject] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState({});

  // Modals state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Form states
  const [newAssign, setNewAssign] = useState({ title: '', description: '', subject: '', deadline: '', file: null });
  const [newNote, setNewNote] = useState({ title: '', description: '', file: null });

  useEffect(() => {
    fetchClassroomData();
  }, [id]);

  const fetchClassroomData = async () => {
    try {
      const res = await api.get(`/classrooms/${id}/details`);
      setData(res.data);
      if (user.role !== 'student') fetchStudents();
    } catch (error) { toast.error('Failed to load classroom data'); } 
    finally { setLoading(false); }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/attendance/classroom/${id}`);
      setStudents(res.data);
      const initialRecords = {};
      res.data.forEach(s => initialRecords[s.id] = 'Present');
      setAttendanceRecords(initialRecords);
    } catch (e) { console.error(e); }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName) return;
    try {
      await api.post(`/classrooms/${id}/folders`, { name: newFolderName });
      setNewFolderName('');
      fetchClassroomData();
      toast.success('Folder Created');
    } catch (e) { toast.error('Error creating folder'); }
  };

  const handleUploadAssignment = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', newAssign.title);
    formData.append('description', newAssign.description);
    formData.append('subject', newAssign.subject);
    formData.append('deadline', new Date(newAssign.deadline).toISOString());
    if (newAssign.file) formData.append('file', newAssign.file);

    try {
      await api.post(`/classrooms/${id}/assignments`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      toast.success('Assignment Uploaded!');
      setShowAssignModal(false);
      fetchClassroomData();
    } catch (e) { toast.error('Failed to upload assignment'); }
  };

  const handleUploadNote = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', newNote.title);
    formData.append('description', newNote.description);
    formData.append('folderId', currentFolder);
    if (newNote.file) formData.append('file', newNote.file);

    try {
      await api.post(`/classrooms/${id}/notes`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      toast.success('Note Uploaded!');
      setShowNoteModal(false);
      fetchClassroomData();
    } catch (e) { toast.error('Failed to upload note'); }
  };

  const handleExtendDeadline = async (assignmentId) => {
    const newDate = prompt("Enter new deadline (YYYY-MM-DD):");
    if (!newDate) return;
    try {
      await api.put(`/classrooms/${id}/assignments/${assignmentId}`, { deadline: new Date(newDate).toISOString() });
      fetchClassroomData();
      toast.success('Deadline Extended!');
    } catch (e) { toast.error('Error extending deadline'); }
  };

  const handleMarkAttendance = async () => {
    if (!attendanceSubject) return toast.error('Please enter a subject');
    const records = Object.keys(attendanceRecords).map(studentId => ({ studentId, status: attendanceRecords[studentId] }));
    try {
      await api.post(`/attendance/mark`, { classroomId: id, subject: attendanceSubject, date: attendanceDate, records });
      toast.success('Attendance Marked!');
    } catch (e) { toast.error('Failed to mark attendance'); }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await api.delete(`/classrooms/assignments/${id}`);
      toast.success('Deleted');
      fetchClassroomData();
    } catch (e) { toast.error('Delete failed'); }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      await api.delete(`/classrooms/notes/${id}`);
      toast.success('Deleted');
      fetchClassroomData();
    } catch (e) { toast.error('Delete failed'); }
  };

  const downloadFile = (fileUrl) => {
    if (!fileUrl) return toast.error('No file attached');
    const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.open(`${url}${fileUrl}`, '_blank');
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  const tabs = [
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'notes', label: 'Folders & Notes', icon: BookOpen },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'alerts', label: 'Alerts', icon: Bell },
  ];
  if (user?.role !== 'student') tabs.push({ id: 'attendance', label: 'Mark Attendance', icon: CheckSquare });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[calc(100vh-4rem)] relative">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-bl-full -z-0 opacity-50"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-slate-800">Classroom Hub</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 min-h-[400px]">
        
        {/* Assignments */}
        {activeTab === 'assignments' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Assignments</h2>
              {user?.role !== 'student' && (
                <button onClick={() => setShowAssignModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
                  <Upload className="w-4 h-4" /> Create Assignment
                </button>
              )}
            </div>
            <div className="grid gap-4">
              {data.assignments.map(a => (
                <div key={a.id} className="p-4 border rounded-2xl flex justify-between items-center bg-slate-50 group">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg">{a.title} <span className="text-sm font-normal text-slate-500">({a.subject})</span></h3>
                    <p className="text-sm text-slate-600 mt-1">{a.description}</p>
                    <p className="text-xs font-bold text-rose-500 mt-2">Deadline: {new Date(a.deadline).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.role !== 'student' && (
                      <button onClick={() => handleExtendDeadline(a.id)} className="p-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-100 flex items-center gap-1">
                        <Edit className="w-3 h-3" /> Extend
                      </button>
                    )}
                    {(user.role === 'admin' || a.facultyId === user.id) && (
                      <button onClick={() => handleDeleteAssignment(a.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    {a.fileUrl && (
                      <button onClick={() => downloadFile(a.fileUrl)} className="p-3 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-full flex gap-2 items-center text-sm font-bold">
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Folders & Notes */}
        {activeTab === 'notes' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {currentFolder ? (
                  <><button onClick={() => setCurrentFolder(null)} className="text-blue-500 hover:underline">Root</button> / {data.folders.find(f => f.id === currentFolder)?.name}</>
                ) : 'Folders & Files'}
              </h2>
              {user?.role !== 'student' && (
                <div className="flex gap-2">
                  {!currentFolder ? (
                    <form onSubmit={handleCreateFolder} className="flex gap-2">
                      <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="New Folder Name" className="border px-3 py-2 rounded-xl text-sm" />
                      <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4"/> Folder</button>
                    </form>
                  ) : (
                    <button onClick={() => setShowNoteModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
                      <Upload className="w-4 h-4" /> Upload File
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {!currentFolder && data.folders.map(f => (
                <div key={f.id} onClick={() => setCurrentFolder(f.id)} className="p-6 border rounded-2xl flex flex-col items-center cursor-pointer hover:bg-blue-50 transition-colors shadow-sm bg-white">
                  <Folder className="w-12 h-12 text-blue-400 mb-3 fill-blue-100" />
                  <span className="font-bold text-sm text-slate-700 text-center">{f.name}</span>
                </div>
              ))}
              {data.notes.filter(n => n.folderId === currentFolder).map(n => (
                <div key={n.id} className="p-4 border rounded-2xl flex flex-col items-center bg-slate-50 relative group">
                   {(user.role === 'admin' || n.createdBy === user.name) && (
                    <button onClick={() => handleDeleteNote(n.id)} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <FileText className="w-10 h-10 text-rose-400 mb-2" />
                  <span className="font-bold text-sm text-slate-700 text-center">{n.title}</span>
                  <p className="text-xs text-slate-500 mt-1 text-center">{n.description}</p>
                  {n.fileUrl && (
                    <button onClick={() => downloadFile(n.fileUrl)} className="text-xs bg-white border px-3 py-1.5 rounded-lg text-slate-700 hover:text-blue-600 mt-3 font-bold flex items-center gap-1 shadow-sm">
                      <Download className="w-3 h-3"/> Download File
                    </button>
                  )}
                </div>
              ))}
            </div>
            {currentFolder && data.notes.filter(n => n.folderId === currentFolder).length === 0 && (
              <div className="text-center p-8 text-slate-400 font-medium">This folder is empty.</div>
            )}
          </div>
        )}

        {/* Timetable Grid */}
        {activeTab === 'timetable' && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Weekly Class Schedule</h2>

            {data.timetable.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No timetable set for this classroom yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                  const dayEntries = data.timetable
                    .filter(t => t.day === day)
                    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

                  return (
                    <div key={day} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                      {/* Day header */}
                      <div className="bg-slate-800 text-center py-3">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">{day}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">{dayEntries.length} lecture{dayEntries.length !== 1 ? 's' : ''}</p>
                      </div>

                      <div className="p-2 space-y-2 bg-slate-50/50">
                        {dayEntries.length === 0 ? (
                          <div className="py-6 flex flex-col items-center text-slate-300">
                            <Calendar className="w-5 h-5 mb-1" />
                            <p className="text-[10px] font-medium">No classes</p>
                          </div>
                        ) : (
                          dayEntries.map((entry, idx) => (
                            <div key={entry.id || idx} className="bg-white rounded-xl border border-blue-100 p-2.5 shadow-sm">
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">L{idx + 1}</span>
                              </div>
                              <p className="text-xs font-bold text-slate-800 leading-tight">{entry.subject}</p>
                              <p className="text-[10px] text-blue-600 font-semibold mt-1">{entry.time}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">👤 {entry.faculty}</p>
                            </div>
                          ))
                        )}

                        {/* Lunch break */}
                        {dayEntries.length > 0 && (
                          <div className="flex items-center gap-1.5 px-2.5 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                            <span className="text-amber-500">☕</span>
                            <div>
                              <p className="text-[9px] font-black text-amber-600 uppercase tracking-wider">Lunch</p>
                              <p className="text-[9px] text-amber-500 font-medium">01:00 – 02:00 PM</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Alerts & Notifications */}
        {activeTab === 'alerts' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Classroom Alerts</h2>
              {user?.role !== 'student' && (
                <button 
                  onClick={async () => {
                    const msg = prompt("Enter alert message:");
                    const urgent = window.confirm("Is this urgent?");
                    if (!msg) return;
                    try {
                      await api.post(`/classrooms/${id}/alerts`, { message: msg, isUrgent: urgent });
                      toast.success('Alert Sent!');
                      fetchClassroomData();
                    } catch (e) { toast.error('Error sending alert'); }
                  }}
                  className="bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" /> Broadcast Alert
                </button>
              )}
            </div>
            <div className="space-y-4">
              {data.alerts.map((alert, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border flex items-start gap-4 transition-all ${alert.isUrgent ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
                  <div className={`p-2 rounded-xl ${alert.isUrgent ? 'bg-rose-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs font-bold text-slate-400 uppercase">{alert.isUrgent ? 'Urgent Alert' : 'Notification'}</p>
                      <p className="text-[10px] font-bold text-slate-400">{new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                    <p className={`text-sm font-bold leading-relaxed ${alert.isUrgent ? 'text-rose-900' : 'text-slate-700'}`}>
                      {alert.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold">— {alert.createdBy}</p>
                  </div>
                </div>
              ))}
              {data.alerts.length === 0 && <p className="text-center py-10 text-slate-400 font-medium italic">No alerts yet.</p>}
            </div>
          </div>
        )}

        {/* Mark Attendance (Faculty) or View Attendance (Student) */}
        {activeTab === 'attendance' && (
          <div>
            {user.role !== 'student' ? (
              <>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="border p-3 rounded-xl font-bold text-slate-700 bg-slate-50" />
                  <input type="text" placeholder="Subject Name (e.g. Physics)" value={attendanceSubject} onChange={e => setAttendanceSubject(e.target.value)} className="border p-3 rounded-xl flex-1 font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50" />
                  <button onClick={handleMarkAttendance} className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100">
                    Submit Attendance
                  </button>
                </div>
                
                <div className="border rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="p-4">Student Name</th>
                        <th className="p-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(student => (
                        <tr key={student.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-700">{student.name}</td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button 
                              onClick={() => setAttendanceRecords({...attendanceRecords, [student.id]: 'Present'})}
                              className={`px-5 py-2 rounded-full text-xs font-black transition-all ${attendanceRecords[student.id] === 'Present' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            >PRESENT</button>
                            <button 
                              onClick={() => setAttendanceRecords({...attendanceRecords, [student.id]: 'Absent'})}
                              className={`px-5 py-2 rounded-full text-xs font-black transition-all ${attendanceRecords[student.id] === 'Absent' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            >ABSENT</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div>
                <div className="bg-blue-600 p-6 rounded-3xl text-white mb-8 flex justify-between items-center shadow-lg shadow-blue-100">
                  <div>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Your Attendance</p>
                    <h3 className="text-3xl font-black">{Math.round((data.studentAttendance?.filter(a => a.status === 'Present').length / data.studentAttendance?.length) * 100) || 0}%</h3>
                  </div>
                  <div className="p-4 bg-white/20 rounded-2xl">
                    <CheckSquare className="w-8 h-8" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-6">Recent 50 Days History</h2>
                <div className="border rounded-2xl overflow-hidden max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest sticky top-0 z-10">
                      <tr>
                        <th className="p-4 border-b">Date</th>
                        <th className="p-4 border-b">Subject</th>
                        <th className="p-4 border-b text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.studentAttendance?.map((a, idx) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="p-4 text-sm font-bold text-slate-600">{new Date(a.date).toLocaleDateString()}</td>
                          <td className="p-4 text-sm font-bold text-slate-800">{a.subject}</td>
                          <td className="p-4 text-right">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${a.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Assignment Upload Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Create Assignment</h2>
              <button onClick={() => setShowAssignModal(false)}><X className="text-slate-400 hover:text-rose-500"/></button>
            </div>
            <form onSubmit={handleUploadAssignment}>
              <input type="text" placeholder="Assignment Title" className="w-full p-3 border rounded-xl mb-4" required value={newAssign.title} onChange={e => setNewAssign({...newAssign, title: e.target.value})} />
              <input type="text" placeholder="Subject Name" className="w-full p-3 border rounded-xl mb-4" required value={newAssign.subject} onChange={e => setNewAssign({...newAssign, subject: e.target.value})} />
              <textarea placeholder="Description / Instructions" className="w-full p-3 border rounded-xl mb-4" required value={newAssign.description} onChange={e => setNewAssign({...newAssign, description: e.target.value})} />
              <label className="block text-sm font-bold text-slate-600 mb-2">Deadline</label>
              <input type="date" className="w-full p-3 border rounded-xl mb-4 font-bold text-slate-700" required value={newAssign.deadline} onChange={e => setNewAssign({...newAssign, deadline: e.target.value})} />
              
              <label className="block text-sm font-bold text-slate-600 mb-2">Attach File (Optional)</label>
              <input type="file" className="w-full p-2 border rounded-xl mb-6 bg-slate-50" onChange={e => setNewAssign({...newAssign, file: e.target.files[0]})} />
              
              <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700">Upload Assignment</button>
            </form>
          </div>
        </div>
      )}

      {/* Note Upload Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Upload Note/File</h2>
              <button onClick={() => setShowNoteModal(false)}><X className="text-slate-400 hover:text-rose-500"/></button>
            </div>
            <form onSubmit={handleUploadNote}>
              <input type="text" placeholder="File Title" className="w-full p-3 border rounded-xl mb-4" required value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} />
              <textarea placeholder="Description" className="w-full p-3 border rounded-xl mb-4" required value={newNote.description} onChange={e => setNewNote({...newNote, description: e.target.value})} />
              
              <label className="block text-sm font-bold text-slate-600 mb-2">Attach File</label>
              <input type="file" className="w-full p-2 border rounded-xl mb-6 bg-slate-50" required onChange={e => setNewNote({...newNote, file: e.target.files[0]})} />
              
              <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700">Upload File</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
