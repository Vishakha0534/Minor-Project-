import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Bot, BookOpen, LogOut, LayoutDashboard, Activity, Calendar, Building2, Sparkles, Compass, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import api from '../api/axios';
import toast, { Toaster } from 'react-hot-toast';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    // Connect to Socket.IO server
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

    // Fetch user's classrooms and join socket rooms
    const connectRooms = async () => {
      try {
        const res = await api.get('/classrooms');
        // In Phase 8, the response became an object: { coordinated: [], taught: [] }
        const { coordinated = [], taught = [] } = res.data;
        const allClassrooms = [...coordinated, ...taught];
        
        allClassrooms.forEach(room => {
          socket.emit('join_classroom', room.id);
        });
      } catch (error) {
        console.error("Socket room connection error:", error);
      }
    };

    connectRooms();

    // Listen for Real-Time Alerts!
    socket.on('classroom-alert', (alert) => {
      // Play Beep Sound
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = alert.isUrgent ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(alert.isUrgent ? 800 : 440, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);

      // Show Toast Popup
      if (alert.isUrgent) {
        toast.error(`URGENT: ${alert.message}\n- ${alert.createdBy}`, { duration: 8000, style: { background: '#fef2f2', border: '1px solid #fecdd3' } });
      } else {
        toast.success(`Alert: ${alert.message}\n- ${alert.createdBy}`, { duration: 5000 });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const navLinks = [
    { name: 'AI Chatbot', path: '/', icon: Bot },
    { name: 'Classrooms', path: '/classrooms', icon: BookOpen },
    { name: 'Attendance', path: '/attendance', icon: Activity },
    { name: 'Timetable', path: '/timetable', icon: Calendar },
    { name: 'Departments', path: '/departments', icon: Building2 },
    { name: 'Clubs', path: '/clubs', icon: Sparkles },
    { name: 'Opportunities', path: '/opportunities', icon: Compass },
    { name: 'Issues', path: '/issues', icon: Info },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col z-20">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-slate-800 text-lg">Smart Campus</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                  isActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {link.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-rose-500 font-bold hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
