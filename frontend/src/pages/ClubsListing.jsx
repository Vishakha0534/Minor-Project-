import React, { useState, useEffect } from 'react';
import { Palette, Camera, Code, Music, Users, Sparkles, Plus, Trash2, X, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ClubsListing() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [newClub, setNewClub] = useState({ name: '', description: '', events: '' });

  const fetchClubs = async () => {
    try {
      const res = await api.get('/clubs');
      setClubs(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clubs', newClub);
      toast.success('Club Created Successfully');
      setShowCreate(false);
      setNewClub({ name: '', description: '', events: '' });
      fetchClubs();
    } catch (e) { toast.error('Failed to create club'); }
  };

  const handleDeleteClub = async (id) => {
    try {
      setDeletingId(id);
      setTimeout(async () => {
        await api.delete(`/clubs/${id}`);
        toast.success('Club deleted successfully');
        setShowDeleteConfirm(null);
        fetchClubs();
        setDeletingId(null);
      }, 300);
    } catch (e) { 
      toast.error('Delete failed'); 
      setDeletingId(null);
    }
  };

  const getIcon = (name = '') => {
    const n = (name || '').toLowerCase();
    if (n.includes('coding')) return <Code className="w-8 h-8" />;
    if (n.includes('photo')) return <Camera className="w-8 h-8" />;
    if (n.includes('cultural')) return <Music className="w-8 h-8" />;
    return <Users className="w-8 h-8" />;
  };

  if (loading) return <div className="p-8 text-center">Loading Clubs...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">University Clubs</h1>
          <p className="text-slate-500 mt-2">Join a community, explore your passions, and build lasting memories.</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" /> Create New Club
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clubs.map(club => (
          <div 
            key={club.id} 
            className={`bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden ${deletingId === club.id ? 'opacity-0 scale-95' : 'opacity-100'}`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 inline-block text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {getIcon(club.name)}
                </div>
                {user?.role === 'admin' && (
                  <button 
                    onClick={() => setShowDeleteConfirm(club)} 
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                    title="Delete Club"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">{club.name}</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3">{club.description}</p>
              
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upcoming Events</p>
                <div className="flex flex-wrap gap-2">
                  {club.events?.split(',').map((event, idx) => (
                    <span key={idx} className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" /> {event.trim()}
                    </span>
                  ))}
                </div>
              </div>
              
              <button className="w-full mt-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-slate-200">
                Join Club
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Club Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">New University Club</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                <X className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateClub} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Club Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Coding Warriors" 
                  className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  required 
                  value={newClub.name} 
                  onChange={e => setNewClub({...newClub, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                <textarea 
                  placeholder="What is this club about?" 
                  rows={3}
                  className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
                  required 
                  value={newClub.description} 
                  onChange={e => setNewClub({...newClub, description: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Key Events (Comma Separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Hackathon, Workshop, Tech Talk" 
                  className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  required 
                  value={newClub.events} 
                  onChange={e => setNewClub({...newClub, events: e.target.value})} 
                />
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                Register Club
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
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Disband Club?</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Are you sure you want to remove <strong>{showDeleteConfirm.name}</strong>? This will dissolve the club record.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteClub(showDeleteConfirm.id)}
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
