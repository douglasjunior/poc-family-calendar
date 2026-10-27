# SPEC — Family Calendar: trust in what the calendar shows

Source of truth for the problem: `docs/PROBLEM.md`. Precedence: `PROBLEM.md` > decisions in this file > `docs/PLAN.md` > existing code.

## Overview

The family calendar must let every person trust that what they see is complete and current. Today an event can silently land in a group the intended readers are not in, and an open calendar never learns about other people's changes.

## Current state (findings, not requirements)

- **Wrong group by default.** The New event form preselects the group of the user's most recent event. Son's last event is in *Soccer team*, so "Dentist" most likely went there. Mom is not a member, so she never sees it. Neither Son nor Mom is told.
- **No sync.** The event list is fetched once when the page opens and is only changed by the user's own actions. Other people's creates, edits and deletes appear only after a manual page reload.

## Scope

**In**
- Explicit group choice when creating an event.
- Confirmation after a save.
- Automatic update of an open calendar and a manual refresh button.
- "New" and "Updated" marks, and a notice for deleted events.
- Failure states for saving and updating.

**Out**
- Mobile apps, offline use, login and permissions beyond groups, recurring events (from the problem).
- Coach Rivera's "diary" complaint (Q4).
- Handling of two people editing the same event at the same time (Q6).
- Group management, new groups or users.
- Layout or design changes beyond what the items above need.

## Actors

| Actor | Groups | Role in the problem |
|---|---|---|
| Mom | Family | Reads the calendar all day, misses events. |
| Dad | Family | Adds events, unsure his view is the latest. |
| Son | Family, Soccer team | Adds events quickly, picks the wrong group. |
| Coach Rivera | Soccer team | Moves practices, others do not see the change. |

An event is visible to every member of its group and to nobody else (existing behavior, unchanged).

## Business rules

| ID | Rule | Source |
|---|---|---|
| BR-1 | A user who belongs to more than one group must choose the event's group explicitly when creating an event. The form never preselects a group from past events, and the event cannot be saved until a group is chosen. | Q1; Mom, Son pains |
| BR-2 | A user who belongs to only one group has it preselected. | A-6 |
| BR-3 | After a successful save, the user sees a confirmation naming the group and the people who can see the event. | A-4; Son "Nobody believes me" |
| BR-4 | An open calendar updates by itself within 10 seconds of another person's create, edit or delete, with no page reload. | Q2; Mom, Dad pains |
| BR-5 | A manual **Refresh** button updates the calendar immediately. | Q2 |
| BR-6 | An event created by someone else since this browser last showed the calendar to this user is marked **New**. | Q3; Mom "what else I'm missing" |
| BR-7 | An event edited by someone else (title, time, group, notes) since this browser last showed it to this user is marked **Updated**. | Q3; Coach "I move a practice" |
| BR-8 | A mark clears when the user opens that event. Events the user created or edited themselves are never marked. | A-9 (pending) |
| BR-9 | Which events a user has already seen is remembered per browser, per user, not on the server. | Q7 |
| BR-10 | When another person deletes an event the user had seen, the user gets a dismissible notice naming the event's title, date and time. The user's own deletes produce no notice. | Q5 |
| BR-11 | The first time a browser shows the calendar for a user, no event is marked New or Updated and no deletion notice appears. | A-10 (pending) |
| BR-12 | If a save fails, the user sees the error and the event is not shown as saved. If an update fails, the calendar shows a "may be out of date" notice until an update succeeds. | A-3 |

## Acceptance criteria

