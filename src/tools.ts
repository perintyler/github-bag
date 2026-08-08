import { defineTool } from "@barry/tools";
import { z } from "zod";

export const prReview = defineTool({
  namespace: "github",
  access: "write",
  name: "pr_review",
  description: "Review a pull request with Claude-powered code analysis. Posts inline comments and a verdict summary.",
  secrets: ["BARRY_GITHUB_PAT"],
  schema: {
    pr: z.string().describe("PR reference — URL (github.com/owner/repo/pull/N), owner/repo#N, or number for the current repo"),
  },
  handler: async ({ pr }, context) => {
    const { reviewPullRequest, parsePullRequestReference } = await import("@barry/github");
    const token = context?.secrets?.BARRY_GITHUB_PAT;
    if (!token) throw new Error("BARRY_GITHUB_PAT not configured. Add it to your vault or profile env.");

    const _parsed = parsePullRequestReference(pr);
    const result = await reviewPullRequest({ token, pr, cwd: process.cwd() });

    return {
      pr: `${result.pr.owner}/${result.pr.repo}#${result.pr.number}`,
      title: result.pr.title,
      inlineComments: result.inlineComments.length,
      posted: result.posted,
    };
  },
  cliFormat: (result) => {
    const r = result as { pr: string; title: string; inlineComments: number; posted: boolean };
    const lines = [`Review posted on ${r.pr}`, `  ${r.inlineComments} inline comment(s)`];
    if (!r.posted) lines.push("  (not posted — dry run or error)");
    return lines.join("\n");
  },
});

export const prComment = defineTool({
  namespace: "github",
  access: "write",
  name: "pr_comment",
  description: "Post a comment on a pull request with Barry sign-off. Deduplicates — skips if an identical comment already exists.",
  secrets: ["BARRY_GITHUB_PAT"],
  schema: {
    pr: z.string().describe("PR reference — URL, owner/repo#N, or number"),
    message: z.string().describe("Comment message body"),
  },
  handler: async ({ pr, message }, context) => {
    const { parsePullRequestReference, GitHubClient, formatReviewBody } = await import("@barry/github");
    const token = context?.secrets?.BARRY_GITHUB_PAT;
    if (!token) throw new Error("BARRY_GITHUB_PAT not configured.");

    const { owner, repo, prNumber } = parsePullRequestReference(pr);
    const client = new GitHubClient(token);
    const body = formatReviewBody(message);

    const existing = await client.listComments(owner, repo, prNumber);
    const duplicate = existing.find((c) => c.body === body);
    if (duplicate) {
      return { status: "duplicate", pr: `${owner}/${repo}#${prNumber}`, url: duplicate.html_url };
    }

    const comment = await client.postComment(owner, repo, prNumber, body);
    return { status: "posted", pr: `${owner}/${repo}#${prNumber}`, url: comment.html_url };
  },
  cliFormat: (result) => {
    const r = result as { status: string; pr: string; url: string };
    if (r.status === "duplicate") return `Duplicate comment already exists on ${r.pr}\n${r.url}`;
    return `Comment posted on ${r.pr}\n${r.url}`;
  },
});

export const prClean = defineTool({
  namespace: "github",
  access: "write",
  name: "pr_clean",
  description: "Rewrite branch commits into a clean, logical commit history using an agent. Creates a backup branch first.",
  schema: {
    push: z.boolean().optional().describe("Force push after cleaning (default: false)"),
  },
  handler: async ({ push }) => {
    const { cleanCommits } = await import("@barry/github");
    await cleanCommits({ cwd: process.cwd(), push });
    return { status: "done", pushed: !!push };
  },
  cliFormat: (result) => {
    const r = result as { status: string; pushed: boolean };
    return r.pushed ? "Commits cleaned and force-pushed." : "Commits cleaned. Use --push to force-push.";
  },
});

export const prFindpath = defineTool({
  namespace: "github",
  access: "read",
  name: "pr_findpath",
  description: "Find the local filesystem path for a GitHub repository clone.",
  schema: {
    repo: z.string().describe("GitHub repo reference — owner/repo or a GitHub URL"),
  },
  handler: async ({ repo }) => {
    const { findRepoPath } = await import("@barry/github");

    const urlMatch = repo.match(/github\.com\/([^/]+)\/([^/]+)/);
    let owner: string;
    let repoName: string;

    if (urlMatch) {
      owner = urlMatch[1];
      repoName = urlMatch[2].replace(/\.git$/, "");
    } else {
      const parts = repo.split("/");
      if (parts.length !== 2) throw new Error("Expected owner/repo or a GitHub URL.");
      [owner, repoName] = parts;
    }

    const repoPath = findRepoPath(owner, repoName);
    if (!repoPath) throw new Error(`No local clone found for ${owner}/${repoName}`);
    return { path: repoPath };
  },
  cliFormat: (result) => (result as { path: string }).path,
});
