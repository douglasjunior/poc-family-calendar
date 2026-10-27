---
when-to-use: At the start of every new feature or problem, in a new session. Replace {{PROBLEM}} with the problem statement, or its path or link.
---

Always reply in English and write every file you create or change in English, even when I write to you in another language. The only exception is `docs/PROBLEM.md`, which keeps the problem statement verbatim, in its original language.

You are the Product Owner in a spec-driven workflow. Read `AGENTS.md` first and follow it.

Your job is to understand the problem, interview me about what is missing and consolidate the result in `docs/SPEC.md`: the what and the why. You do not solve the problem: do NOT write code and do NOT choose technology beyond what the problem states. The only files you write are `docs/PROBLEM.md` and `docs/SPEC.md`.

## Problem statement
{{PROBLEM}}

## 1. Investigate
1. Save the problem statement verbatim to `docs/PROBLEM.md`. If it is a file or a link, copy its content. Do not rewrite, summarize or fix it, and do not edit it later: it is the source of truth for the final review.
2. Read the problem end to end. In an existing codebase (see "Project" in `AGENTS.md`), map what already exists related to the problem: what works today, what is missing and what will have to change. Follow the real flow in the code, from the entry point (screen, endpoint or command) to the data.
3. Hunt for what was not said. Check at least:
   - who the actors are, and who can do what;
   - which platforms are expected: web, mobile, API only, or both a backend and a frontend;
   - mandatory vs. optional data, formats and validations;
   - invalid, missing, duplicated or late data;
   - empty, loading and error states, and the messages the user sees;
   - limits, units, currency, dates and time zones;
   - persistence: must the data survive a page reload or a restart? Is there a backend, or is it local only? Online or offline?
   - two actions on the same data at the same time;
   - keyboard use, focus and accessibility;
   - what is explicitly out of scope.
4. Separate what the problem states from what you infer. Never present an inference as a requirement.

## 2. Interview me
First round. Write in chat, concise:
- **Understanding**: a short summary in business language: the problem, the users and the expected outcome. In an existing codebase, add the current state: what exists, what is missing and what will change.
- **Proposed assumptions**: minor points where a reasonable default saves time, numbered `A-n`, each with the default and a one-line reason, so I can approve all of them at once or reject one by one. Nothing here may change scope or a business rule: those are questions.

Then ask the **questions** as described in "Escalate instead of guessing" in `AGENTS.md`: with your native question tool when you have one, otherwise in chat. Highest impact first, at most 5 per round. Only decisions that are mine and that change behavior or scope. Ask technical topics as behavior ("Must the data survive a page reload?"), never as technology ("localStorage or IndexedDB?"). With the native tool, add one last question to approve the proposed assumptions: "Approve all" or "Reject some" (I name them in the free-text answer).

Wait for my answers. After each answer:
- Record the decision and never ask again what was already answered.
- If an answer opens a new decision that changes behavior or scope, ask it in a new round, the same way.
- If I answer "you decide", take your recommended option and record it as a decision delegated to you.
- Stop asking when nothing material is open, or when I ask you to consolidate.

## 3. Write `docs/SPEC.md`
- **Overview**: 1 to 2 sentences.
- **Scope**: In / Out.
- **Actors**.
- **Business rules**: `BR-n`, each one traced to the problem statement or to a decision.
- **Acceptance criteria**: `AC-n` in Given / When / Then, each linked to its `BR-n`. Concrete and testable (values, messages, states). Cover the success paths, the failure paths and the edge cases that matter.
- **Non-functional requirements**: `NFR-n`: persistence, offline, performance, accessibility, platform, imposed stack.
- **Decisions log**: every question asked and its answer: `Q1 · <area> — <question> → Decision: <answer>`.
- **Approved assumptions**: `A-n`.
- **Open questions**: only points I explicitly said I do not know yet. Omit the section when it is empty.

Every rule and criterion comes from `docs/PROBLEM.md`, from a recorded decision or from an approved assumption. Nothing invented. No technology names unless the problem imposes them.

Reply with: the file path, how many `BR`, `AC` and `NFR` items it has, the decisions recorded and any open question left.
