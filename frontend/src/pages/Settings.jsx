import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import QuotaStrip from '../components/QuotaStrip.jsx';

const SNAP_SANDBOX = 'https://app.sandbox.midtrans.com/snap/snap.js';
const SNAP_PROD = 'https://app.midtrans.com/snap/snap.js';

function loadSnap(clientKey, sandbox) {
  return new Promise((resolve, reject) => {
    if (window.snap) return resolve();
    const s = document.createElement('script');
    s.src = sandbox ? SNAP_SANDBOX : SNAP_PROD;
    s.dataset.clientKey = clientKey;
    s.onload = resolve;
    s.onerror = () => reject(new Error('snap_script_failed'));
    document.head.appendChild(s);
  });
}

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [topupBusy, setTopupBusy] = useState(false);

  useEffect(() => {
    if (location.hash === '#topup') {
      document.getElementById('topup-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.hash]);

  async function sendResetLink() {
    setErr(''); setMsg(''); setPwBusy(true);
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email: user.email }, auth: false });
      setMsg('Link ganti password sudah dikirim ke email Anda.');
    } catch (e) {
      setErr(e.message);
    } finally {
      setPwBusy(false);
    }
  }

  async function buyTopup() {
    setErr(''); setTopupBusy(true);
    try {
      const data = await api('/subscriptions/topup', { method: 'POST' });
      await loadSnap(data.client_key, data.sandbox);
      window.snap.pay(data.snap_token, {
        onSuccess: () => window.location.reload(),
        onPending: () => setMsg('Pembayaran sedang diproses. Topup akan masuk setelah konfirmasi.'),
        onError: () => setErr('Pembayaran gagal. Coba lagi.'),
        onClose: () => setTopupBusy(false),
      });
    } catch (e) {
      if (e.message === 'payments_not_configured') {
        setErr('Pembayaran belum aktif. Hubungi admin Syntegra.');
      } else {
        setErr(e.message || 'Terjadi kesalahan.');
      }
      setTopupBusy(false);
    }
  }

  function doLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const subEnds = user?.subscription_ends_at ? new Date(user.subscription_ends_at) : null;
  const trialEnds = user?.trial_ends_at ? new Date(user.trial_ends_at) : null;
  const planLabel = user?.subscription_status === 'trial' ? 'trial' : user?.subscription_status === 'active' ? 'bulanan' : 'kadaluarsa';

  return (
    <main className="min-h-[100svh] bg-slate-50 px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <Link to="/app" className="text-sm text-slate-500 hover:text-slate-900">← Home</Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Pengaturan</h1>

        <Section title="Akun">
          <Row label="Email" value={user?.email} />
          <Row label="Nama" value={user?.full_name || '—'} />
          <Row label="Perusahaan" value={user?.company || '—'} />
        </Section>

        <Section title="Langganan">
          <Row label="Status" value={statusLabel(user?.subscription_status)} />
          {user?.subscription_status === 'trial' && trialEnds && (
            <Row label="Trial berakhir" value={trialEnds.toLocaleDateString()} />
          )}
          {user?.subscription_status === 'active' && subEnds && (
            <Row label="Berakhir" value={subEnds.toLocaleDateString()} />
          )}
          <Link to="/subscribe" className="mt-4 inline-block text-sm text-slate-900 underline">
            Kelola langganan →
          </Link>
        </Section>

        {user?.quota && (
          <Section title="Kuota">
            <QuotaStrip quota={user.quota} planLabel={planLabel} />
          </Section>
        )}

        <section id="topup-section" className="mt-8 rounded-2xl bg-white border border-slate-200 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Topup</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">300 menit tambahan</div>
              <div className="text-sm text-slate-500 mt-0.5">Tidak ada expiry. Dipakai setelah kuota bulanan habis.</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-slate-900">Rp 25.000</div>
            </div>
          </div>
          {msg && <p className="mt-3 text-sm text-emerald-700">{msg}</p>}
          {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
          <button
            onClick={buyTopup}
            disabled={topupBusy}
            className="mt-4 w-full rounded-md bg-slate-900 text-white px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {topupBusy ? 'Memproses…' : 'Beli topup'}
          </button>
        </section>

        <Section title="Kata sandi">
          <p className="text-sm text-slate-600">
            Kami akan kirim link ganti password ke email Anda.
          </p>
          <button
            onClick={sendResetLink}
            disabled={pwBusy}
            className="mt-3 rounded-md bg-slate-900 text-white px-4 py-2 text-sm disabled:opacity-50"
          >
            {pwBusy ? 'Mengirim…' : 'Kirim link ganti password'}
          </button>
        </Section>

        <Section title="Keluar">
          <button onClick={doLogout} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
            Logout
          </button>
        </Section>
      </div>
    </main>
  );
}

function statusLabel(s) {
  return { trial: 'Free trial', active: 'Aktif', expired: 'Kadaluarsa', cancelled: 'Dibatalkan' }[s] || s || '—';
}

function Section({ title, children }) {
  return (
    <section className="mt-8 rounded-2xl bg-white border border-slate-200 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-medium">{value}</span>
    </div>
  );
}
