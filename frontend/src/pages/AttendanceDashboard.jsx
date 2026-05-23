import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import { Download, Calendar, Activity, Database } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AttendanceDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('graph'); // 'graph' or 'excel'

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      if (user.role === 'admin') {
        const res = await api.get('/attendance/admin/all');
        setData(res.data);
      } else if (user.role === 'faculty') {
        const res = await api.get('/attendance/faculty/all');
        setData(res.data);
      } else {
        const res = await api.get('/user/attendance');
        setData(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_Export_${user.name}.xlsx`);
  };

  if (loading) return <div className="p-8 text-center">Loading Analytics...</div>;

  // --- Processing ---
  const subjectStats = {};
  if (user.role === 'student') {
    data.forEach(att => {
      if (!subjectStats[att.subject]) {
        subjectStats[att.subject] = { name: att.subject, present: 0, total: 0 };
      }
      subjectStats[att.subject].total++;
      if (att.status === 'Present') subjectStats[att.subject].present++;
    });
  }
  const chartData = Object.values(subjectStats).map(s => ({
    ...s,
    percentage: Math.round((s.present / s.total) * 100)
  }));

  const dailyStats = {};
  if (user.role !== 'student') {
    data.forEach(att => {
      if (!dailyStats[att.date]) dailyStats[att.date] = { date: att.date, Present: 0, Absent: 0 };
      dailyStats[att.date][att.status]++;
    });
  }
  const adminChartData = Object.values(dailyStats).sort((a,b) => new Date(a.date) - new Date(b.date));

  // Excel Matrix
  const dates = [...new Set(data.map(d => d.date))].sort((a,b) => new Date(b) - new Date(a)).slice(0, 15);
  const studentIds = [...new Set(data.map(d => d.studentName || d.studentId))];
  const pivotedData = studentIds.map(student => {
    const row = { student };
    dates.forEach(date => {
      const record = data.find(d => (d.studentName === student || d.studentId === student) && d.date === date);
      row[date] = record ? record.status : '-';
    });
    return row;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Attendance Dashboard</h1>
          <p className="text-slate-500 mt-2">Comprehensive role-based analytics.</p>
        </div>
        <div className="flex gap-3">
          {(user.role === 'admin' || user.role === 'faculty') && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setViewMode('graph')} className={`px-4 py-2 rounded-lg text-sm font-bold ${viewMode === 'graph' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Graph</button>
              <button onClick={() => setViewMode('excel')} className={`px-4 py-2 rounded-lg text-sm font-bold ${viewMode === 'excel' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Excel Matrix</button>
            </div>
          )}
          <button onClick={exportToExcel} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-emerald-700">
            <Download className="w-5 h-5" /> Export
          </button>
        </div>
      </div>

      {viewMode === 'graph' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm min-h-[400px]">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" /> Attendance Trends
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              {user.role === 'student' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#2563eb" radius={[6,6,0,0]} barSize={40} />
                </BarChart>
              ) : (
                <BarChart data={adminChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Present" stackId="a" fill="#10b981" radius={[0,0,6,6]} barSize={40} />
                  <Bar dataKey="Absent" stackId="a" fill="#f43f5e" radius={[6,6,0,0]} barSize={40} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-900 text-white p-8 rounded-[2rem] flex flex-col justify-center">
            <Database className="w-12 h-12 text-blue-400 mb-6" />
            <h3 className="text-5xl font-black">{data.length}</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Total Logs Tracking</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 border-r border-b font-black text-slate-400 uppercase sticky left-0 bg-slate-50 z-10">Student</th>
                  {dates.map(date => (
                    <th key={date} className="p-4 border-b border-r text-center font-black text-slate-400 uppercase whitespace-nowrap">{date.split('-').slice(1).join('/')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pivotedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-4 border-r border-b font-bold text-slate-800 sticky left-0 bg-white z-10">{row.student}</td>
                    {dates.map(date => (
                      <td key={date} className="p-4 border-b border-r text-center">
                        {row[date] === 'Present' ? (
                          <span className="w-6 h-6 bg-emerald-500 text-white rounded-md inline-flex items-center justify-center font-black text-[10px]">P</span>
                        ) : row[date] === 'Absent' ? (
                          <span className="w-6 h-6 bg-rose-500 text-white rounded-md inline-flex items-center justify-center font-black text-[10px]">A</span>
                        ) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
