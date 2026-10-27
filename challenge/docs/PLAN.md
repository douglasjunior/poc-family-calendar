# PLAN — Family Calendar: trust in what the calendar shows

How to build `docs/SPEC.md`. Precedence: `PROBLEM.md` > decisions in `SPEC.md` > this file > existing code. Delta from the current codebase, not a rewrite.

## 1. Stack and structure

| Choice | Origin |
|---|---|
| TypeScript strict, Node 22+, pnpm | existing codebase |
| Express 5 API, PostgreSQL 17 via `pg` | existing codebase |
| React 19 + Vite 8 | existing codebase |
| Vitest 5, tests colocated as `*.test.ts`, run in the `node` environment | existing codebase |
| Automatic update by polling `GET /api/events` | decision in this plan (D-1); no new dependency |
| "Seen" memory in `localStorage` | SPEC Q7 (per browser) |

No new dependency is added. There is no DOM test tool (no jsdom, no Testing Library), so React components are checked manually and all logic worth testing lives in plain TypeScript modules.

Folders with new or changed code only:

```
shared/
  types.ts                  changed: updatedAt/updatedBy on CalendarEvent, members on groups, recentGroupId removed
server/
  db.ts                     changed: updated_at, updated_by columns
  seed.ts                   changed: fills the new columns
  events.repository.ts      changed: new columns, updatedBy on update, recent-group query removed
  events.repository.test.ts changed: new tests
  users.repository.ts       changed: groups with members
  users.repository.test.ts  new
  index.ts                  changed: /api/me payload, PATCH passes the acting user
web/
  api.ts                    changed: readable network error
  group-choice.ts           new (+ test)
  save-confirmation.ts      new (+ test)
  event-sync.ts             new (+ test)
  change-tracking.ts        new (+ test)
  seen-storage.ts           new (localStorage adapter)
  hooks/useEvents.ts        changed: uses event-sync
  hooks/useChangeTracking.ts new
  components/EventModal.tsx changed
  components/EventBlock.tsx changed: New/Updated badge
  components/WeekView.tsx   changed: passes marks
  components/Notices.tsx    new: confirmation, stale and removal notices
  App.tsx                   changed: Refresh button, notices, wiring
```

The web layers follow the existing convention: pure rules in plain modules under `web/` (domain), hooks (application), `api.ts` and `seen-storage.ts` (infrastructure), components (delivery). The server keeps repositories and routes as they are.

## 2. Contracts

### Shared types (`shared/types.ts`)

```ts
export type GroupWithMembers = Group & { members: User[] }; // members sorted by name (Q9)

export type CalendarEvent = {
  // existing fields unchanged
  updatedAt: string; // ISO; equals createdAt until the first edit
  updatedBy: string; // user id; equals createdBy until the first edit
};

export type Me = {
  user: User;
  groups: GroupWithMembers[];
  // recentGroupId removed: nothing may preselect a group (BR-1)
};
```

### API (changes only; everything else stays as in `README.md`)

| Endpoint | Change |
|---|---|
| `GET /api/me?user=` | `200 { user, groups: GroupWithMembers[] }`. `recentGroupId` is gone. `404 { error }` for an unknown user, as today. |
| `GET /api/events?user=` | Each event now carries `updatedAt` and `updatedBy`. Visibility rule unchanged: only events of the user's groups. |
| `POST /api/events?user=` | Request unchanged. Response `201` has `updatedAt = createdAt`, `updatedBy = createdBy`. `400 { error: "Group is required" }`, `403` and `400` rules unchanged. |
| `PATCH /api/events/:id?user=` | Request unchanged. Sets `updatedBy` to the acting user and `updatedAt` to now. Response `200` with the full event. Errors unchanged. |
| `DELETE /api/events/:id?user=` | Unchanged. |

