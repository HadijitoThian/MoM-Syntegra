import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, RequireAuth, useAuth } from './lib/auth.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Home from './pages/Home.jsx';
import Landing from './pages/Landing.jsx';
import MeetingRecorder from './components/MeetingRecorder.jsx';
import MeetingDetail from './pages/MeetingDetail.jsx';
import Subscribe from './pages/Subscribe.jsx';
import Settings from './pages/Settings.jsx';

// Root: landing page for visitors, dashboard for logged-in users.
function Root() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-slate-500">Memuat…</div>;
  return user ? <Home /> : <Landing />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/record" element={<RequireAuth><MeetingRecorder /></RequireAuth>} />
          <Route path="/meetings/:id" element={<RequireAuth><MeetingDetail /></RequireAuth>} />
          <Route path="/subscribe" element={<RequireAuth><Subscribe /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="*" element={<Root />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
