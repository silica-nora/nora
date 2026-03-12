# Remote Handling (Platform-neutral)

1. Check remote:
   - `git remote -v`
2. If missing remote:
   - Ask user to provide remote URL (supports GitHub/GitLab/Gitee/self-hosted).
3. Only if user explicitly requests GitHub auto-create:
   - check `gh auth status`
   - create repo and set remote automatically

Receipt should include branch and push result.
If no remote provided, receipt should clearly state: "已本地提交，待远端地址".
