import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import MindMap from '../components/MindMap.jsx';

const POLL_INTERVAL = 4000;

export default function MeetingDetail() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [err, setErr] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);

  // Poll until summary arrives (Claude runs async on the server).
  useEffect(() => {
    let timer;
    let cancelled = false;
    async function tick() {
      try {
        const { meeting } = await api(`/meetings/${id}`);
        if (cancelled) return;
        setMeeting(meeting);
        if (!meeting.summary) {
          timer = setTimeout(tick, POLL_INTERVAL);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    }
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  async function resummarise() {
    setErr('');
    try {
      await api(`/meetings/${id}/summarise`, { method: 'POST' });
      setMeeting((m) => m && { ...m, summary: null }); // trigger polling
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <main className="min-h-[100svh] bg-slate-50 px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/app" className="text-sm text-slate-500 hover:text-slate-900">← Home</Link>
        {err && <p className="mt-4 text-red-600 text-sm">{err}</p>}

        {!meeting && !err && <p className="mt-8 text-slate-500">Memuat…</p>}

        {meeting && (
          <>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">{meeting.title || 'Untitled meeting'}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {new Date(meeting.created_at).toLocaleString()} · {Math.round(meeting.duration_seconds / 60)} min
              {meeting.email_sent_at && <span> · 📧 dikirim ke email</span>}
            </p>

            {!meeting.summary && meeting.transcript && (
              <div className="mt-6 rounded-md bg-slate-100 border border-slate-200 p-4 text-slate-700 text-sm flex items-center gap-3">
                <Spinner /> <span>Sedang membuat ringkasan…</span>
              </div>
            )}

            {!meeting.transcript && (
              <div className="mt-6 rounded-md bg-amber-50 border border-amber-200 p-4 text-amber-800 text-sm">
                Transkrip belum tersedia. Mungkin transkripsi gagal — coba rekam ulang.
              </div>
            )}

            {meeting.summary && (
              <>
                <Section title="Ringkasan">
                  <p className="text-slate-800 leading-relaxed">{meeting.summary.overview}</p>
                </Section>

                {meeting.summary.action_items?.length > 0 && (
                  <Section title="Action Items">
                    <ul className="space-y-2">
                      {meeting.summary.action_items.map((a, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-slate-400 mt-0.5">☐</span>
                          <div>
                            <span className="font-medium text-slate-900">{a.owner || 'team'}:</span>{' '}
                            <span className="text-slate-800">{a.task}</span>
                            {a.due && <span className="ml-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">due {a.due}</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {meeting.summary.key_decisions?.length > 0 && (
                  <Section title="Keputusan Penting">
                    <ul className="list-disc pl-5 space-y-1 text-slate-800">
                      {meeting.summary.key_decisions.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </Section>
                )}

                {meeting.summary.next_steps?.length > 0 && (
                  <Section title="Langkah Selanjutnya">
                    <ul className="list-disc pl-5 space-y-1 text-slate-800">
                      {meeting.summary.next_steps.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </Section>
                )}

                {meeting.mind_map_mermaid && (
                  <Section title="Mind Map">
                    <MindMap source={meeting.mind_map_mermaid} />
                  </Section>
                )}
              </>
            )}

            {meeting.flagged_moments?.length > 0 && (
              <Section title="Momen yang Ditandai">
                <ul className="space-y-1 text-sm text-slate-700">
                  {meeting.flagged_moments.map((f, i) => (
                    <li key={i}>
                      <span className="font-mono text-slate-500">{fmt(f.time_sec)}</span> — {f.label}
                      {f.kind === 'phone' && <span className="ml-2 text-xs text-amber-700">📵</span>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {meeting.transcript && (
              <Section title="Transkrip">
                <button
                  onClick={() => setShowTranscript((v) => !v)}
                  className="text-sm text-slate-600 hover:text-slate-900 underline"
                >
                  {showTranscript ? 'Sembunyikan transkrip' : 'Tampilkan transkrip lengkap'}
                </button>
                {showTranscript && (
                  <div className="mt-3 whitespace-pre-wrap text-slate-800 leading-relaxed bg-white rounded-lg border border-slate-200 p-4">
                    {meeting.transcript}
                  </div>
                )}
              </Section>
            )}

            {meeting.transcript && !meeting.summary && (
              <button
                onClick={resummarise}
                className="mt-6 text-sm text-slate-600 hover:text-slate-900 underline"
              >
                Coba lagi buat ringkasan
              </button>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Spinner() {
  return <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />;
}

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