Database: `events` gains `updated_at timestamptz NOT NULL DEFAULT now()` and `updated_by text NOT NULL REFERENCES users (id)`. Existing development databases are recreated with `pnpm db:reset` (the schema uses `CREATE TABLE IF NOT EXISTS`, so no in-place migration is written).

### Server ports (repositories)

```ts
// events.repository.ts
createEvent(input: EventInput, createdBy: string): Promise<CalendarEvent>             // updated_by = createdBy
updateEvent(id: number, input: EventInput, updatedBy: string): Promise<CalendarEvent | undefined>
// findRecentGroupId removed

// users.repository.ts
listGroupsForUser(userId: string): Promise<GroupWithMembers[]>
```

### Web modules

```ts
// group-choice.ts
export const GROUP_REQUIRED = 'Group is required';
export function initialGroupId(groups: Group[]): string;          // '' when groups.length !== 1 (BR-1, BR-2)
export function validateGroupChoice(groupId: string): string | null; // GROUP_REQUIRED or null

// save-confirmation.ts
export function formatSaveConfirmation(group: GroupWithMembers): string;
// "Added to Family · visible to Dad, Mom, Son"

// event-sync.ts  (framework-free, timer and fetch injected)
export type EventSyncDeps = {
  fetchEvents: () => Promise<CalendarEvent[]>;
  intervalMs: number;
  setTimer: (fn: () => void, ms: number) => unknown;
  clearTimer: (handle: unknown) => void;
  onEvents: (events: CalendarEvent[]) => void;
  onStale: (stale: boolean) => void;   // true after a failed update, false after the next success
};
export type EventSync = {
  start(): void;
  stop(): void;
  refreshNow(): Promise<void>;          // Refresh button; also used after the user's own changes
  invalidate(): void;                   // a local change was made: drop responses of fetches started before it
};
export function createEventSync(deps: EventSyncDeps): EventSync;

// change-tracking.ts  (pure)
export type SeenEntry = { title: string; startsAt: string; updatedAt: string };
export type SeenStore = Record<number, SeenEntry>;       // key: event id
export type EventMark = 'new' | 'updated';
export type RemovedNotice = { eventId: number; title: string; startsAt: string };
export type Reconciliation = {
  marks: Record<number, EventMark>;
  removed: RemovedNotice[];
  store: SeenStore;                                      // store to persist
};
export function reconcile(
  store: SeenStore | null,   // null = first time in this browser for this user (BR-11)
  events: CalendarEvent[],
  userId: string,
): Reconciliation;
export function markSeen(store: SeenStore, event: CalendarEvent): SeenStore;   // opening or saving
export function forget(store: SeenStore, eventId: number): SeenStore;          // the user's own delete
export function formatRemovedNotice(notice: RemovedNotice): string;            // "Pilates (Tue, 7:00 AM) was removed"

// seen-storage.ts  (infrastructure)
export const seenStorage: {
  load(userId: string): SeenStore | null;  // null when absent, unreadable or storage unavailable
  save(userId: string, store: SeenStore): void; // never throws
};
```

`reconcile` rules (derived from BR-6 to BR-11):
- `store === null`: no marks, no removals, `store` = every event in `events`.
- Event not in the store: created by the user → add silently; created by someone else → mark `new`, leave it out of the store until opened.
- Event in the store with a different `updatedAt`: edited by the user → refresh the entry silently; by someone else → mark `updated`, keep the old entry until opened.
- Store entry whose event is no longer in `events` → one `RemovedNotice`, entry dropped.

## 3. Technical decisions

