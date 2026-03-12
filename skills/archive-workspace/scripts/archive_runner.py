#!/usr/bin/env python3
import argparse
import json
import os
import re
import shutil
import subprocess
from datetime import datetime

SENSITIVE_RE = re.compile(r"(API[_-]?KEY|TOKEN|SECRET|PASSWORD|PRIVATE KEY|BEGIN RSA|BEGIN OPENSSH)", re.I)


def run(cmd, cwd, check=False):
    p = subprocess.run(cmd, cwd=cwd, text=True, capture_output=True)
    if check and p.returncode != 0:
        raise RuntimeError(p.stderr.strip() or p.stdout.strip())
    return p


def git_exists():
    return shutil.which("git") is not None


def parse_status_lines(lines):
    added, modified, deleted = [], [], []
    for ln in lines:
        if not ln.strip():
            continue
        code = ln[:2]
        path = ln[3:]
        if "->" in path:
            path = path.split("->", 1)[1].strip()
        if "A" in code:
            added.append(path)
        elif "D" in code:
            deleted.append(path)
        else:
            modified.append(path)
    return added, modified, deleted


def branch_name(cwd):
    p = run(["git", "symbolic-ref", "--short", "-q", "HEAD"], cwd)
    return (p.stdout or "").strip() or "DETACHED"


def ensure_repo(cwd):
    p = run(["git", "rev-parse", "--is-inside-work-tree"], cwd)
    if p.returncode != 0:
        run(["git", "init"], cwd, check=True)


def ensure_identity(cwd):
    if run(["git", "config", "user.name"], cwd).returncode != 0:
        run(["git", "config", "user.name", "nora"], cwd, check=True)
    if run(["git", "config", "user.email"], cwd).returncode != 0:
        run(["git", "config", "user.email", "nora@local"], cwd, check=True)


def ensure_not_detached(cwd):
    br = branch_name(cwd)
    if br == "DETACHED":
        ts = datetime.now().strftime("%Y%m%d-%H%M%S")
        new_br = f"archive-{ts}"
        run(["git", "switch", "-c", new_br], cwd, check=True)
        return new_br
    return br


def current_changes(cwd):
    p = run(["git", "status", "--short"], cwd, check=True)
    lines = [x for x in p.stdout.splitlines() if x.strip()]
    a, m, d = parse_status_lines(lines)
    return lines, a, m, d


def remote_exists(cwd):
    p = run(["git", "remote", "-v"], cwd)
    return bool((p.stdout or "").strip())


def validate_remote_url(url):
    return url.startswith("https://") or url.startswith("git@")


def validate_remote_connectivity(cwd, url):
    p = run(["git", "ls-remote", url], cwd)
    return p.returncode == 0


def sensitive_scan(cwd):
    p = run(["git", "diff", "--cached"], cwd)
    txt = (p.stdout or "") + "\n" + (p.stderr or "")
    return bool(SENSITIVE_RE.search(txt))


def first_push(cwd, branch):
    p = run(["git", "push", "-u", "origin", branch], cwd)
    return p


def normal_push(cwd):
    return run(["git", "push"], cwd)


