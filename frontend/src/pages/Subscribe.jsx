import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

const SNAP_SCRIPT_SANDBOX = 'https://app.sandbox.midtrans.com/snap/snap.js';
const SNAP_SCRIPT_PROD = 'https://app.midtrans.com/snap/snap.js';

function loadSnap(clientKey, sandbox) {
  return new Promise((resolve, reject) => {
    if (window.snap) return resolve();
    const s = document.createElement('script');
    s.src = sandbox ? SNAP_SCRIPT_SANDBOX : SNAP_SCRIPT_PROD;
    s.dataset.clientKey = clientKey;
    s.onload = resolve;
    s.onerror = () => reject(new Error('snap_script_failed'));
    document.head.appendChild(s);
  });
}

export default function Subscribe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (user?.subscription_status === 'active') {
      const ends = user.subscription_ends_at ? new Date(user.subscription_ends_at) : null;
      if (ends && ends > new Date()) {
        // Already subscribed — bounce home after a moment.
      }
    }
  }, [user]);

  async function startCheckout() {
    setErr('');
    setBusy(true);
    try {
      const data = await api('/subscriptions/checkout', { method: 'POST' });
      await loadSnap(data.client_key, data.sandbox);
      window.snap.pay(data.snap_token, {
        onSuccess: () => navigate('/?paid=1', { replace: true }),
        onPending: () => navigate('/?pending=1', { replace: true }),
        onError: () => setErr('Pembayaran gagal. Coba lagi.'),
        onClose: () => setBusy(false),
      });
    } catch (e) {
      if (e.message === 'payments_not_configured') {
        setErr('Pembayaran belum aktif. Hubungi admin.');
      } else {
        setErr(e.message || 'Terjadi kesalahan.');
      }
      setBusy(false);
    }
  }

  const trialEnds = user?.trial_ends_at ? new Date(user.trial_ends_at) : null;
  const trialActive = user?.subscription_status === 'trial' && trialEnds && trialEnds > new Date();

  return (
    <main className="min-h-[100svh] bg-slate-50 px-6 py-8">
      <div className="max-w-md mx-auto">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">← Home</Link>
        <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="text-sm text-slate-500">Syntegra MoM</div>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Rp 59.000<span className="text-base font-normal text-slate-500">/bulan</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">750 menit rekaman per bulan</p>
          <ul className="mt-6 space-y-2 text-sm text-slate-700">
            <li>✓ 750 menit rekaman/bulan (~12 jam)</li>
            <li>✓ Transkrip otomatis (Indonesia + English)</li>
            <li>✓ Ringkasan, action items, mind map otomatis</li>
            <li>✓ Catatan dikirim ke email setelah rapat</li>
            <li>✓ Audio disimpan 30 hari, catatan selamanya</li>
            <li>✓ Butuh lebih? Topup Rp 25.000 = 300 menit (tanpa expiry)</li>
          </ul>

          {trialActive ? (
            <p className="mt-6 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
              Trial Anda masih aktif sampai {trialEnds.toLocaleDateString()}. Subscribe sekarang biar tidak terputus.
            </p>
          ) : null}

          {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

          <button
            onClick={startCheckout}
            disabled={busy}
            className="mt-6 w-full rounded-md bg-slate-900 text-white py-3 font-medium disabled:opacity-50"
          >
            {busy ? 'Memproses…' : 'Subscribe Rp 59.000/bulan'}
          </button>
          <p className="mt-3 text-xs text-slate-500 text-center">
            Pembayaran aman via Midtrans. Bisa pakai GoPay, OVO, kartu kredit, transfer bank.
          </p>
        </div>
      </div>
    </main>
  );
}
