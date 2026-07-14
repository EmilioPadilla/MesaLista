---
name: commit-message
description: Generate a concise, well-structured git commit message from the currently staged changes and create the commit. Use when the user asks to commit staged changes or write a commit message.
---

# Commit Message

Generate a commit message for the currently staged changes and create the commit.

## Steps

1. Inspect the staged changes:
   - Run `git diff --cached --stat` to see which files changed.
   - Run `git diff --cached` to read the actual changes.
   - If nothing is staged, tell the user there are no staged changes and stop (do NOT stage files yourself unless the user asks).

2. Write the commit message:
   - Use Conventional Commits style for the subject: `type(scope): summary` (e.g. `feat(mobile): ...`, `fix(server): ...`, `chore: ...`). Match the style of recent commits in this repo (`git log --oneline -10`).
   - Keep the subject line **concise** — imperative mood, ~50 chars, no trailing period.
   - Add a body **only when it adds value**: explain all the important changes, the "what" and "why", using short bullet points. Skip the body for trivial one-line changes.
   - Be concise but complete: every meaningful change should be reflected, without padding or restating the diff line-by-line.

## Rules

- **Never** add yourself as a co-author. Do NOT include any `Co-Authored-By:` trailer, "Generated with Claude Code" line, or similar attribution.
- Only commit what is already staged. Do not run `git add` unless the user explicitly asks.
- Show the final commit message to the user after committing.
