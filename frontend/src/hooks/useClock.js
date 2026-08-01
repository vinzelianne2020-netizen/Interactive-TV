import { useEffect, useMemo, useState } from 'react';

import { client } from '../api/client';

const CLOCK_SYNC_INTERVAL_MS = 5 * 60 * 1000;

export function useClock() {
  const [clockState, setClockState] = useState({
    now: new Date(),
    timezone: 'Asia/Manila',
  });

  useEffect(() => {
    let cancelled = false;

    const syncClock = async () => {
      try {
        const response = await client.get('/clock');
        const payload = response.data ?? {};

        if (!cancelled && payload.now) {
          setClockState({
            now: new Date(payload.now),
            timezone: payload.timezone ?? 'Asia/Manila',
          });
        }
      } catch (_error) {
        // Keep the locally ticking clock on screen if the API is unavailable.
      }
    };

    syncClock();
    const syncTimer = window.setInterval(syncClock, CLOCK_SYNC_INTERVAL_MS);
    const tickTimer = window.setInterval(() => {
      setClockState((current) => ({
        ...current,
        now: new Date(current.now.getTime() + 1000),
      }));
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(syncTimer);
      window.clearInterval(tickTimer);
    };
  }, []);

  const time = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: clockState.timezone,
    }).format(clockState.now);
  }, [clockState.now, clockState.timezone]);

  const date = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: clockState.timezone,
    }).format(clockState.now);
  }, [clockState.now, clockState.timezone]);

  const weekday = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone: clockState.timezone,
    }).format(clockState.now);
  }, [clockState.now, clockState.timezone]);

  return {
    now: clockState.now,
    timezone: clockState.timezone,
    time,
    date,
    weekday,
  };
}
