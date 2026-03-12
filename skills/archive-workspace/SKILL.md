---
name: archive-workspace
description: Archive and commit workspace changes with a consistent receipt. Use when user says "归档", "存档", "archive", asks for commit/push summary, or after meaningful file edits that should be tracked in git.
---

# Archive Workspace

Execute a consistent archive flow in `/home/nora/.openclaw/workspace`.

## Flow

1. Run preflight checks (see reference).
2. If no changes, return no-op receipt and stop.
3. Summarize changes by category: 新增 / 修改 / 删除.
4. If memory or policy changed, update `memory/YYYY-MM-DD.md` (and ontology when relevant).
5. Commit with convention: `archive: <scope> <summary>`.
6. Push to remote (if configured).
7. Return receipt.

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

## Self-heal (default)

Handle common failures automatically before asking user:

1. If git is missing: provide install hint and stop.
2. If not a git repo: run `git init`.
3. If user.name/user.email missing: set repo-local defaults.
4. If detached HEAD: create/switch to safe branch before commit.
5. If no remote (platform-neutral default): ask user for remote URL.
6. Validate provided remote URL format and connectivity before adding.
7. Run lightweight sensitive-content scan on staged diff; block commit if hit.

Only ask user when a decision/permission is required (e.g., remote URL/credentials).

## Reference

- Receipt template: `references/receipt-template.md`
- Preflight checklist: `references/preflight-checklist.md`
- Failure codes: `references/failure-codes.md`
- Commit message convention: `references/commit-message.md`
- Remote handling: `references/self-heal-remote.md`