| ID | Decision | Trade-off |
|---|---|---|
| D-1 | Poll `GET /api/events` every 10 s (human decision). | Simple, no new technology and light traffic. A change lands on the next poll, so it shows up within about 10 s plus request time (BR-4); the Refresh button covers the gap. SSE or WebSockets would be instant but are new infrastructure. |
| D-2 | "Updated" uses new `updated_at`/`updated_by` columns. | Excludes the user's own edits made in any browser (BR-8), at the cost of a schema change and a `pnpm db:reset`. |
| D-3 | Deletions are found by comparing the browser's seen store with the latest list; the server keeps no deletion log. | No server change, matches Q7. A notice also appears when an event leaves the user's view for another reason (for example it is moved to a group the user is not in); it reads "was removed". |
| D-4 | Marks are derived from the store on every update, not stored themselves. | The mark survives reloads and clears only through `markSeen`; the store is the single source of truth. |
| D-5 | After the user's own create, edit or delete, the list is patched locally, `invalidate()` is called and the store is updated (`markSeen` or `forget`). | Prevents a poll that was already in flight from removing the new event or flashing a mark on the user's own change. |
| D-6 | Pure rules live in plain modules with injected storage, timer and fetch. | Unit-testable in the `node` environment without a DOM tool; components stay thin and are checked manually. |
| D-7 | `recentGroupId` and `findRecentGroupId` are deleted. | Nothing uses them after BR-1 (no dead code). |
| D-8 | The group `<select>` starts on a disabled "Choose a group" option when the user has several groups. The user's own list is the only group source. | Satisfies BR-1 and AC-1; server validation `Group is required` remains as the second guard. |

## 4. Test strategy

- **Unit, test-first (domain and application):** `group-choice`, `save-confirmation`, `event-sync` (fake timer and fetch), `change-tracking` (`reconcile`, `markSeen`, `forget`, `formatRemovedNotice`). Test names cite the AC, e.g. `it('AC-9: marks an event created by someone else as new', ...)`.
- **Integration (real Postgres `calendar_test`, `pnpm test`):** repository tests for the new columns, `updatedBy` on update, group visibility (AC-6) and members ordered by name. Routes live in `server/index.ts`, which starts the server on import, so they are covered through the repositories; no HTTP test tool exists.
- **Manual (UI, two browser windows `?user=mom` and `?user=son`):** the visual and timing parts of AC-1 to AC-5, AC-7, AC-8, AC-9 to AC-11, AC-13 to AC-18 and the keyboard and announcement points of NFR-4. Each task's report lists the steps performed.
- Typecheck (`pnpm typecheck`) must pass after every task. Lint and build do not exist and are reported as skipped.

## 5. Tasks

