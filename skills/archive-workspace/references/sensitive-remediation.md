# Sensitive Content Remediation (when commit is blocked)

When sensitive patterns are detected, stop commit and return:

1) Match summary
- file path(s)
- approximate line range(s)
- matched pattern type (TOKEN/API_KEY/PASSWORD/PRIVATE KEY)

2) Why blocked
- explain that committing secrets risks permanent leak and credential abuse.

3) Actionable fix options
- Move secret to env/config (e.g. `.env`, secret manager), reference by variable.
- Add ignored files to `.gitignore` (e.g. `.env`, `secrets/*.json`).
- Unstage sensitive file: `git restore --staged <file>`.
- Remove secret from file, then re-stage.

4) If already committed previously
- rotate/revoke secret immediately.
- rewrite history if needed (`git filter-repo` / BFG) and force-push with caution.

5) Resume command
- after fix: `git add ... && git commit ...`

Receipt status suggestion:
- push 状态: 失败（已拦截）
- failure_code: SENSITIVE_CONTENT_BLOCKED
