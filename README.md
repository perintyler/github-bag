# github

GitHub PR operations: review, comment, clean commits, find repos.

## What it is

Four PR tools plus a child bag, `github-app`, which is the Express server that
receives GitHub webhooks and handles OAuth callbacks. The tools are the
day-to-day surface; the app is the standing infrastructure behind it.

Start with `pr_review` — it runs a code analysis over a pull request and posts
inline comments plus a verdict. `pr_clean` is the one to be careful with: it
rewrites a branch's commit history with an agent, and it creates a backup branch
before it does.

## Before you change anything here

**Two different GitHub credentials are in play, and they fail differently.**
The tools authenticate with `BARRY_GITHUB_PAT` from the vault and throw a named
error when it is missing. The skills shell out to `gh`, which uses the CLI's own
auth. One can work while the other does not, so "GitHub is broken" is worth
narrowing before chasing.

`pr_comment` deduplicates: an identical comment already on the PR is skipped
rather than posted twice. That makes it safe to re-run, and it also means a
no-op looks identical to a success.

## Layout

| path | what |
|---|---|
| `bag.yaml` | manifest, tool metadata, and the `gh` dependency |
| `src/tools.ts` | the four PR tools |
| `github-app/` | the webhook and OAuth server, its own bag |
