import { Link } from 'react-router-dom';

function fmtMinutes(seconds) {
  const mins = Math.max(0, Math.floor((seconds || 0) / 60));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}j ${m}m` : `${h}j`;
}

export default function QuotaStrip({ quota, planLabel }) {
  if (!quota) return null;
  const baseRemaining = Math.max(0, quota.base_quota_seconds - quota.base_used_seconds);
  const totalRemaining = baseRemaining + quota.bonus_remaining_seconds;
  const totalCapacity = quota.base_quota_seconds + quota.bonus_remaining_seconds;
  const usedPct = totalCapacity > 0 ? Math.min(100, (quota.base_used_seconds / quota.base_quota_seconds) * 100) : 0;
  const lowQuota = totalRemaining < quota.base_quota_seconds * 0.2; // <20% of base
  const exhausted = totalRemaining <= 0;

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-semibold text-slate-900">
          Kuota {planLabel}
        </div>
        <div className="text-xs text-slate-500">
          {fmtMinutes(quota.base_used_seconds)} / {fmtMinutes(quota.base_quota_seconds)}
        </div>
      </div>

      <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full transition-all ${
            exhausted ? 'bg-red-500' : lowQuota ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${usedPct}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="text-slate-600">
          Sisa: <span className="font-mono font-semibold text-slate-900">{fmtMinutes(totalRemaining)}</span>
          {quota.bonus_remaining_seconds > 0 && (
            <span className="text-slate-400"> (incl. topup {fmtMinutes(quota.bonus_remaining_seconds)})</span>
          )}
        </div>
        <Link to="/settings#topup" className="text-slate-700 hover:text-slate-900 font-medium underline">
          + Beli topup
        </Link>
      </div>

      {exhausted && (
        <div className="mt-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs px-3 py-2">
          Kuota habis. Beli topup Rp 25.000 untuk 300 menit tambahan, atau tunggu reset bulan depan.
        </div>
      )}
    </div>
  );
}
