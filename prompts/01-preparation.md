---
when-to-use: Once per repository, in a new session, before the first feature. Works for a new repository or an existing codebase. Run it again when the stack or the conventions change.
---

Always reply in English and write every file you create or change in English, even when I write to you in another language.

You are a Staff Engineer setting up the engineering governance of this repository before any feature work. Do NOT write application code, do NOT scaffold a project and do NOT add new dependencies in this step.

1. Survey the repository and decide the mode:
   - **Greenfield**: empty, or only documents. If it is not a git repository yet, run `git init`.
   - **Existing codebase**: map, briefly and from evidence (manifests, configs, folders, a few source and test files):
     - the project type(s): backend API, web frontend, mobile, full-stack, library or CLI;
     - languages, frameworks and package manager;
     - where each part lives and the architecture actually used (layers, module boundaries, naming);
     - the test framework and how the existing tests are written;
     - the scripts or commands for install, test, type-check, lint, build and run;
     - existing agent instructions: `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.github/instructions/`, `.agents/skills/`, `.cursor/rules/` and similar.
2. Write `AGENTS.md` at the root from the template between the BEGIN/END markers below:
   - Fill in the "Project" section and the "Commands" table with what you found. Keep "to be defined" where nothing exists yet.
   - In an existing codebase, if `AGENTS.md` already exists, do NOT overwrite it: keep its content and add only the sections of the template that are missing. Where an existing rule conflicts with the template, the existing rule wins; list the conflicts in your reply.
   - Keep everything else as written.
3. Write `.github/copilot-instructions.md` with this line at the top. If the file already exists, keep its content below the line:
   "Read and follow `AGENTS.md` at the repository root before any action. It is the single source of truth for the engineering rules of this project."
4. Existing codebase only: install the dependencies with the project's package manager and run the test command once, to record the baseline (passing or failing) before any change.
5. Reply with: the mode, the project type and stack, the files created or changed, any conflict with existing rules, and the test baseline.

----- BEGIN AGENTS.md -----
# AGENTS.md

Engineering rules for every agent session in this repository. Read this file before any action.

## Project

- **Mode:** greenfield | existing codebase
- **Type:** backend API | web frontend | mobile | full-stack | library | CLI
- **Stack:** languages, frameworks, package manager, test framework
- **Structure:** where each part lives (e.g. `backend/`, `frontend/`, `src/domain/`)
- **Existing project rules:** links to the instruction files and skills already in the repository. They win over this file where they conflict.

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

| Purpose | Command |
|---|---|
| Install | to be defined |
| Test | to be defined |
| Type-check | to be defined |
| Lint | to be defined |
| Build | to be defined |
| Run | to be defined |

## Definition of done (per task)

1. Every acceptance criterion (`AC-n`) of the task is covered by at least one passing test, or by a described manual check when it is pure visual UI.
2. Test, type-check, lint and build pass. A failure that existed before the task is reported separately.
3. At most 3 targeted attempts to fix a failing check; after that, stop and report.
4. The task checkbox in `docs/PLAN.md` is marked `[x]`.
5. A short report: what changed, files, AC → tests, check results and a suggested Conventional Commit message citing the task. The human reviews and commits.

## Language and chat output

- Everything is in English: chat answers, documents, code, comments, tests, reports and commit messages, even when the human writes in another language. The only exception is `docs/PROBLEM.md`, which keeps the problem statement verbatim, in its original language.
- Keep chat answers short and scannable. Long content goes into the files.
----- END AGENTS.md -----
