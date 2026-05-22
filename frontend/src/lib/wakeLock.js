// Wake Lock helper. Re-acquires on visibilitychange because the browser
// auto-releases the lock when the tab is hidden.
import { useEffect, useRef, useState } from 'react';

export function useWakeLock(active) {
  const sentinelRef = useRef(null);
  const [supported] = useState(() => typeof navigator !== 'undefined' && 'wakeLock' in navigator);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;

    async function acquire() {
      try {
        const s = await navigator.wakeLock.request('screen');
        if (cancelled) {
          s.release().catch(() => {});
          return;
        }
        sentinelRef.current = s;
        setHeld(true);
        s.addEventListener('release', () => setHeld(false));
      } catch (err) {
        console.warn('[wakeLock] acquire failed:', err.message);
        setHeld(false);
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'visible' && active) acquire();
    }

    if (active) acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      const s = sentinelRef.current;
      sentinelRef.current = null;
      if (s) s.release().catch(() => {});
      setHeld(false);
    };
  }, [active, supported]);

  return { supported, held };
}
