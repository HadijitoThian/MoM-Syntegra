import { getLang, setLang, useT } from '../lib/i18n.js';

export default function LangToggle() {
  useT();
  const current = getLang();
  return (
    <div className="inline-flex rounded-md border border-slate-200 bg-white text-xs font-medium overflow-hidden">
      {['id', 'en'].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 ${current === l ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
