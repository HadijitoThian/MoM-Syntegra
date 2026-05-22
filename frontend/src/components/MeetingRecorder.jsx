import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWakeLock } from '../lib/wakeLock.js';
import { pickMimeType, formatTimer } from '../lib/recorder.js';
import { tr } from '../lib/i18n-recorder.js';
import { getLang, useT } from '../lib/i18n.js';
import { getToken } from '../lib/api.js';

function defaultTitle() {
  const d = new Date();
  const stamp = d.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
  return `Meeting — ${stamp}`;
}

const PHASES = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PAUSED: 'paused',
  UPLOADING: 'uploading',
  TRANSCRIBING: 'transcribing',
  DONE: 'done',
  ERROR: 'error',
};

export default function MeetingRecorder() {
  useT(); // re-render on lang change
  const navigate = useNavigate();
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [title, setTitle] = useState(defaultTitle);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [flags, setFlags] = useState([]); // [{ time_sec, label, kind }]
  const [error, setError] = useState('');
  const [supported] = useState(() => !!pickMimeType());

  const mediaStreamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeRef = useRef(null);
  const startedAtRef = useRef(0);     // ms timestamp when current segment started
  const pausedTotalRef = useRef(0);    // accumulated paused ms
  const tickRef = useRef(null);

  const isActive = phase === PHASES.RECORDING || phase === PHASES.PAUSED;
  const wake = useWakeLock(phase === PHASES.RECORDING);

  // Timer tick
  useEffect(() => {
    if (phase !== PHASES.RECORDING) {
      clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => {
      const now = Date.now();
      setElapsed((now - startedAtRef.current - pausedTotalRef.current) / 1000);
    }, 250);
    return () => clearInterval(tickRef.current);
  }, [phase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  function stopStream() {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  }

  async function start() {
    setError('');
    try {
      const mime = pickMimeType();
      if (!mime) throw new Error('unsupported');
      mimeRef.current = mime;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 24000 });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(1000); // chunk every 1s
      recorderRef.current = recorder;

      startedAtRef.current = Date.now();
      pausedTotalRef.current = 0;
      setElapsed(0);
      setFlags([]);
      setPhase(PHASES.RECORDING);
    } catch (err) {
      console.error('[recorder] start failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError(tr('rec_mic_denied'));
      } else if (err.message === 'unsupported') {
        setError(tr('rec_unsupported'));
      } else {
        setError(tr('rec_error') + err.message);
      }
      setPhase(PHASES.ERROR);
    }
  }

  function pause() {
    const r = recorderRef.current;
    if (r && r.state === 'recording') {
      r.pause();
      pauseStartRef.current = Date.now();
      setPhase(PHASES.PAUSED);
    }
  }
  const pauseStartRef = useRef(0);

  function resume() {
    const r = recorderRef.current;
    if (r && r.state === 'paused') {
      pausedTotalRef.current += Date.now() - pauseStartRef.current;
      r.resume();
      setPhase(PHASES.RECORDING);
    }
  }

  function addFlag(kind, label) {
    setFlags((prev) => [...prev, { time_sec: Math.floor(elapsed), label, kind }]);
  }

  async function stop() {
    const r = recorderRef.current;
    if (!r) return;
    const finalElapsed = elapsed;

    const blob = await new Promise((resolve) => {
      r.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeRef.current });
        resolve(blob);
      };
      r.stop();
    });
    stopStream();

    setPhase(PHASES.UPLOADING);
    try {
      const form = new FormData();
      const ext = mimeRef.current.includes('mp4') ? 'm4a' : mimeRef.current.includes('ogg') ? 'ogg' : 'webm';
      form.append('audio', blob, `meeting.${ext}`);
      form.append('title', title);
      form.append('duration_seconds', String(Math.floor(finalElapsed)));
      form.append('flagged_moments', JSON.stringify(flags));
      form.append('language', getLang());

      setPhase(PHASES.TRANSCRIBING);
      const res = await fetch('/api/meetings/transcribe', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
      const data = await res.json();
      if (res.status === 402) {
        if (data.error === 'quota_exhausted') {
          navigate('/?quota=exhausted', { replace: true });
        } else {
          navigate('/subscribe', { replace: true });
        }
        return;
      }
      if (!res.ok) throw new Error(data.error || `http_${res.status}`);
      setPhase(PHASES.DONE);
      // Navigate to meeting detail (Day 4 page) — for now show JSON.
      setTimeout(() => navigate(`/meetings/${data.meeting_id}`), 800);
    } catch (err) {
      console.error('[recorder] upload failed:', err);
      setError(tr('rec_error') + err.message);
      setPhase(PHASES.ERROR);
    }
  }

  if (!supported && phase === PHASES.IDLE) {
    return (
      <Shell>
        <p className="text-red-300">{tr('rec_unsupported')}</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <button onClick={() => navigate('/')} className="text-sm text-slate-400 hover:text-white">
        {tr('rec_back')}
      </button>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isActive}
        className="mt-4 w-full bg-transparent border-b border-slate-700 text-lg text-white py-2 focus:outline-none focus:border-white"
        placeholder={tr('rec_title')}
      />

      <div className="mt-12 flex flex-col items-center">
        <RecButton phase={phase} onClick={phase === PHASES.IDLE || phase === PHASES.ERROR ? start : null} />
        <div className="mt-6 text-5xl font-mono tabular-nums text-white tracking-wider">
          {formatTimer(elapsed)}
        </div>
        <StatusBanner phase={phase} wake={wake} />
      </div>

      {isActive && (
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            onClick={() => addFlag('important', tr('rec_flag_default'))}
            className="rounded-xl bg-slate-800 border border-slate-700 py-4 text-white text-sm font-medium active:scale-95 transition"
          >
            🚩 {tr('rec_flag')}
          </button>
          <button
            onClick={() => addFlag('phone', tr('rec_phone_default'))}
            className="rounded-xl bg-amber-900/40 border border-amber-700 py-4 text-amber-100 text-sm font-medium active:scale-95 transition"
          >
            📵 {tr('rec_phone')}
          </button>
        </div>
      )}

      {flags.length > 0 && (
        <div className="mt-6">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">{tr('rec_flagged_moments')}</div>
          <div className="flex flex-wrap gap-2">
            {flags.map((f, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-1 rounded-full border ${
                  f.kind === 'phone'
                    ? 'bg-amber-900/40 border-amber-700 text-amber-100'
                    : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                {formatTimer(f.time_sec)} · {f.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {isActive && (
        <div className="mt-6 flex gap-3">
          {phase === PHASES.RECORDING ? (
            <button onClick={pause} className="flex-1 rounded-xl bg-slate-800 border border-slate-700 py-3 text-white font-medium">
              {tr('rec_pause')}
            </button>
          ) : (
            <button onClick={resume} className="flex-1 rounded-xl bg-slate-800 border border-slate-700 py-3 text-white font-medium">
              {tr('rec_resume')}
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md bg-red-950/60 border border-red-800 text-red-200 text-sm p-3">{error}</div>
      )}

      {(phase === PHASES.UPLOADING || phase === PHASES.TRANSCRIBING) && (
        <div className="mt-6 rounded-md bg-slate-800/60 border border-slate-700 text-slate-200 text-sm p-3 flex items-center gap-3">
          <Spinner />
          <span>{phase === PHASES.UPLOADING ? tr('rec_uploading') : tr('rec_transcribing')}</span>
        </div>
      )}
      {phase === PHASES.DONE && (
        <div className="mt-6 rounded-md bg-emerald-900/40 border border-emerald-700 text-emerald-100 text-sm p-3">
          {tr('rec_done')}
        </div>
      )}

      <div className="mt-auto" />
      {isActive && (
        <button
          onClick={stop}
          className="mt-8 w-full rounded-xl bg-red-600 hover:bg-red-500 py-5 text-white text-lg font-semibold active:scale-95 transition"
        >
          {tr('rec_stop')}
        </button>
      )}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <main
      className="min-h-[100svh] bg-slate-950 text-white flex flex-col px-6 pt-6"
      style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
    >
      {children}
    </main>
  );
}

function RecButton({ phase, onClick }) {
  const recording = phase === 'recording';
  const idle = phase === 'idle' || phase === 'error';
  return (
    <button
      onClick={onClick || undefined}
      disabled={!onClick}
      className={`relative w-40 h-40 rounded-full transition ${
        recording
          ? 'bg-red-600 animate-pulse'
          : phase === 'paused'
          ? 'bg-amber-600'
          : idle
          ? 'bg-red-600 hover:bg-red-500 active:scale-95'
          : 'bg-slate-700'
      }`}
    >
      {recording && (
        <span className="absolute inset-0 rounded-full border-4 border-red-400/60 animate-ping" />
      )}
      <span className="relative text-white font-bold text-lg">
        {idle ? 'REC' : recording ? '●' : phase === 'paused' ? '⏸' : '…'}
      </span>
    </button>
  );
}

function StatusBanner({ phase, wake }) {
  let text = '';
  let cls = '';
  if (phase === 'recording' || phase === 'paused') {
    if (!wake.supported) {
      text = tr('rec_status_wake_off');
      cls = 'bg-amber-900/40 border-amber-700 text-amber-100';
    } else if (wake.held) {
      text = tr('rec_status_wake_on');
      cls = 'bg-emerald-900/40 border-emerald-700 text-emerald-100';
    } else {
      text = phase === 'paused' ? tr('rec_status_paused') : tr('rec_status_recording');
      cls = 'bg-slate-800 border-slate-700 text-slate-200';
    }
  }
  if (!text) return null;
  return <div className={`mt-4 text-xs px-3 py-1.5 rounded-full border ${cls}`}>{text}</div>;
}

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
  );
}
