import React, { useState, useEffect, useRef } from 'react';
import { Bot, GraduationCap, Send, User, LogOut, Calendar, Clock, BookOpen, AlertCircle, CheckCircle2, Paperclip, Loader2, FileText, Star } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'bot', text: 'Hello! I am your advanced Smart Campus AI. You can ask me about your attendance, timetable, or upload PDF notes for me to summarize!' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  
  const [profile, setProfile] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, timetableRes, attendanceRes] = await Promise.all([
          api.get('/user/profile'),
          api.get('/user/timetable'),
          api.get('/user/attendance')
        ]);
        setProfile(profileRes.data);
        setTimetable(timetableRes.data);
        setAttendance(attendanceRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom of chat
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading, isUploading]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message;
    setChatHistory(prev => [...prev, { sender: 'user', text: userMessage }]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/chat', { message: userMessage });
      setChatHistory(prev => [...prev, { sender: 'bot', text: response.data.reply }]);
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response && error.response.status === 401) {
        setChatHistory(prev => [...prev, { sender: 'bot', text: 'Your session has expired. Please log in again.' }]);
        logout();
      } else {
        setChatHistory(prev => [...prev, { sender: 'bot', text: 'Sorry, I am having trouble connecting to my neural network.' }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setChatHistory(prev => [...prev, { sender: 'user', text: `📎 Uploaded Document: ${file.name}` }]);
    setIsUploading(true);

    try {
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setChatHistory(prev => [...prev, { sender: 'bot', text: `✅ ${response.data.message}` }]);
    } catch (error) {
      console.error('Upload error:', error);
      setChatHistory(prev => [...prev, { sender: 'bot', text: '❌ Failed to process the document. Ensure it is a valid PDF or text file.' }]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysClasses = timetable.filter(t => t.day === today);

  const totalClasses = attendance.length;
  const presentClasses = attendance.filter(a => a.status === 'Present').length;
  const attendancePercentage = totalClasses === 0 ? 0 : Math.round((presentClasses / totalClasses) * 100);

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 font-sans selection:bg-blue-500/30">
      {/* Main Content Layout */}
      <main className="px-4 py-8 flex gap-6 h-[calc(100vh-2rem)] flex-col lg:flex-row">
        
        {/* Sidebar Data Panel */}
        <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* User Profile Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0"></div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
              <User className="w-4 h-4" /> Academic Profile
            </h2>
            <div className="space-y-3 relative z-10 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Department</span>
                <span className="text-slate-800 font-semibold">{profile?.department || 'N/A'}</span>
              </div>
              {profile?.year && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Year & Section</span>
                  <span className="text-slate-800 font-semibold">Year {profile.year} - {profile.section}</span>
                </div>
              )}
              {profile?.coordinator && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-500 block mb-2 uppercase">Faculty Coordinator</span>
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <p className="text-blue-900 font-bold">{profile.coordinator.name}</p>
                    <p className="text-xs text-blue-600 mt-0.5 font-medium">{profile.coordinator.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Widget */}
          {user?.role === 'student' && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Overall Attendance
              </h2>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={attendancePercentage >= 75 ? "text-emerald-500" : "text-rose-500"}
                      strokeWidth="3"
                      strokeDasharray={`${attendancePercentage}, 100`}
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-sm font-bold text-slate-700">{attendancePercentage}%</span>
                </div>
                <div className="text-sm">
                  <p className="text-slate-700"><span className="text-emerald-600 font-bold">{presentClasses}</span> Attended</p>
                  <p className="text-slate-500"><span className="text-slate-700 font-medium">{totalClasses}</span> Total Classes</p>
                </div>
              </div>
            </div>
          )}

          {/* Today's Timetable */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex-1">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {user?.role === 'student' ? "Today's Classes" : "Today's Teaching"}
              </div>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-semibold">{today}</span>
            </h2>

            {todaysClasses.length > 0 ? (
              <div className="space-y-3">
                {todaysClasses.map((cls, idx) => {
                  const isCoord = cls.isCoordinated;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-colors ${
                        isCoord
                          ? 'bg-amber-50 border-amber-200 hover:border-amber-400'
                          : 'bg-slate-50 border-slate-100 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start gap-1.5 mb-1.5">
                        {isCoord && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 flex-shrink-0 mt-0.5" />}
                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{cls.subject}</p>
                      </div>
                      {isCoord && (
                        <span className="inline-block text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full mb-1.5 border border-amber-200">
                          Coordinator Class
                        </span>
                      )}
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-blue-500" /> {cls.time}</span>
                        {user?.role === 'student' && (
                          <span className="flex items-center gap-1"><User className="w-3 h-3 text-slate-400" /> {cls.faculty}</span>
                        )}
                        {(user?.role === 'faculty' || user?.role === 'hod') && (
                          <span className="text-slate-400">{cls.department} Y{cls.year}–{cls.section}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm font-medium">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No classes scheduled for today.
              </div>
            )}
          </div>
        </aside>

        {/* Chat Area - Instagram/iMessage Style */}
        <section className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative min-h-[500px]">
          
          <div className="bg-white p-4 border-b border-slate-100 flex items-center gap-3 shadow-sm z-10">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 leading-tight">Campus AI</h2>
              <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar bg-slate-50/50">
            {chatHistory.map((chat, index) => (
              <div key={index} className={`flex items-end gap-2 ${chat.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                {chat.sender === 'bot' && (
                  <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 shadow-sm mb-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm ${
                  chat.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm'
                }`}>
                  {chat.text}
                </div>
              </div>
            ))}
            
            {(isLoading || isUploading) && (
              <div className="flex items-end gap-2">
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 shadow-sm mb-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm p-4 flex items-center gap-2 shadow-sm">
                  {isUploading ? (
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin text-blue-600" /> Analyzing Document...
                    </span>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    </>
                  )}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <form onSubmit={sendMessage} className="relative flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.txt"
                className="hidden"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0"
                title="Upload Notes (PDF/TXT)"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message Campus AI..."
                className="w-full bg-slate-100 text-slate-800 placeholder:text-slate-500 rounded-full py-3 px-5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm"
              />
              <button 
                type="submit"
                disabled={!message.trim() || isLoading || isUploading}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <div className="text-center mt-2">
               <span className="text-[10px] text-slate-400 font-medium">Smart Campus AI can make mistakes. Verify important academic information.</span>
            </div>
          </div>
        </section>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}} />
    </div>
  );
}
