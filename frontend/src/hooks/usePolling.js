import { useEffect, useRef, useState } from 'react';

export function usePolling(fetcher, intervalMs) {
  const fetcherRef = useRef(fetcher);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      try {
        const response = await fetcherRef.current();
        if (!cancelled) {
          setData((current) => JSON.stringify(current) === JSON.stringify(response) ? current : response);
          setError(null);
        }
      } catch (thrownError) {
        if (!cancelled) {
          setError(thrownError);
        }
      }
    };

    tick();
    const timer = window.setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [intervalMs]);

  return { data, error };
}
