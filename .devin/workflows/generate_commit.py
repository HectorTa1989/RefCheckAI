"""
Generate a Conventional Commit message from staged/unstaged changes.
Usage: python .devin/workflows/generate_commit.py
"""
import subprocess
import sys
from pathlib import Path

TYPE_MAP = {
    "fix": ["fix", "bug", "correct", "repair", "resolve"],
    "feat": ["add", "new", "introduce", "implement", "create"],
    "refactor": ["refactor", "restructure", "reorganize", "simplify", "clean"],
    "perf": ["speed", "fast", "optimize", "cache", "efficient"],
    "docs": ["doc", "readme", "comment", "guide", "manual"],
    "test": ["test", "spec", "coverage", "assert"],
    "chore": ["config", "env", "docker", "compose", "deps", "update", "bump", "upgrade"],
    "ci": ["workflow", "action", "pipeline", "deploy"],
}

SCOPE_MAP = {
    "backend": ["backend", "api", "routes", "engine", "execution", "broker", "ml"],
    "frontend": ["frontend", "ui", "page", "component", "app", "client"],
    "data-fetcher": ["data_fetcher", "fetcher", "yahoo", "yfinance", "cboe"],
    "trade-advisor": ["trade_advisor", "advisor", "recommendation"],
    "portfolio": ["portfolio", "monitor", "margin", "pnl", "greeks"],
    "docker": ["docker", "compose", "container"],
    "config": ["config", "settings", "env", "cors"],
    "docs": ["readme", "docs", "md"],
}


def git_status():
    result = subprocess.run(
        ["git", "status", "--short"],
        capture_output=True, text=True, check=True
    )
    return result.stdout.strip()


def git_diff_summary():
    result = subprocess.run(
        ["git", "diff", "--stat"],
        capture_output=True, text=True, check=True
    )
    return result.stdout.strip()


def detect_type(summary: str) -> str:
    text = summary.lower()
    scores = {t: 0 for t in TYPE_MAP}
    for commit_type, keywords in TYPE_MAP.items():
        for kw in keywords:
            scores[commit_type] += text.count(kw)
    return max(scores, key=scores.get) if max(scores.values()) > 0 else "chore"


def detect_scope(files: str) -> str:
    text = files.lower()
    scores = {s: 0 for s in SCOPE_MAP}
    for scope, keywords in SCOPE_MAP.items():
        for kw in keywords:
            scores[scope] += text.count(kw)
    return max(scores, key=scores.get) if max(scores.values()) > 0 else ""


def main():
    status = git_status()
    if not status:
        print("No changes to commit.", file=sys.stderr)
        sys.exit(1)

    diff = git_diff_summary()
    files = "\n".join(line.strip() for line in status.splitlines())
    commit_type = detect_type(diff + " " + files)
    scope = detect_scope(files)

    # Build a short summary from the most common file change pattern
    changed = [line.split()[-1] for line in status.splitlines()]
    if len(changed) == 1:
        summary = Path(changed[0]).name.replace("_", " ")
    else:
        dirs = {Path(f).parts[0] for f in changed}
        if len(dirs) == 1:
            summary = f"update {dirs.pop()}"
        else:
            summary = f"update {len(changed)} files"

    scope_part = f"({scope})" if scope else ""
    print(f"{commit_type}{scope_part}: {summary}")


if __name__ == "__main__":
    main()
