import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, ArrowRight, Plus, Trash2, Star } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ClassroomDashboard() {
  const [data, setData] = useState({ coordinated: [], taught: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [newClass, setNewClass] = useState({ department: user?.department || '', year: 1, section: 'A' });

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const res = await api.get('/classrooms');
      setData(res.data);
    } catch (error) {
      console.error('Error fetching classrooms', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classrooms', newClass);
      toast.success('Classroom Created!');
      setShowModal(false);
      fetchClassrooms();
    } catch (err) {
      toast.error('Failed to create classroom');
    }
  };

  const handleDeleteClassroom = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this entire classroom? This will remove all associated data.')) return;
    try {
      await api.delete(`/classrooms/${id}`);
      toast.success('Classroom deleted');
      fetchClassrooms();
    } catch (e) { toast.error('Delete failed'); }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Classrooms...</div>;

  const ClassroomCard = ({ room, isCoordinator }) => (
    <div
      onClick={() => navigate(`/classrooms/${room.id}`)}
      style={isCoordinator ? { boxShadow: '0 0 0 2px #3b82f6, 0 0 20px 4px rgba(59,130,246,0.25)' } : {}}
      className={`bg-white rounded-3xl border shadow-sm transition-all duration-300 cursor-pointer overflow-hidden group relative
        ${isCoordinator
          ? 'border-blue-400 hover:border-blue-500 hover:-translate-y-1 hover:shadow-blue-200 hover:shadow-xl'
          : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
        }`}
    >
      {/* Top colour bar */}
      <div className={`h-2 ${isCoordinator ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-blue-600'}`} />

      {/* Coordinator Class badge — faculty only, top-left */}
      {isCoordinator && (
        <div className="absolute top-5 left-4 flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1 rounded-full shadow-md shadow-blue-300">
          <Star className="w-3 h-3 fill-white text-white" />
          <span className="text-[10px] font-black uppercase tracking-wider">Coordinator Class</span>
        </div>
      )}

      <div className={`p-6 ${isCoordinator ? 'pt-10' : ''}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className={`text-xl font-bold transition-colors ${isCoordinator ? 'text-blue-800 group-hover:text-blue-600' : 'text-slate-800 group-hover:text-blue-600'}`}>
              {room.department} - Section {room.section}
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Year {room.year}</p>
          </div>
          <div className="flex items-center gap-2">
            {user.role === 'admin' && (
              <button onClick={(e) => handleDeleteClassroom(e, room.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <div className={`p-2 rounded-xl ${isCoordinator ? 'bg-blue-50 text-blue-600' : 'bg-blue-50 text-blue-600'}`}>
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <span className={`text-xs font-bold uppercase tracking-wider ${isCoordinator ? 'text-blue-500' : 'text-slate-400'}`}>
            {isCoordinator ? 'My Coordinated Class' : (user.role === 'student' ? 'Student View' : 'Teacher Access')}
          </span>
          <ArrowRight className={`w-4 h-4 transition-all group-hover:translate-x-1 ${isCoordinator ? 'text-blue-400 group-hover:text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)] relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Classrooms</h1>
          <p className="text-slate-500 mt-2">Access your course materials, assignments, and alerts.</p>
        </div>
        {user?.role !== 'student' && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" /> Create Classroom
          </button>
        )}
      </div>

      {data.coordinated.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            ⭐ My Coordinated Classrooms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.coordinated.map(room => <ClassroomCard key={room.id} room={room} isCoordinator={true} />)}
          </div>
        </div>
      )}

      {data.taught.length > 0 ? (
        <div>
          {data.coordinated.length > 0 && (
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              📚 Classrooms I Teach In
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.taught.map(room => <ClassroomCard key={room.id} room={room} isCoordinator={false} />)}
          </div>
        </div>
      ) : (
        data.coordinated.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-600">No Classrooms Found</h2>
          </div>
        )
      )}

      {/* Create Classroom Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Create New Classroom</h2>
            <form onSubmit={handleCreateClassroom}>
              <input type="text" placeholder="Department (e.g. CSE)" className="w-full mb-4 p-3 border rounded-xl" required
                value={newClass.department} onChange={e => setNewClass({...newClass, department: e.target.value})} />
              <input type="number" placeholder="Year (1-4)" className="w-full mb-4 p-3 border rounded-xl" required
                value={newClass.year} onChange={e => setNewClass({...newClass, year: e.target.value})} />
              <input type="text" placeholder="Section (A/B)" className="w-full mb-6 p-3 border rounded-xl" required
                value={newClass.section} onChange={e => setNewClass({...newClass, section: e.target.value})} />
              
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
