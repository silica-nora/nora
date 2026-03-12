# Failure Classification

- AUTH_FAILED: authentication/credential failure
- PERMISSION_DENIED: remote permission denied
- REMOTE_NOT_FOUND: repository or remote path not found
- NETWORK_ERROR: DNS/timeout/connection issues
- DETACHED_HEAD: attempted push from detached HEAD
- NO_REMOTE: no remote configured
- SENSITIVE_CONTENT_BLOCKED: sensitive pattern detected, commit blocked

Receipt should include: `failure_code` + concise reason.
