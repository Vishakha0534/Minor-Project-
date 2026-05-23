import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, UserCheck, ArrowRight } from 'lucide-react';
import api from '../api/axios';

export default function DepartmentListing() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Departments...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800">University Departments</h1>
        <p className="text-slate-500 mt-2">Manage and explore all academic departments and their leadership.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div 
            key={dept.id}
            onClick={() => navigate(`/departments/${dept.id}`)}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group p-6"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    {i}+
                  </div>
                ))}
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{dept.name}</h2>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span className="font-medium">HOD: {dept.hodName}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Faculty</p>
                <p className="text-lg font-bold text-slate-700">{dept.facultyCount}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Students</p>
                <p className="text-lg font-bold text-slate-700">{dept.studentCount}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-blue-600 font-bold text-sm">
              <span>View Department Details</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
