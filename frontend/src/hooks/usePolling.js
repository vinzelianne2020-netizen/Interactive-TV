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
      try {
        const response = await fetcherRef.current();
        if (!cancelled) {
          setData(response);
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

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [intervalMs]);

  return { data, error };
}
