import { useEffect, useRef, useState } from 'react';

let mermaidPromise = null;
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((mod) => {
      const m = mod.default || mod;
      m.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'strict',
        mindmap: { padding: 16 },
      });
      return m;
    });
  }
  return mermaidPromise;
}

let counter = 0;

export default function MindMap({ source }) {
  const containerRef = useRef(null);
  const [error, setError] = useState('');
  const idRef = useRef(`mm-${++counter}`);

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    setError('');
    loadMermaid()
      .then((m) => m.render(idRef.current, source))
      .then(({ svg }) => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
      })
      .catch((err) => {
        console.error('[mindmap] render failed:', err);
        if (!cancelled) setError(err.message || 'render_failed');
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (error) {
    return (
      <div className="rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3">
        Mind map gagal dirender. Sumber: <pre className="mt-2 text-xs overflow-x-auto">{source}</pre>
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-lg bg-white border border-slate-200 p-4">
      <div ref={containerRef} className="mermaid-container [&_svg]:max-w-none [&_svg]:h-auto" />
    </div>
  );
}