- [x] **T1 · Explicit group choice when creating an event**: Goal: a user with several groups must pick the group before saving, and a user with one group gets it preselected; the "most recent group" default no longer exists · ACs: AC-1, AC-2, AC-3 · Depends on: — · Done when: `initialGroupId` and `validateGroupChoice` have unit tests written first; `recentGroupId` and `findRecentGroupId` are removed from types, API and repository; the New event form shows "Group is required" and creates nothing for Son until a group is chosen, and preselects Soccer team for Coach Rivera (manual check); `pnpm test` and `pnpm typecheck` pass.
- [x] **T2 · Save outcome feedback**: Goal: after a successful save the user sees which group the event went to and who can see it; after a failed save the form shows the error and keeps the input · ACs: AC-4, AC-17 · Depends on: T1 · Done when: `listGroupsForUser` returns members sorted by name (integration test); `formatSaveConfirmation` has a unit test; `/api/me` returns `groups[].members`; Son sees "Added to Family · visible to Dad, Mom, Son" announced as a status message; with the API stopped, Save shows a readable error ("Could not reach the server"), the form stays open with the input and the grid has no new event (manual check); `pnpm test` and `pnpm typecheck` pass.
- [x] **T3 · Automatic update and Refresh button**: Goal: an open calendar shows other people's creates, edits and deletes within 10 seconds without a reload, and the Refresh button updates it immediately · ACs: AC-5, AC-6, AC-7, AC-8 · Depends on: — · Done when: `createEventSync` has unit tests (polls at the interval, `refreshNow` fetches at once, `invalidate` discards older responses, `stop` stops polling); `useEvents` uses it with a 10 s interval and the user's own changes call `invalidate()`; a repository test proves an event in Soccer team is not returned to Dad; with two windows Mom's screen shows Son's "Dentist" and Coach's time change within 10 s, Dad's screen does not change, and Refresh updates at once (manual check); the Refresh button is keyboard reachable; `pnpm test` and `pnpm typecheck` pass.
- [x] **T4 · "May be out of date" notice**: Goal: when an automatic update fails the user is told, keeps the events already shown, and the notice goes away after the next success · ACs: AC-18 · Depends on: T3 · Done when: `event-sync` unit tests cover failure then recovery through `onStale`; the notice is announced to assistive technology; with the API stopped and restarted, Mom's open calendar shows the notice and then clears it, with events visible throughout (manual check); `pnpm test` and `pnpm typecheck` pass.
- [ ] **T5 · "New" mark with per-browser memory**: Goal: events created by someone else since this browser last showed the calendar get a New mark that clears when the user opens the event and stays cleared after a reload; the first visit of a browser marks nothing · ACs: AC-9, AC-11, AC-13, AC-16 · Depends on: T3 · Done when: `reconcile` (new, baseline, own events), `markSeen` and `seenStorage` fallbacks have unit tests written first; `useChangeTracking` and `seen-storage.ts` persist per user and per browser; `EventBlock` shows a New badge that is readable without colour; Mom sees New on "Dentist", opening it clears the mark across a reload, and a second browser profile shows no marks (manual check); `pnpm test` and `pnpm typecheck` pass.
- [ ] **T6 · "Updated" mark and no marks on one's own changes**: Goal: events edited by someone else since the user last saw them get an Updated mark, and the user's own creates and edits are never marked · ACs: AC-10, AC-12 · Depends on: T5 · Done when: `updated_at`/`updated_by` exist in the schema and seed, `createEvent` and `updateEvent(id, input, updatedBy)` set them, the PATCH route passes the acting user (integration tests for create and update); `reconcile` unit tests cover `updated` and own edits; Mom sees Updated after Dad edits "Dinner", and Son never sees a mark on his own create or edit (manual check; development databases need `pnpm db:reset`); `pnpm test` and `pnpm typecheck` pass.
- [ ] **T7 · Removal notice for deleted events**: Goal: when another person deletes an event the user had seen, the user gets a dismissible notice naming it, and the user's own deletes produce none · ACs: AC-14, AC-15 · Depends on: T5 · Done when: `reconcile` removal cases, `forget` and `formatRemovedNotice` have unit tests written first (including that a first visit produces no notice, which complements AC-16); notices are dismissible, keyboard reachable and announced; Mom sees "Pilates (Tue, 7:00 AM) was removed" within 10 s of Dad deleting it, the event leaves the grid, and her own delete shows no notice (manual check); `pnpm test` and `pnpm typecheck` pass.

Order follows the real dependencies and then business value: T1 and T2 fix the cause of the reported complaint, T3 and T4 give freshness, T5 to T7 add the "what changed" awareness. The work can stop after any task.

## 6. AC ownership

| AC | Task | AC | Task |
|---|---|---|---|
| AC-1 | T1 | AC-10 | T6 |
| AC-2 | T1 | AC-11 | T5 |
| AC-3 | T1 | AC-12 | T6 |
| AC-4 | T2 | AC-13 | T5 |
| AC-5 | T3 | AC-14 | T7 |
| AC-6 | T3 | AC-15 | T7 |
| AC-7 | T3 | AC-16 | T5 |
| AC-8 | T3 | AC-17 | T2 |
| AC-9 | T5 | AC-18 | T4 |

Every AC has exactly one owner. No AC is left without a task. NFR-4 is split by what each task adds (form: T1, notices and Refresh: T2, T3, T4, T7); NFR-1, NFR-2, NFR-3 and NFR-6 need no change beyond the tasks above.

## 7. Out of the plan

Q4 (Coach's "diary" complaint) and Q6 (simultaneous edits) are out of scope in the spec and have no task.
