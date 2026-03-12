---
name: archive-workspace
description: Archive and commit workspace changes with a consistent receipt. Use when user says "归档", "存档", "archive", asks for commit/push summary, or after meaningful file edits that should be tracked in git.
---

# Archive Workspace

Execute a consistent archive flow in `/home/nora/.openclaw/workspace`.

## Flow

1. Check changed files with `git status --short`.
2. Summarize changes by category: 新增 / 修改 / 删除.
3. If memory or policy changed, update `memory/YYYY-MM-DD.md` (and ontology when relevant).
4. Commit with a clear message.
5. Push to remote.
6. Return a receipt in this format:

```text
归档完成 ✅

本次改动：
- 新增：...
- 修改：...
- 删除：...

共 N 个文件变更
commit id: <short_sha>
push 状态: 成功/失败
```

## Rules

- Do not skip receipt.
- If push fails, report failure reason and keep commit id.
- Never include secrets/tokens in commit message or receipt.
- Prefer one logical commit per archive request.

## Self-heal (default)

Handle common failures automatically before asking user:

1. If git is missing: report actionable install hint and stop.
2. If not a git repo: run `git init` in workspace.
3. If user.name/user.email missing: set repo-local defaults.
4. If no remote (platform-neutral default):
   - Ask user to provide remote URL (GitHub/GitLab/Gitee/self-hosted all supported).
   - Do not auto-create a GitHub repo unless user explicitly asks for GitHub auto-create.

Only ask user when a decision/permission is required.

## Reference

- Receipt template details: `references/receipt-template.md`
- Remote self-heal details: `references/self-heal-remote.md`
