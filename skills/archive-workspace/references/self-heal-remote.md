# Remote Self-heal Decision Tree

1. Check remote:
   - `git remote -v`
2. If missing remote, check GitHub auth:
   - `gh auth status`
3. If auth OK:
   - create repo (prefer private default): `gh repo create <name> --private --source . --remote origin --push`
   - if already created locally, set remote and push: `git remote add origin <url> && git push -u origin <branch>`
4. If auth not OK:
   - ask user to either (a) login gh, or (b) create repo and give remote URL.

Receipt should include which branch was pushed and whether remote was auto-created.
