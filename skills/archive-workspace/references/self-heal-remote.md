# Remote Handling (Platform-neutral)

1. Check remote:
   - `git remote -v`
2. If missing remote:
   - Ask user to provide remote URL (supports GitHub/GitLab/Gitee/self-hosted).
3. Validate remote URL before adding:
   - format: starts with `https://` or `git@`
   - connectivity: `git ls-remote <url>`
4. Add and push:
   - `git remote add origin <url>` (or update existing)
   - `git push -u origin <branch>`
5. Only if user explicitly requests GitHub auto-create:
   - check `gh auth status`
   - create repo and set remote automatically

If no remote provided, receipt should state: "已本地提交，待远端地址".
