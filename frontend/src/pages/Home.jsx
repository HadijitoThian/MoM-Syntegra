import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { useT } from '../lib/i18n.js';
import { api } from '../lib/api.js';
import LangToggle from '../components/LangToggle.jsx';
import QuotaStrip from '../components/QuotaStrip.jsx';

export default function Home() {
  const t = useT();
  const { user, logout } = useAuth();
  const [params] = useSearchParams();
  const [meetings, setMeetings] = useState([]);
  const justPaid = params.get('paid') === '1';
  const quotaExhaustedFlag = params.get('quota') === 'exhausted';

  const trialEnds = user?.trial_ends_at ? new Date(user.trial_ends_at) : null;
  const subEnds = user?.subscription_ends_at ? new Date(user.subscription_ends_at) : null;
  const now = new Date();
  const trialActive = user?.subscription_status === 'trial' && trialEnds && trialEnds > now;
  const paidActive = user?.subscription_status === 'active' && subEnds && subEnds > now;
  const subActive = trialActive || paidActive;
  const quotaLeft = user?.quota?.total_remaining_seconds ?? 0;
  const canRecord = subActive && quotaLeft > 0;

  useEffect(() => {
    api('/meetings').then((d) => setMeetings(d.meetings || [])).catch(() => {});
  }, []);

  const planLabel = trialActive ? 'trial' : paidActive ? 'bulanan' : 'kadaluarsa';

  return (
    <main className="min-h-[100svh] bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <div className="font-semibold text-slate-900">Syntegra MoM</div>
        <div className="flex items-center gap-3">
          <LangToggle />
          <Link to="/settings" className="text-sm text-slate-600 hover:text-slate-900">⚙</Link>
          <button onClick={logout} className="text-sm text-slate-600 hover:text-slate-900">{t('logout')}</button>
        </div>
      </header>
      <section className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('welcome')}, {user?.full_name || user?.email}</h1>
        <p className="mt-1 text-slate-600">{t('app_tagline')}</p>

        {justPaid && (
          <div className="mt-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-3 py-2">
            ✓ Pembayaran berhasil. Selamat menggunakan Syntegra MoM!
          </div>
        )}
        {quotaExhaustedFlag && (
          <div className="mt-4 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">
            Kuota habis. Silakan beli topup untuk lanjut merekam.
          </div>
        )}

        {trialActive && (
          <div className="mt-4 inline-flex rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-1.5">
            {t('trial_ends')}: {trialEnds.toLocaleDateString()}
          </div>
        )}

        {subActive && (
          <div className="mt-6">
            <QuotaStrip quota={user.quota} planLabel={planLabel} />
          </div>
        )}

        {canRecord ? (
          <Link
            to="/record"
            className="mt-6 block rounded-2xl bg-red-600 hover:bg-red-500 text-white text-center py-8 text-xl font-semibold shadow-sm transition"
          >
            ● {t('record_meeting')}
          </Link>
        ) : !subActive ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-slate-700">
              Trial habis. Subscribe Rp 59.000/bulan (750 menit) untuk lanjut merekam rapat.
            </p>
            <Link to="/subscribe" className="mt-4 inline-block rounded-md bg-slate-900 text-white px-5 py-2.5 font-medium">
              Subscribe
            </Link>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-800">
              Kuota habis bulan ini. Beli topup atau tunggu reset.
            </p>
            <Link to="/settings#topup" className="mt-4 inline-block rounded-md bg-slate-900 text-white px-5 py-2.5 font-medium">
              Beli topup Rp 25.000 (300 menit)
            </Link>
          </div>
        )}

        {meetings.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Riwayat</h2>
            <ul className="mt-2 divide-y divide-slate-200 rounded-lg bg-white border border-slate-200">
              {meetings.map((m) => (
                <li key={m.id}>
                  <Link to={`/meetings/${m.id}`} className="block px-4 py-3 hover:bg-slate-50">
                    <div className="font-medium text-slate-900">{m.title || 'Untitled meeting'}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(m.created_at).toLocaleString()} · {Math.round(m.duration_seconds / 60)} min
                      {!m.has_summary && m.has_transcript && <span className="ml-2 text-amber-700">· ringkasan diproses…</span>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
