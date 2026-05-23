import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Building2, Users, UserCheck, Bell, Briefcase, GraduationCap, ArrowLeft, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function DepartmentDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('faculty');

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/departments/${id}`);
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await api.delete(`/admin/notices/${noticeId}`);
      fetchDetail();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Details...</div>;
  if (!data) return <div className="p-8 text-center">Department not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
      <Link to="/departments" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Departments
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Info & HOD */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <Building2 className="w-12 h-12 text-blue-600 mb-4" />
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{data.name}</h1>
            <p className="text-slate-500 text-sm">Department of {data.name} Engineering & Sciences.</p>
          </div>

          <div className="bg-slate-800 text-white rounded-3xl p-8 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-700 rounded-bl-full opacity-50"></div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Head of Department</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center text-2xl font-black">
                {data.hod?.name?.[0]}
              </div>
              <div>
                <p className="text-xl font-bold">{data.hod?.name || 'Not Assigned'}</p>
                <p className="text-sm text-slate-400">{data.hod?.email}</p>
              </div>
            </div>
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors border border-white/10">
              Contact HOD
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-rose-500" /> Recent Updates
            </h3>
            <div className="space-y-4">
              {data.notices.map((n, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-start group">
                  <div>
                    <p className="text-sm font-bold text-slate-800 line-clamp-1">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{n.date}</p>
                  </div>
                  {user?.role === 'admin' && (
                    <button onClick={() => handleDeleteNotice(n.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {data.notices.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">No recent updates</p>}
            </div>
          </div>
        </div>

        {/* Right Column: Member Lists */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="flex border-b border-slate-100">
              <button 
                onClick={() => setActiveTab('faculty')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'faculty' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Briefcase className="w-4 h-4" /> Faculty Members ({data.faculty.length})
              </button>
              <button 
                onClick={() => setActiveTab('students')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'students' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <GraduationCap className="w-4 h-4" /> Students ({data.students.length})
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto max-h-[600px]">
              {activeTab === 'faculty' ? (
                <div className="grid gap-4">
                  {data.faculty.map((f) => (
                    <div key={f.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center group hover:bg-white hover:border hover:shadow-sm border-transparent border transition-all">
                      <div>
                        <p className="font-bold text-slate-800">{f.name}</p>
                        <p className="text-xs text-slate-500">{f.email}</p>
                      </div>
                      <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-full uppercase">
                        {f.subjects?.split(',')[0] || 'Faculty'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {data.students.map((s) => (
                    <div key={s.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center group hover:bg-white hover:border hover:shadow-sm border-transparent border transition-all">
                      <div>
                        <p className="font-bold text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-500">Year {s.year} - Section {s.section}</p>
                      </div>
                      <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
