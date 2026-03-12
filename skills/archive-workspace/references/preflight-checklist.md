# Preflight Checklist (must run before archive)

> Execute as silent dry-run. Only surface actionable blockers to user.

1. Ensure git exists
- `command -v git`

2. Ensure repo initialized
- `git rev-parse --is-inside-work-tree`
- if fail: `git init`

3. Ensure identity set (repo-local)
- `git config user.name || git config user.name "nora"`
- `git config user.email || git config user.email "nora@local"`

4. Detect no-change fast path
- `git diff --quiet && git diff --cached --quiet`
- if true: return receipt with "无变更，无需归档"

5. Determine branch / detached head
- `git symbolic-ref --short -q HEAD || echo DETACHED`
- if DETACHED: create/switch to safe branch, e.g. `git switch -c archive-$(date +%Y%m%d-%H%M%S)`

6. Remote checks
- `git remote -v`
- if missing: ask user for remote URL (platform-neutral)
- if URL provided, validate format and connectivity:
  - format: starts with `https://` or `git@`
  - connectivity: `git ls-remote <url>`

7. Conflict pre-check (when upstream exists)
- `git fetch --quiet origin`
- `git rev-list --left-right --count HEAD...@{u}`
- if behind>0: return `NON_FAST_FORWARD_RISK`

8. Large file warning
- warn when changed file > max-file-mb (default 20MB, configurable)
- add note: consider Git LFS

9. Sensitive scan (light)
- Scan staged content before commit:
  - `git diff --cached | grep -E "(API[_-]?KEY|TOKEN|SECRET|PASSWORD|PRIVATE KEY|BEGIN RSA|BEGIN OPENSSH)"`
- if matched: stop and report risk
