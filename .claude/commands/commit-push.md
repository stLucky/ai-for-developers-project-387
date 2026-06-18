---
description: Generate a conventional commit message, commit, and push to the current branch
argument-hint: "[JIRA key or short description hint (optional)]"
allowed-tools: Bash(git status*), Bash(git diff*), Bash(git add*), Bash(git rev-parse*), Bash(git commit*), Bash(git push*), Bash(git branch*)
---

Follow these steps exactly:

## 1. Commit message format (source of truth)

- Format: `type(scope): description`
- Use the **imperative mood** in the description (e.g. "add", not "added").
- Allowed types: `feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`
- Breaking change: append `!` after type/scope (`feat!:` or `feat(scope)!:`) and/or add a `BREAKING CHANGE:` footer.
- Optional body between the subject line and footer for extra context.

Examples:
- `feat(SCOR-1014): add view switcher to documents header`
- `fix(ui): correct button alignment`
- `docs: update README with usage instructions`
- `refactor: improve performance of data processing`
- `chore: update dependencies`
- `feat!: send email on registration` (with `BREAKING CHANGE: email service required` in the footer)

## 2. Inspect changes

Run in parallel:
- `git status --porcelain`
- `git diff --cached` (staged changes)
- `git diff` (unstaged changes)

## 3. Determine what to stage

- If there are staged changes (`git diff --cached --quiet` returns a **non-zero** exit code) → commit **only the staged changes**, do NOT run `git add`.
- Otherwise → run `git add -A` to stage everything.

## 4. Determine scope

Priority (highest first):
1. If `$ARGUMENTS` contains a JIRA key matching `[A-Z]+-[0-9]+` → use it as scope.
2. Otherwise, run `git rev-parse --abbrev-ref HEAD` and extract a JIRA key from the branch name with the same pattern → use it as scope.
3. Otherwise → use the affected component/area derived from changed file paths (e.g. `ui`, `auth`, `map`). Omit scope if the area is not obvious.

Use `$ARGUMENTS` as additional context/hint when forming the description.

## 5. Commit

Construct the message and commit using a heredoc to preserve formatting:

```bash
git commit -m "$(cat <<'EOF'
type(scope): description
EOF
)"
```

Replace `type(scope): description` with the actual message. Add an optional body between the subject line and the closing `EOF` if extra context is needed.

## 6. Push

Run `git push`. If it fails with "no upstream branch" or "has no upstream", run:
```bash
git push -u origin $(git rev-parse --abbrev-ref HEAD)
```

## 7. Report

Print the final commit message and the push result (branch name + remote).