import React, { useState, useEffect } from 'react';
import { Briefcase, Trophy, GraduationCap, Filter, Plus, Calendar, ExternalLink, X, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Opportunities() {
  const { user } = useAuth();
  const [opps, setOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  
  // Admin Modal state
  const [showModal, setShowModal] = useState(false);
  const [newOpp, setNewOpp] = useState({ type: 'Hackathon', title: '', description: '', organizer: '', deadline: '', applyUrl: '' });

  useEffect(() => {
    fetchOpps();
  }, [filter]);

  const fetchOpps = async () => {
    try {
      const res = await api.get(`/opportunities?type=${filter}`);
      setOpps(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/opportunities', newOpp);
      toast.success('Opportunity Posted!');
      setShowModal(false);
      fetchOpps();
    } catch (e) { toast.error('Failed to post'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this opportunity?')) return;
    try {
      await api.delete(`/opportunities/${id}`);
      toast.success('Deleted');
      fetchOpps();
    } catch (e) { toast.error('Delete failed'); }
  };

  const getIcon = (type) => {
    if (type === 'Hackathon') return <Trophy className="w-5 h-5 text-amber-500" />;
    if (type === 'Internship') return <Briefcase className="w-5 h-5 text-blue-500" />;
    return <GraduationCap className="w-5 h-5 text-emerald-500" />;
  };

  if (loading) return <div className="p-8 text-center">Loading Opportunities...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Opportunities Hub</h1>
          <p className="text-slate-500 mt-2">Latest Hackathons, Internships, and Scholarships curated for you.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={filter} onChange={e => setFilter(e.target.value)}
            className="p-3 border rounded-2xl bg-white text-sm font-bold text-slate-600 outline-none focus:border-blue-500 shadow-sm"
          >
            <option value="">All Types</option>
            <option value="Hackathon">Hackathons</option>
            <option value="Internship">Internships</option>
            <option value="Scholarship">Scholarships</option>
          </select>
          {user.role === 'admin' && (
            <button 
              onClick={() => setShowModal(true)}
              className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" /> Post New
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {opps.map(opp => (
          <div key={opp.id} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              {getIcon(opp.type)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                  opp.type === 'Hackathon' ? 'bg-amber-100 text-amber-700' : 
                  opp.type === 'Internship' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {opp.type}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                    <Calendar className="w-3 h-3" /> Ends: {opp.deadline}
                  </div>
                  {user.role === 'admin' && (
                    <button onClick={() => handleDelete(opp.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">{opp.title}</h2>
              <p className="text-sm font-bold text-slate-500 mb-3">Organized by {opp.organizer}</p>
              <p className="text-sm text-slate-600 line-clamp-2 mb-6">{opp.description}</p>
              
              <a 
                href={opp.applyUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Learn More & Apply <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
        {opps.length === 0 && <div className="lg:col-span-2 text-center py-20 text-slate-400 font-medium italic">No opportunities found for this category.</div>}
      </div>

      {/* Admin Post Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Post Opportunity</h2>
              <button onClick={() => setShowModal(false)}><X className="text-slate-400 hover:text-rose-500"/></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <select className="w-full p-3 border rounded-xl" required value={newOpp.type} onChange={e => setNewOpp({...newOpp, type: e.target.value})}>
                <option value="Hackathon">Hackathon</option>
                <option value="Internship">Internship</option>
                <option value="Scholarship">Scholarship</option>
              </select>
              <input type="text" placeholder="Title" className="w-full p-3 border rounded-xl" required value={newOpp.title} onChange={e => setNewOpp({...newOpp, title: e.target.value})} />
              <input type="text" placeholder="Organizer (e.g. Google)" className="w-full p-3 border rounded-xl" required value={newOpp.organizer} onChange={e => setNewOpp({...newOpp, organizer: e.target.value})} />
              <textarea placeholder="Description" className="w-full p-3 border rounded-xl" required value={newOpp.description} onChange={e => setNewOpp({...newOpp, description: e.target.value})} />
              <input type="date" className="w-full p-3 border rounded-xl" required value={newOpp.deadline} onChange={e => setNewOpp({...newOpp, deadline: e.target.value})} />
              <input type="url" placeholder="Application URL" className="w-full p-3 border rounded-xl" value={newOpp.applyUrl} onChange={e => setNewOpp({...newOpp, applyUrl: e.target.value})} />
              
              <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors">Post Now</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