| ID | Given / When / Then | Rule |
|---|---|---|
| AC-1 | Given Son (Family and Soccer team) whose last event is in Soccer team, when he opens New event, then no group is selected and the Save button does not save until he picks one. | BR-1 |
| AC-2 | Given Son leaves the group unset, when he tries to save "Dentist", then the form shows "Group is required" and no event is created. | BR-1 |
| AC-3 | Given Coach Rivera (only Soccer team), when he opens New event, then Soccer team is preselected. | BR-2 |
| AC-4 | Given Son picks Family and saves "Dentist", when the save succeeds, then he sees "Added to Family · visible to Dad, Mom, Son" (members in alphabetical order) and the event is on his calendar. | BR-3 |
| AC-5 | Given Mom has the calendar open on that week, when Son saves "Dentist" in Family, then within 10 seconds it appears on Mom's screen without a reload. | BR-4 |
| AC-6 | Given Dad has the calendar open, when Coach edits a Soccer team event, then Dad's screen is unchanged (he is not in the group) and shows no mark or notice. | BR-4 |
| AC-7 | Given Son has the calendar open, when Coach changes a practice from 5:00 PM to 6:00 PM, then within 10 seconds Son's calendar shows the practice at 6:00 PM. | BR-4 |
| AC-8 | Given Mom's calendar has not updated yet, when she presses Refresh, then the latest events show immediately, without a page reload. | BR-5 |
| AC-9 | Given Mom has seen the calendar before, when Son adds "Dentist" to Family, then on Mom's screen the event shows a **New** mark. | BR-6 |
| AC-10 | Given Mom has seen "Dinner" before, when Dad edits its time, then it shows an **Updated** mark on Mom's screen. | BR-7 |
| AC-11 | Given "Dentist" shows **New** on Mom's screen, when Mom opens it, then the mark is gone and stays gone after a reload in the same browser. | BR-8, BR-9 |
| AC-12 | Given Son creates or edits an event himself, then it never shows New or Updated on his own screen. | BR-8 |
| AC-13 | Given Mom marked "Dentist" as seen in browser A, when she opens the calendar in browser B, then BR-11 applies and nothing is marked in browser B. | BR-9, BR-11 |
| AC-14 | Given Mom has seen "Pilates", when Dad deletes it, then within 10 seconds Mom sees a notice such as "Pilates (Tue, 7:00 AM) was removed" that she can dismiss, and the event is gone from the grid. | BR-10 |
| AC-15 | Given Mom deletes "Pilates" herself, then she sees no removal notice. | BR-10 |
| AC-16 | Given Mom opens the calendar for the first time in a new browser, then no event is marked New or Updated and no removal notice appears. | BR-11 |
| AC-17 | Given the server is unreachable, when Son presses Save, then the form shows the error message, the event does not appear on the grid and the form stays open with his input. | BR-12 |
| AC-18 | Given Mom's calendar is open, when an automatic update fails, then a "may be out of date" notice shows and disappears after the next successful update, and the events already on screen stay visible. | BR-12 |

## Non-functional requirements

| ID | Requirement | Source |
|---|---|---|
| NFR-1 | Events persist across page reloads and server restarts. | A-1; existing behavior |
| NFR-2 | Platform is a desktop web browser. Online only. Mobile apps and offline use are out of scope. | PROBLEM.md; A-1 |
| NFR-3 | Times are shown in the viewer's local time zone. | A-2 |
| NFR-4 | The New event form is operable by keyboard: labelled fields, first field focused, Esc closes, Enter saves. The Refresh button and the notices are reachable by keyboard, and notices are announced to assistive technology. | A-8 |
| NFR-5 | Creating an event stays a quick flow: title, time, group, save. | Son "ten seconds" |
| NFR-6 | The existing stack and conventions stay (see `AGENTS.md`). | AGENTS.md |

## Decisions log

- **Q1 · Group choice** — When creating an event, how is the group chosen? → Decision: force an explicit choice, no preselection.
- **Q2 · Freshness** — How do other people's changes reach an open calendar? → Decision: automatic within about 10 seconds, plus a manual refresh button.
- **Q3 · Change marks** — Highlight what changed since the user last looked? → Decision: yes, mark **New** and **Updated**.
- **Q4 · Coach privacy** — Is Coach's "diary" complaint in scope? → Decision: no, out of scope.
- **Q5 · Deleted events** — What do others see when an event is deleted? → Decision: a notice naming the removed event.
- **Q6 · Edit conflict** — What if two people edit the same event from an outdated copy? → Decision: out of scope.
- **Q7 · Seen marks** — Where is "already seen" remembered? → Decision: per browser only.
- **Q8 · Assumptions** — Approve A-1 to A-8? → Decision: approve all.
- **Q9 · Member order** — In what order are the people named in the save confirmation (BR-3)? → Decision: alphabetical by name; AC-4 updated accordingly.
- **Q10 · Who sees a practice change** — AC-7 named "a parent", but parents are not in Soccer team and never see practices. → Decision: AC-7 uses Son, the only app user who sees both the Coach's changes and the family's events.

## Approved assumptions

- **A-1** Desktop web only, with the four existing people and two groups. No group management, no login. Events persist.
- **A-2** Times are shown in the viewer's local time zone.
- **A-3** A failed save shows an error and the event is not shown as saved. A failed background update shows a "may be out of date" notice.
- **A-4** After a successful save, a confirmation names the group and who can see the event.
- **A-5** Any member of a group can edit or delete its events (current behavior). Each event shows who added it.
- **A-6** A user in only one group has it preselected.
- **A-7** Events already saved in a group are not migrated. People move them by editing the group.
- **A-8** The form stays usable by keyboard: labelled fields, Esc closes, first field focused.

## Assumptions awaiting approval

Added while writing the spec. They were not in the list the human approved.

- **A-9** "Seen" means the user opened the event (BR-8). The alternative is "the event was visible on screen", which would leave marks on other weeks unclear.
- **A-10** The first time a browser shows the calendar for a user, nothing is marked and no deletion notice appears (BR-11). Otherwise every event would show as New on first use.

## Open questions

None.
