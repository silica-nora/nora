# Dry-run Policy (Silent by default)

Purpose: run safety checks before archive without disturbing non-git users.

## Behavior

- Always run preflight checks as internal dry-run.
- Do not send preflight details unless an action is required.
- Continue automatically when issues are auto-fixable.

## When to surface to user

Only surface when hard decision/permission is required:
1. Missing remote URL (platform-neutral)
2. Credential/auth failure
3. Sensitive content blocked and needs remediation choice

Everything else should stay silent and auto-resolve.

## User-facing style

- Use plain language, not raw git output.
- Include only: what happened, what is needed, and exact next step.
