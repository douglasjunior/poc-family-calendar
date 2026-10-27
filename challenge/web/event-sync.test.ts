import { describe, expect, it } from 'vitest';
import type { CalendarEvent } from '../shared/types';
import { createEventSync } from './event-sync';

const event = (id: number, title: string, startsAt = '2026-01-16T19:00:00.000Z'): CalendarEvent => ({
  id,
  title,
  startsAt,
  endsAt: '2026-01-16T20:00:00.000Z',
  groupId: 'family',
  notes: null,
  createdBy: 'dad',
  createdAt: '2026-01-01T00:00:00.000Z',
});

type Deferred = { resolve: (events: CalendarEvent[]) => void; reject: (error: Error) => void };

function setup() {
  const pending: Deferred[] = [];
  const timers = new Map<number, { fn: () => void; ms: number }>();
  let nextTimer = 1;
  const delivered: CalendarEvent[][] = [];
  const staleStates: boolean[] = [];

  const sync = createEventSync({
    fetchEvents: () =>
      new Promise<CalendarEvent[]>((resolve, reject) => pending.push({ resolve, reject })),
    intervalMs: 10_000,
    setTimer: (fn, ms) => {
      const handle = nextTimer++;
      timers.set(handle, { fn, ms });
      return handle;
    },
    clearTimer: (handle) => {
      timers.delete(handle as number);
    },
    onEvents: (events) => delivered.push(events),
    onStale: (stale) => staleStates.push(stale),
  });

  const fireTimer = () => {
    const [handle, timer] = [...timers.entries()][0];
    timers.delete(handle);
    timer.fn();
  };
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  return { sync, pending, timers, delivered, staleStates, fireTimer, flush };
}

describe('event sync', () => {
  it('AC-5: polls on the interval and delivers the events it fetches', async () => {
    const { sync, pending, timers, delivered, fireTimer, flush } = setup();

    sync.start();
    expect([...timers.values()].map((t) => t.ms)).toEqual([10_000]);
    expect(pending).toHaveLength(0);

    fireTimer();
    expect(pending).toHaveLength(1);
    pending[0].resolve([event(1, 'Dentist')]);
    await flush();

    expect(delivered).toEqual([[event(1, 'Dentist')]]);
    expect([...timers.values()].map((t) => t.ms)).toEqual([10_000]);
  });

  it('AC-7: delivers a practice moved from 5 PM to 6 PM on the next poll', async () => {
    const { sync, pending, delivered, fireTimer, flush } = setup();

    sync.start();
    fireTimer();
    pending[0].resolve([event(1, 'Practice', '2026-01-16T17:00:00.000Z')]);
    await flush();
    fireTimer();
    pending[1].resolve([event(1, 'Practice', '2026-01-16T18:00:00.000Z')]);
    await flush();

    expect(delivered.map((events) => events[0].startsAt)).toEqual([
      '2026-01-16T17:00:00.000Z',
      '2026-01-16T18:00:00.000Z',
    ]);
  });

  it('AC-8: refreshNow fetches at once without waiting for the interval', async () => {
    const { sync, pending, delivered, flush } = setup();

    const refreshing = sync.refreshNow();
    expect(pending).toHaveLength(1);
    pending[0].resolve([event(2, 'Pilates')]);
    await refreshing;
    await flush();

    expect(delivered).toEqual([[event(2, 'Pilates')]]);
  });

  it('AC-8: refreshNow restarts the interval so polls do not pile up', async () => {
    const { sync, pending, timers } = setup();

    sync.start();
    const refreshing = sync.refreshNow();
    pending[0].resolve([]);
    await refreshing;

    expect(timers.size).toBe(1);
  });

  it('AC-5: invalidate discards the response of a fetch started before it', async () => {
    const { sync, pending, delivered, flush } = setup();

    void sync.refreshNow();
    sync.invalidate();
    pending[0].resolve([]);
    await flush();

    expect(delivered).toEqual([]);
  });

  it('AC-5: invalidate keeps the response of a fetch started after it', async () => {
    const { sync, pending, delivered, flush } = setup();

    void sync.refreshNow();
    sync.invalidate();
    void sync.refreshNow();
    pending[0].resolve([event(1, 'Old')]);
    pending[1].resolve([event(1, 'New')]);
    await flush();

    expect(delivered).toEqual([[event(1, 'New')]]);
  });

  it('AC-5: drops a response that arrives after a newer one', async () => {
    const { sync, pending, delivered, flush } = setup();

    void sync.refreshNow();
    void sync.refreshNow();
    pending[1].resolve([event(1, 'Newer')]);
    await flush();
    pending[0].resolve([event(1, 'Older')]);
    await flush();

    expect(delivered).toEqual([[event(1, 'Newer')]]);
  });

  it('AC-5: stop clears the timer and ignores responses still in flight', async () => {
    const { sync, pending, timers, delivered, fireTimer, flush } = setup();

    sync.start();
    fireTimer();
    sync.stop();
    pending[0].resolve([event(1, 'Late')]);
    await flush();

    expect(timers.size).toBe(0);
    expect(delivered).toEqual([]);
  });

  it('AC-18: reports stale after a failed update and clears it after the next success', async () => {
    const { sync, pending, staleStates, delivered, fireTimer, flush } = setup();

    sync.start();
    fireTimer();
    pending[0].reject(new Error('Could not reach the server'));
    await flush();
    expect(staleStates).toEqual([true]);
    expect(delivered).toEqual([]);

    fireTimer();
    pending[1].resolve([event(1, 'Back')]);
    await flush();

    expect(staleStates).toEqual([true, false]);
    expect(delivered).toEqual([[event(1, 'Back')]]);
  });

  it('AC-18: keeps polling after a failure', async () => {
    const { sync, pending, timers, fireTimer, flush } = setup();

    sync.start();
    fireTimer();
    pending[0].reject(new Error('down'));
    await flush();

    expect(timers.size).toBe(1);
  });

  it('AC-18: refreshNow resolves instead of throwing when the fetch fails', async () => {
    const { sync, pending, staleStates } = setup();

    const refreshing = sync.refreshNow();
    pending[0].reject(new Error('down'));

    await expect(refreshing).resolves.toBeUndefined();
    expect(staleStates).toEqual([true]);
  });

  it('AC-18: does not report stale again while updates keep failing', async () => {
    const { sync, pending, staleStates, flush } = setup();

    void sync.refreshNow();
    pending[0].reject(new Error('down'));
    await flush();
    void sync.refreshNow();
    pending[1].reject(new Error('down'));
    await flush();

    expect(staleStates).toEqual([true]);
  });
});
