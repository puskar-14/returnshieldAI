import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReturnCases from './pages/ReturnCases';
import CaseDetail from './pages/CaseDetail';
import ClientsDirectory from './pages/ClientsDirectory';
import ModelEvaluation from './pages/ModelEvaluation';
import ThresholdSimulator from './pages/ThresholdSimulator';
import ModelMonitoring from './pages/ModelMonitoring';
import Sidebar from './components/Sidebar';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <div className="flex h-screen overflow-hidden text-slate-800 bg-[#f0f7fc]">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        {children}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/returns" element={<ProtectedRoute><ReturnCases /></ProtectedRoute>} />
          <Route path="/returns/:id" element={<ProtectedRoute><CaseDetail /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><ClientsDirectory /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><ClientsDirectory /></ProtectedRoute>} />
          <Route path="/evaluation" element={<ProtectedRoute><ModelEvaluation /></ProtectedRoute>} />
          <Route path="/simulator" element={<ProtectedRoute><ThresholdSimulator /></ProtectedRoute>} />
          <Route path="/monitoring" element={<ProtectedRoute><ModelMonitoring /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
