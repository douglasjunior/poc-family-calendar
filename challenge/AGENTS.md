# AGENTS.md

Engineering rules for every agent session in this repository. Read this file before any action.

## Project

- **Mode:** existing codebase
- **Type:** full-stack (Express API + React web app in one package)
- **Stack:** TypeScript (strict), Node 22+, pnpm, Express 5, PostgreSQL 17 (`pg`, Docker), React 19, Vite 8, Vitest 5. No linter and no build script are configured.
- **Structure:** `server/` (Express routes in `index.ts`, repositories, `db.ts`, `seed.ts`), `web/` (`App.tsx`, `api.ts`, `hooks/`, `components/`), `shared/` (types and date helpers used by both), `docker/` (DB init SQL). Tests are colocated as `*.test.ts`. See `README.md` for the API and the product description.
- **Existing project rules:** `README.md` documents behavior and structure. No other agent instruction files exist (`CLAUDE.md`, `.cursor/rules/`, `.agents/skills/` are absent). Existing code conventions win over this file where they conflict.

## Workflow: spec-driven — the AI executes, the human decides

| Artifact | Answers | Rule |
|---|---|---|
| `docs/PROBLEM.md` | The original problem statement, verbatim | Never edit it |
| `docs/SPEC.md` | What and why: scope, rules, acceptance criteria, decisions | Written by the Product Owner step, from the problem and the human's answers |
| `docs/PLAN.md` | How: stack, architecture, contracts, task checklist | Written by the Tech Lead step |

- Precedence when artifacts disagree: `PROBLEM.md` > decisions recorded in `SPEC.md` > `PLAN.md` > existing code. A disagreement with no recorded decision is a question for the human. Never pick a side silently.
- Traceability IDs: business rules `BR-n`, acceptance criteria `AC-n`, non-functional requirements `NFR-n`, assumptions `A-n`, tasks `T-n`. Tests, reports and commit messages cite them. An ID is never reused.
- One session, one step. Each task runs in a fresh session that reads these files instead of relying on chat history.

## Escalate instead of guessing

- A decision that belongs to the human (business rule, scope, user-visible behavior, technology without a firm basis) is asked, never invented. A guess, a TODO or a note in a file does not replace the answer.
- Investigate first (problem, specs, code). A question is not a shortcut for shallow investigation.
- Ask at most 5 questions per round, highest impact first. Each question has: a short area, one self-contained question, why it matters (what changes depending on the answer) and 2 to 4 options, with the recommended option first and its reason.
- Use your native tool for asking the user questions when you have one (an interactive question with selectable options): one entry per question, the options as choices, the recommended option first with "(Recommended)" in its label and why it matters in the question or in the option descriptions. If the tool accepts fewer questions per call, split the round into consecutive calls. Do not repeat the questions as text in chat.
- Only when the tool has no such feature, write the questions in chat in this format and stop:

  ### Q<n> · <area>
  **Question:** <one self-contained question>
  **Why it matters:** <one sentence about what changes depending on the answer>
  **Options:** A) <option> *(recommended: <short reason>)* · B) <option>

- Do not continue the work that depends on a question before it is answered. Number the questions `Q<n>` across rounds, so the answers can be recorded and cited.

## Stack defaults (greenfield only)

Used only when neither the problem nor the stakeholders impose a stack:
- Language: TypeScript in strict mode, no `any`.
- Backend API: Node.js + NestJS.
- Web frontend: React + Vite + Tailwind CSS.
- Mobile: React Native + Expo.
- Back + front: one repository with `backend/` and `frontend/`, and the API contract defined in `docs/PLAN.md`.
- Tests: Vitest (Jest for React Native).
In an existing codebase, the existing stack and conventions always win. Follow the neighboring code.

## Architecture: Clean Architecture with Ports and Adapters

The layers are concepts. Their folders follow the project's convention, recorded in "Project".
- **Domain**: entities, value objects, business rules, validations and formatters. Pure code: no framework, no I/O, no UI. Clock and ID generation are injected, never called directly.
- **Application**: use cases that orchestrate the domain and declare ports (interfaces) for what they need from the outside.
- **Infrastructure**: adapters that implement the ports: database, HTTP clients, local storage, external APIs.
- **Delivery**: controllers and routes (backend); screens, components and hooks (web and mobile). It calls use cases and holds no business rule.
- Dependencies point inward: delivery and infrastructure → application → domain.
- In a full-stack project, backend and frontend each have their own layers. They share only the API contract, never the code of their domains.
- In an existing codebase with a different architecture, follow the existing one. Do not refactor it as a side effect; if it blocks the task, ask.
- A folder exists only when there is code for it.

## Testing and TDD

- Domain and application code is test-first: write the test from the acceptance criterion, run it and see it fail for the right reason, implement the minimum to pass, then refactor with the suite green.
- Tests belong to the same task that creates the code, never to a later task.
- Test names cite the acceptance criterion, e.g. `it('AC-3: rejects a lead without e-mail', ...)`.
- Unit tests are deterministic: no network, no real clock, no state shared between tests.
- Never delete, skip or weaken a test to make the suite pass.

## Code

- Small functions with intention-revealing names; early returns over nested conditionals.
- Validate input at the boundaries. The domain receives valid types or returns explicit errors.
- No dead code: every installed dependency is used, every created file is referenced, one source of truth per piece of data.
- No secrets in code. Untrusted input is never rendered as raw HTML or executed.
- Comments explain why, not what. Every text in the repository describes the current state, never the history of the change.

## Scope discipline

- Work only on the task you were given. Report unrelated problems instead of fixing them on the way.
- If the plan turns out to be wrong or incomplete, stop and ask. Do not silently deviate from it.

## Commands

The task that creates or changes a script updates this table. Run only the commands listed here; a check that does not exist is reported as skipped, never improvised. In a full-stack project, list the commands of each part.

Run all commands from this directory (`challenge/`). Server and web share one `package.json`. Docker must be running: `test` and `dev` start Postgres (host port 5437).

| Purpose | Command |
|---|---|
| Install | `pnpm install` |
| Test | `pnpm test` (starts Postgres, reseeds `calendar_test`, runs Vitest) |
| Type-check | `pnpm typecheck` |
| Lint | to be defined |
| Build | to be defined |
| Run | `pnpm dev` (API on :3001, web on :5173) |
| Reset database | `pnpm db:reset` |

## Definition of done (per task)

1. Every acceptance criterion (`AC-n`) of the task is covered by at least one passing test, or by a described manual check when it is pure visual UI.
2. Test, type-check, lint and build pass. A failure that existed before the task is reported separately.
3. At most 3 targeted attempts to fix a failing check; after that, stop and report.
4. The task checkbox in `docs/PLAN.md` is marked `[x]`.
5. A short report: what changed, files, AC → tests, check results and a suggested Conventional Commit message citing the task. The human reviews and commits.

## Language and chat output

- Everything is in English: chat answers, documents, code, comments, tests, reports and commit messages, even when the human writes in another language. The only exception is `docs/PROBLEM.md`, which keeps the problem statement verbatim, in its original language.
- Keep chat answers short and scannable. Long content goes into the files.