def upstream_exists(cwd):
    p = run(["git", "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], cwd)
    return p.returncode == 0


def non_fast_forward_risk(cwd):
    """Return True if local branch is behind upstream after fetch."""
    run(["git", "fetch", "--quiet", "origin"], cwd)
    p = run(["git", "rev-list", "--left-right", "--count", "HEAD...@{u}"], cwd)
    if p.returncode != 0:
        return False
    txt = (p.stdout or "").strip()
    if not txt:
        return False
    try:
        ahead, behind = [int(x) for x in txt.split()[:2]]
    except Exception:
        return False
    return behind > 0


def large_files(cwd, threshold_mb=20):
    threshold = threshold_mb * 1024 * 1024
    p = run(["git", "status", "--porcelain"], cwd)
    files = []
    for ln in (p.stdout or "").splitlines():
        if not ln.strip():
            continue
        path = ln[3:]
        if "->" in path:
            path = path.split("->", 1)[1].strip()
        full = os.path.join(cwd, path)
        if os.path.isfile(full):
            try:
                if os.path.getsize(full) > threshold:
                    files.append(path)
            except OSError:
                pass
    return files


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["dry-run", "run"], default="dry-run")
    ap.add_argument("--workdir", default="/home/nora/.openclaw/workspace")
    ap.add_argument("--scope", default="workspace")
    ap.add_argument("--summary", default="archive updates")
    ap.add_argument("--remote-url", default="")
    args = ap.parse_args()

    out = {
        "status": "failed",
        "branch": "",
        "changes": {"added": [], "modified": [], "deleted": []},
        "commit_id": "",
        "push_status": "",
        "failure_code": "",
        "next_action": "",
        "notes": [],
    }

    cwd = args.workdir

    try:
        if not git_exists():
            out.update(status="failed", failure_code="GIT_MISSING", next_action="install git")
            print(json.dumps(out, ensure_ascii=False))
            return

        ensure_repo(cwd)
        ensure_identity(cwd)
        br = ensure_not_detached(cwd)
        out["branch"] = br

        lines, a, m, d = current_changes(cwd)
        out["changes"] = {"added": a, "modified": m, "deleted": d}

        if not lines:
            out.update(status="no_change", push_status="not_needed", failure_code="")
            print(json.dumps(out, ensure_ascii=False))
            return

        has_remote = remote_exists(cwd)
        if not has_remote:
            if args.remote_url:
                if not validate_remote_url(args.remote_url):
                    out.update(status="needs_decision", failure_code="INVALID_REMOTE_URL", next_action="provide valid remote URL")
                    print(json.dumps(out, ensure_ascii=False))
                    return
                if not validate_remote_connectivity(cwd, args.remote_url):
                    out.update(status="needs_decision", failure_code="REMOTE_UNREACHABLE", next_action="provide reachable remote URL")
                    print(json.dumps(out, ensure_ascii=False))
                    return
                run(["git", "remote", "add", "origin", args.remote_url], cwd, check=True)
                has_remote = True
            else:
                out.update(status="needs_decision", push_status="pending_remote", failure_code="NO_REMOTE", next_action="provide remote URL")
                print(json.dumps(out, ensure_ascii=False))
                return

        large = large_files(cwd, threshold_mb=20)
        if large:
            out["notes"].append({"type": "LARGE_FILE_WARNING", "files": large, "hint": "consider git-lfs"})

        if args.mode == "dry-run":
            # pre-check non-fast-forward risk when upstream exists
            if has_remote and upstream_exists(cwd) and non_fast_forward_risk(cwd):
                out.update(status="needs_decision", push_status="failed", failure_code="NON_FAST_FORWARD_RISK", next_action="pull/rebase before push")
                print(json.dumps(out, ensure_ascii=False))
                return
            out.update(status="success", push_status="pending", failure_code="")
            print(json.dumps(out, ensure_ascii=False))
            return

        # run mode
        run(["git", "add", "-A"], cwd, check=True)

        if sensitive_scan(cwd):
            out.update(status="blocked", push_status="failed", failure_code="SENSITIVE_CONTENT_BLOCKED", next_action="remove or unstage secrets")
            print(json.dumps(out, ensure_ascii=False))
            return

        msg = f"archive: {args.scope} {args.summary}".strip()
        run(["git", "commit", "-m", msg], cwd, check=True)
        cid = run(["git", "rev-parse", "--short", "HEAD"], cwd, check=True).stdout.strip()
        out["commit_id"] = cid

        # push (set upstream if needed)
        has_upstream = upstream_exists(cwd)
        if has_upstream and non_fast_forward_risk(cwd):
            out.update(status="needs_decision", push_status="failed", failure_code="NON_FAST_FORWARD_RISK", next_action="pull/rebase before push")
            print(json.dumps(out, ensure_ascii=False))
            return

        p = first_push(cwd, br) if not has_upstream else normal_push(cwd)

        if p.returncode == 0:
            out.update(status="success", push_status="success", failure_code="")
        else:
            err = (p.stderr or p.stdout or "").lower()
            code = "NETWORK_ERROR"
            if "auth" in err or "denied" in err:
                code = "AUTH_FAILED"
            elif "not found" in err:
                code = "REMOTE_NOT_FOUND"
            elif "non-fast-forward" in err or "fetch first" in err or "rejected" in err:
                code = "NON_FAST_FORWARD_RISK"
            out.update(status="failed", push_status="failed", failure_code=code, next_action="check credentials/remote")

        print(json.dumps(out, ensure_ascii=False))

    except Exception as e:
        out.update(status="failed", failure_code="UNHANDLED_EXCEPTION", next_action=str(e))
        print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
