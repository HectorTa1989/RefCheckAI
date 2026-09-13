---
description: Auto-stage, commit, and push changes with AI-generated conventional commit messages
---

# Auto Commit & Push

Automatically stages, commits, and pushes each modified file individually with a tailored Conventional Commit message.

## Steps

1. Run `git status` to see which files are modified.
2. For each modified file (or logical group of related files), analyze its diff to understand what changed.
3. Generate a commit message following **Conventional Commits** format:
   - `type(scope): description`
   - Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `ci`, `test`, `perf`
   - Keep description under 50 characters, use imperative mood
   - Add a blank line + body bullet list if the change is complex
4. Stage the specific file(s) with `git add <file>`.
5. Commit with the generated message for that file/group.
6. Repeat steps 2-5 for every modified file or logical group.
7. Push all commits to the current upstream branch using `git push origin $(git branch --show-current)`.

## Examples

- Single fix: `fix(backend): resolve CORS origin mismatch for advisor batch`
- Feature: `feat(frontend): add trade advisor batch recommendations panel`
- Refactor: `refactor(data-fetcher): replace yfinance with direct Yahoo Finance API`
- Config: `chore(docker): remap postgres and redis ports to avoid host conflicts`

## Rules

- Do NOT stage all files at once with `git add -A`.
- Commit each file (or tightly-coupled group) separately.
- Tailor the commit message to the exact change in that file.

// turbo
8. Execute the commits and push commands.
