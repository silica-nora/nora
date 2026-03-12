---
name: archive-workspace
description: Archive and commit workspace changes with a consistent receipt. Use when user says "归档", "存档", "archive", asks for commit/push summary, or after meaningful file edits that should be tracked in git.
---

# Archive Workspace

Execute a consistent archive flow in `/home/nora/.openclaw/workspace`.

## Core Spec (must-follow)

- One-command archive: user says "归档", system should finish end-to-end automatically.
- Low interruption by default: do not ask user for intermediate confirmations.
- Ask user only at hard decision gates that cannot be auto-resolved.

## Flow

1. Run script dry-run first:
   - `python3 {baseDir}/scripts/archive_runner.py --mode dry-run --workdir /home/nora/.openclaw/workspace`
2. If script returns `no_change`, return no-op receipt and stop.
3. If script returns `needs_decision`/`blocked`, follow `next_action` and remediation.
4. If script returns ready/success in dry-run, run archive:
   - `python3 {baseDir}/scripts/archive_runner.py --mode run --workdir /home/nora/.openclaw/workspace --scope <scope> --summary <summary>`
5. (Optional) tune thresholds when needed:
   - `--max-file-mb 30`
   - `--sensitive-pattern "(TOKEN|API_KEY|PRIVATE KEY|...)"`
6. Render receipt from JSON result.

## Receipt (required)

```text
归档完成 ✅

本次改动：
- 新增：...
- 修改：...
- 删除：...

共 N 个文件变更
branch: <branch>
commit id: <short_sha>
push 状态: 成功/失败/待远端
failure_code: <code or 无>
```

No-change receipt:

```text
归档完成 ✅

本次改动：
- 新增：无
- 修改：无
- 删除：无

共 0 个文件变更
branch: <branch>
commit id: 无
push 状态: 无需推送（无变更）
failure_code: 无
```

## Rules

- Do not skip receipt.
- Never include secrets/tokens in commit message or receipt.
- Prefer one logical commit per archive request.
- If push fails, classify failure with `failure_code`.
- Dry-run is default and silent: report only actionable results, not verbose git internals.
- Treat low interruption as primary design constraint.
- Ask user only at hard decision gates:
  1) no remote URL and cannot infer safely
  2) credential/permission is required
  3) sensitive-content blocked and remediation choice is needed

## Self-heal (default)

Handle common failures automatically before asking user:

1. If git is missing: provide install hint and stop.
2. If not a git repo: run `git init`.
3. If user.name/user.email missing: set repo-local defaults.
4. If detached HEAD: create/switch to safe branch before commit.
5. If no remote (platform-neutral default): ask user for remote URL.
6. Validate provided remote URL format and connectivity before adding.
7. Run lightweight sensitive-content scan on staged diff; block commit if hit.
8. If blocked, return remediation guidance (not just error): where matched, why risky, and next actions.

Only ask user when a decision/permission is required (e.g., remote URL/credentials).

## Reference

- Receipt template: `references/receipt-template.md`
- Preflight checklist: `references/preflight-checklist.md`
- Failure codes: `references/failure-codes.md`
- Commit message convention: `references/commit-message.md`
- Remote handling: `references/self-heal-remote.md`
- Sensitive remediation: `references/sensitive-remediation.md`
- Dry-run policy: `references/dry-run-policy.md`
- v2 architecture: `references/architecture.md`
