import { useEffect, useRef, useState } from 'react';
import type { CalendarEvent, EventInput } from '../../shared/types';
import { api } from '../api';
import { createEventSync, type EventSync } from '../event-sync';

const POLL_INTERVAL_MS = 10_000;

export function useEvents(userId: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const syncRef = useRef<EventSync | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setEvents([]);
    setStale(false);
    const sync = createEventSync({
      fetchEvents: () => api.listEvents(userId),
      intervalMs: POLL_INTERVAL_MS,
      setTimer: (fn, ms) => window.setTimeout(fn, ms),
      clearTimer: (handle) => window.clearTimeout(handle as number),
      onEvents: setEvents,
      onStale: setStale,
    });
    syncRef.current = sync;
    sync.start();
    void sync.refreshNow().finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      sync.stop();
      syncRef.current = null;
    };
  }, [userId]);

  // The user's own change makes any list already requested out of date.
  function invalidate() {
    syncRef.current?.invalidate();
  }

  async function createEvent(input: EventInput) {
    const created = await api.createEvent(userId, input);
    invalidate();
    setEvents((current) => [...current, created]);
  }

  async function updateEvent(id: number, input: EventInput) {
    const updated = await api.updateEvent(userId, id, input);
    invalidate();
    setEvents((current) => current.map((event) => (event.id === id ? updated : event)));
  }

  async function deleteEvent(id: number) {
    await api.deleteEvent(userId, id);
    invalidate();
    setEvents((current) => current.filter((event) => event.id !== id));
  }

  function refresh() {
    return syncRef.current?.refreshNow() ?? Promise.resolve();
  }

  return { events, loading, stale, refresh, createEvent, updateEvent, deleteEvent };
}
