import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useT, errorToMessage } from '../lib/i18n.js';
import { AuthShell, Field } from './Login.jsx';

export default function ResetPassword() {
  const t = useT();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false });
      navigate('/login', { replace: true, state: { flash: t('reset_done') } });
    } catch (e2) {
      setErr(errorToMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-slate-900">{t('reset_password')}</h1>
      {!token ? (
        <p className="mt-4 text-sm text-red-600">Token tidak ditemukan.</p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label={t('new_password')} type="password" value={password} onChange={setPassword} autoFocus />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button disabled={busy} className="w-full rounded-md bg-slate-900 text-white py-2.5 font-medium disabled:opacity-50">
            {busy ? t('submitting') : t('save')}
          </button>
        </form>
      )}
      <p className="mt-4 text-sm text-slate-600">
        <Link to="/login" className="font-medium text-slate-900">← {t('login')}</Link>
      </p>
    </AuthShell>
  );
}
