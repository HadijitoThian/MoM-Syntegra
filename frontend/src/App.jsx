import { useEffect } from 'react';
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

// Read from Vite at build time. If unset, fall back to in-app Landing.jsx.
const EXTERNAL_LANDING_URL = import.meta.env.VITE_LANDING_URL || '';

// Root: dashboard for logged-in users, otherwise either redirect to external
// landing site OR render our built-in landing page.
function Root() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user && EXTERNAL_LANDING_URL) {
      window.location.replace(EXTERNAL_LANDING_URL);
    }
  }, [user, loading]);

  if (loading) return <div className="p-6 text-slate-500">Memuat…</div>;
  if (user) return <Home />;
  if (EXTERNAL_LANDING_URL) return <div className="p-6 text-slate-500">Mengarahkan…</div>;
  return <Landing />;
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
