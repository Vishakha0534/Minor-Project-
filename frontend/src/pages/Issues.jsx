import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, Send, MessageSquare, ChevronRight, X, Trash2, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Issues() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  
  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [newIssue, setNewIssue] = useState({ title: '', description: '', department: user.department || 'General' });

  // Respond Modal
  const [showRespond, setShowRespond] = useState(null);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('Resolved');

  // Delete Confirm Modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await api.get('/issues');
      setIssues(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/issues', newIssue);
      toast.success('Issue Raised Successfully');
      setShowCreate(false);
      fetchIssues();
    } catch (e) { toast.error('Failed to raise issue'); }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/issues/${showRespond.id}/respond`, { response, status });
      toast.success('Response Posted');
      setShowRespond(null);
      fetchIssues();
    } catch (e) { toast.error('Failed to respond'); }
  };

  const handleDeleteIssue = async (id) => {
    try {
      setDeletingId(id);
      // Wait for fade-out animation
      setTimeout(async () => {
        await api.delete(`/issues/${id}`);
        toast.success('Issue deleted successfully');
        setShowDeleteConfirm(null);
        fetchIssues();
        setDeletingId(null);
      }, 300);
    } catch (e) { 
      toast.error('Delete failed'); 
      setDeletingId(null);
    }
  };

  const getStatusStyle = (status) => {
    if (status === 'Resolved') return 'bg-emerald-100 text-emerald-700';
    if (status === 'In Progress') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };

  if (loading) return <div className="p-8 text-center">Loading Issues...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Issue Tracking</h1>
          <p className="text-slate-500 mt-2">Raise concerns and track resolution progress.</p>
        </div>
        {(user.role === 'student' || user.role === 'faculty') && (
          <button 
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg"
          >
            <AlertCircle className="w-5 h-5" /> Raise New Issue
          </button>
        )}
      </div>

      <div className="space-y-4">
        {issues.map(issue => (
          <div 
            key={issue.id} 
            className={`bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 ${deletingId === issue.id ? 'opacity-0 scale-95' : 'opacity-100'}`}
          >
            <div className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4 group">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${getStatusStyle(issue.status)}`}>
                      {issue.status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">#{issue.id.slice(0,8)}</span>
                    <span className="text-xs text-slate-400 font-medium">• {new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{issue.title}</h2>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{issue.description}</p>
                </div>
                <div className="flex flex-col items-end gap-4">
                  <div className="flex gap-2">
                    {user.role === 'admin' && (
                      <button 
                        onClick={() => setShowDeleteConfirm(issue)} 
                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                        title="Delete Issue"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    {(user.role === 'admin' || (user.role === 'hod' && issue.status === 'Pending')) && (
                      <button 
                        onClick={() => { setShowRespond(issue); setResponse(issue.response || ''); }}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors"
                      >
                        Respond
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {issue.response && (
                <div className="mt-6 p-5 bg-blue-50 rounded-2xl border border-blue-100 relative">
                  <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
                    <MessageSquare className="w-3.5 h-3.5" /> Response from {issue.respondedBy}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed italic">"{issue.response}"</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                    {issue.raisedBy.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-slate-500">Raised by {issue.raisedBy} ({issue.role})</span>
                </div>
                {issue.department && (
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{issue.department} Dept</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {issues.length === 0 && <div className="text-center py-20 text-slate-400 font-medium italic">No issues reported yet.</div>}
      </div>

      {/* Raise Issue Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Report an Issue</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                <X className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Issue Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. WiFi connection broken in Library" 
                  className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  required 
                  value={newIssue.title} 
                  onChange={e => setNewIssue({...newIssue, title: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Department (Optional)</label>
                <select 
                  className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  value={newIssue.department} 
                  onChange={e => setNewIssue({...newIssue, department: e.target.value})}
                >
                  <option value="General">General/Administration</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="Hostel">Hostel</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Describe the Issue</label>
                <textarea 
                  placeholder="Details..." 
                  rows={4}
                  className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
                  required 
                  value={newIssue.description} 
                  onChange={e => setNewIssue({...newIssue, description: e.target.value})} 
                />
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                Submit Report
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Respond Modal */}
      {showRespond && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Official Response</h2>
              <button onClick={() => setShowRespond(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                <X className="text-slate-400" />
              </button>
            </div>
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Issue</p>
              <p className="text-sm font-bold text-slate-800">{showRespond.title}</p>
            </div>
            <form onSubmit={handleRespond} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Update Status</label>
                <div className="flex gap-2">
                  {['In Progress', 'Resolved'].map(s => (
                    <button 
                      key={s} type="button" 
                      onClick={() => setStatus(s)}
                      className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${status === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Your Response</label>
                <textarea 
                  placeholder="Provide an update or resolution..." 
                  rows={4}
                  className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
                  required 
                  value={response} 
                  onChange={e => setResponse(e.target.value)} 
                />
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-lg">
                Post Response
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Delete Issue?</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Are you sure you want to delete this issue? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteIssue(showDeleteConfirm.id)}
                className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
