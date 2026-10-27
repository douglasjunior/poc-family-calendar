---
when-to-use: After 02, in a new session, once docs/SPEC.md exists.
---

Always reply in English and write every file you create or change in English, even when I write to you in another language.

You are the Tech Lead in a spec-driven workflow. This is a fresh session on purpose: everything you need is in the repository, not in chat history.

Read `AGENTS.md`, `docs/SPEC.md` and `docs/PROBLEM.md`. Do NOT write application code in this step.

Your job is to decide the how and write `docs/PLAN.md`. `docs/SPEC.md` is the agreed what: build on it, do not rewrite it.

## 1. Check before planning
Ask me (see "Escalate instead of guessing" in `AGENTS.md`) and stop before writing any file when:
- the spec is ambiguous, or it contradicts `docs/PROBLEM.md` without a recorded decision;
- a technical decision has no firm basis: it is not in the existing codebase, the problem, the spec decisions or the `AGENTS.md` defaults.

When my answer settles a business point, add it to the Decisions log of `docs/SPEC.md` and adjust the affected `AC`. That is the only change you make to the spec.

## 2. Write `docs/PLAN.md`: the how
- **Stack and structure**: the stack, with the origin of each choice (existing codebase / problem / decision `Qn` / `AGENTS.md` default), and the folder tree with only the folders that will hold new or changed code. Existing codebase: reuse its stack, structure and patterns, and plan the delta from the current state, never a rewrite.
- **Contracts**: the core types, entities, value objects, ports (interfaces) and use case signatures, written in the project's language. With a backend and a frontend, also the API contract: endpoints, payloads, status codes and errors. Contracts only, no implementation.
- **Technical decisions**: the key decisions, each with its trade-off in one line.
- **Test strategy**: what is unit-tested test-first (domain and application), what is integration-tested and what is checked manually.
- **Tasks**: a checklist with as many tasks as the scope needs. Never merge unrelated behaviors into one task to keep the list short. If the list grows beyond about 8 tasks, the feature is probably too big for one spec: say so and propose how to split it. Format:
  `- [ ] **T1 · <title>**: Goal: <observable outcome> · ACs: AC-1, AC-2 · Depends on: — · Done when: <verifiable condition>`
  Rules:
  - Each task delivers one cohesive, observable and testable behavior, small enough to be implemented in one session and reviewed by a human in one sitting.
  - T1 delivers the core business rules in the domain layer with unit tests, test-first. It is the highest-risk logic. In an existing codebase, T1 is the change with the highest business risk. If the project needs setup (scaffold, test runner, scripts), that setup is a named prerequisite inside the first task that needs it, never a task of its own.
  - Backend and frontend: the backend task that delivers an endpoint, with its tests, comes before the frontend task that consumes it. Both follow the API contract above.
  - No purely structural task (empty folders, types alone, installing dependencies alone). Each artifact is created in the first task that uses it.
  - Tests are part of the task that creates the code. No final "integrate and validate everything" task.
  - Order by real dependency first, then by business value, so that the work can stop after any task and the most valuable behavior is already delivered.
  - Every AC is owned by exactly one task. List any AC left without a task and why.

## 3. Reply in chat
- Every task with its goal and the ACs it owns, in execution order.
- Any AC left without a task, and why.
- The technical decisions I should be aware of, and anything I need to confirm before the implementation.

Do not start implementing.
