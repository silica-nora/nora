# Preflight Checklist (must run before archive)

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

7. Sensitive scan (light)
- Scan staged content before commit:
  - `git diff --cached | grep -E "(API[_-]?KEY|TOKEN|SECRET|PASSWORD|PRIVATE KEY|BEGIN RSA|BEGIN OPENSSH)"`
- if matched: stop and report risk
