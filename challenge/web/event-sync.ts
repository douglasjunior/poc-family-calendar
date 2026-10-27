import type { CalendarEvent } from '../shared/types';

export type EventSyncDeps = {
  fetchEvents: () => Promise<CalendarEvent[]>;
  intervalMs: number;
  setTimer: (fn: () => void, ms: number) => unknown;
  clearTimer: (handle: unknown) => void;
  onEvents: (events: CalendarEvent[]) => void;
  onStale: (stale: boolean) => void;
};

export type EventSync = {
  start(): void;
  stop(): void;
  refreshNow(): Promise<void>;
  invalidate(): void;
};

export function createEventSync(deps: EventSyncDeps): EventSync {
  let running = false;
  let timer: unknown = null;
  let started = 0; // id of the latest fetch started
  let applied = 0; // id of the newest response already delivered
  let floor = 0; // responses of fetches with an id <= floor are discarded
  let stale = false;

  function setStale(next: boolean) {
    if (stale === next) return;
    stale = next;
    deps.onStale(next);
  }

  function clearScheduled() {
    if (timer === null) return;
    deps.clearTimer(timer);
    timer = null;
  }

  function schedule() {
    clearScheduled();
    timer = deps.setTimer(() => {
      timer = null;
      void refreshNow();
    }, deps.intervalMs);
  }

  async function refreshNow() {
    const id = ++started;
    // Restart the interval so a manual refresh is not followed right away by a poll.
    if (running) schedule();
    const isOutdated = () => id <= floor || id < applied;

    try {
      const events = await deps.fetchEvents();
      if (isOutdated()) return;
      applied = id;
      deps.onEvents(events);
      setStale(false);
    } catch {
      if (isOutdated()) return;
      setStale(true);
    }
  }

  return {
    start() {
      running = true;
      schedule();
    },
    stop() {
      running = false;
      floor = started;
      clearScheduled();
    },
    refreshNow,
    invalidate() {
      floor = started;
    },
  };
}
