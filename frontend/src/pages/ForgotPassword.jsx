import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useT, errorToMessage } from '../lib/i18n.js';
import { AuthShell, Field } from './Login.jsx';

export default function ForgotPassword() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email }, auth: false });
      setDone(true);
    } catch (e2) {
      setErr(errorToMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-slate-900">{t('reset_password')}</h1>
      {done ? (
        <p className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-3">
          {t('forgot_sent')}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label={t('email')} type="email" value={email} onChange={setEmail} autoFocus />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button disabled={busy} className="w-full rounded-md bg-slate-900 text-white py-2.5 font-medium disabled:opacity-50">
            {busy ? t('submitting') : t('send_reset_link')}
          </button>
        </form>
      )}
      <p className="mt-4 text-sm text-slate-600">
        <Link to="/login" className="font-medium text-slate-900">← {t('login')}</Link>
      </p>
    </AuthShell>
  );
}
