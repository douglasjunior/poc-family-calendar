---
when-to-use: In the same session as 05, after choosing which findings to fix. Replace {{FINDINGS}} with their numbers (e.g. #1 and #3).
---

Always reply in English and write every file you create or change in English, even when I write to you in another language.

Now act as the Developer. Fix ONLY the findings {{FINDINGS}} from your review. Leave all the other findings untouched.

For each finding:
1. If it is a behavior bug, first write a test that reproduces it and confirm that it fails.
2. Apply the smallest fix that solves it, following `AGENTS.md`.
3. If the fix needs a decision that is not recorded (business rule or scope), stop and ask instead (format in `AGENTS.md`).

Then run all the checks listed in `AGENTS.md`. Do not commit.

Report, short: finding → fix → test → check results, and a suggested commit message, e.g. `fix(domain): reject duplicated e-mail (review #1)`.
