import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { useT, errorToMessage } from '../lib/i18n.js';
import LangToggle from '../components/LangToggle.jsx';

export default function Login() {
  const t = useT();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/app';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (e2) {
      setErr(errorToMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-slate-900">{t('login')}</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label={t('email')} type="email" value={email} onChange={setEmail} autoFocus />
        <Field label={t('password')} type="password" value={password} onChange={setPassword} />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} className="w-full rounded-md bg-slate-900 text-white py-2.5 font-medium disabled:opacity-50">
          {busy ? t('submitting') : t('login')}
        </button>
      </form>
      <div className="mt-4 flex justify-between text-sm text-slate-600">
        <Link to="/forgot-password" className="hover:text-slate-900">{t('forgot_password')}</Link>
        <span>{t('no_account')} <Link to="/signup" className="font-medium text-slate-900">{t('create_account')}</Link></span>
      </div>
    </AuthShell>
  );
}

export function AuthShell({ children }) {
  return (
    <main className="min-h-[100svh] bg-slate-50 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="font-semibold text-slate-900">Syntegra MoM</div>
        <LangToggle />
      </header>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
          {children}
        </div>
      </div>
    </main>
  );
}

export function Field({ label, type = 'text', value, onChange, autoFocus, required = true }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
      />
    </label>
  );
}
