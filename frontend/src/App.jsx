import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClassroomDashboard from './pages/ClassroomDashboard';
import ClassroomView from './pages/ClassroomView';
import AttendanceDashboard from './pages/AttendanceDashboard';
import TimetableDashboard from './pages/TimetableDashboard';
import DepartmentListing from './pages/DepartmentListing';
import DepartmentDetail from './pages/DepartmentDetail';
import ClubsListing from './pages/ClubsListing';
import Opportunities from './pages/Opportunities';
import Issues from './pages/Issues';
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes inside Layout */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="classrooms" element={<ClassroomDashboard />} />
          <Route path="classrooms/:id" element={<ClassroomView />} />
          <Route path="attendance" element={<AttendanceDashboard />} />
          <Route path="timetable" element={<TimetableDashboard />} />
          <Route path="departments" element={<DepartmentListing />} />
          <Route path="departments/:id" element={<DepartmentDetail />} />
          <Route path="clubs" element={<ClubsListing />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="issues" element={<Issues />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
