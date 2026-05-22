import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { useT, errorToMessage } from '../lib/i18n.js';
import { AuthShell, Field } from './Login.jsx';

export default function Signup() {
  const t = useT();
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', full_name: '', company: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  function set(k) {
    return (v) => setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await signup(form);
      navigate('/', { replace: true });
    } catch (e2) {
      setErr(errorToMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-slate-900">{t('create_account')}</h1>
      <p className="mt-1 text-sm text-slate-500">7 hari gratis. Tanpa kartu kredit.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label={t('full_name')} value={form.full_name} onChange={set('full_name')} required={false} autoFocus />
        <Field label={t('company')} value={form.company} onChange={set('company')} required={false} />
        <Field label={t('email')} type="email" value={form.email} onChange={set('email')} />
        <Field label={t('password')} type="password" value={form.password} onChange={set('password')} />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} className="w-full rounded-md bg-slate-900 text-white py-2.5 font-medium disabled:opacity-50">
          {busy ? t('submitting') : t('signup')}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        {t('have_account')} <Link to="/login" className="font-medium text-slate-900">{t('login')}</Link>
      </p>
    </AuthShell>
  );
}
