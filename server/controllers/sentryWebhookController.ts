import crypto from 'crypto';
import { Request, Response } from 'express';

/**
 * Sentry → GitHub bridge for automated bug-fix PRs.
 *
 * Sentry (via an Internal Integration) posts here when an alert rule fires or
 * an issue is created. We verify the signature, then fire a `repository_dispatch`
 * at GitHub; `.github/workflows/sentry-autofix.yml` picks it up and runs Claude
 * Code to open a fix PR for review.
 *
 * Mounted with a raw body parser (see server/index.ts) because the signature is
 * an HMAC over the exact bytes Sentry sent.
 */

const SENTRY_CLIENT_SECRET = process.env.SENTRY_CLIENT_SECRET || '';
const GITHUB_DISPATCH_TOKEN = process.env.GITHUB_DISPATCH_TOKEN || '';
const GITHUB_REPO = process.env.GITHUB_REPO || 'EmilioPadilla/MesaLista';

// Event alerts fire on every matching event, so the same issue can arrive many
// times in a burst. Only dispatch each issue once per window; the workflow also
// dedupes against existing PRs, this just keeps us from spamming GitHub.
const DEDUPE_WINDOW_MS = 6 * 60 * 60 * 1000;
const recentlyDispatched = new Map<string, number>();

export interface SentryIssueRef {
  issueId: string;
  shortId: string;
  title: string;
  url: string;
  project: string;
  source: string;
}

export function verifySentrySignature(rawBody: Buffer, signature: string | undefined, secret: string): boolean {
  if (!secret || !signature) return false;
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const expected = Buffer.from(digest, 'utf8');
  const received = Buffer.from(signature, 'utf8');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

/**
 * Pull the issue we should fix out of a webhook payload, or null if this
 * delivery isn't one we act on.
 */
export function extractIssue(resource: string | undefined, payload: any): SentryIssueRef | null {
  const data = payload?.data;

  // Issue Alert rule fired ("Send a notification via <integration>").
  if (resource === 'event_alert' && payload?.action === 'triggered' && data?.event) {
    const event = data.event;
    if (!event.issue_id) return null;
    return {
      issueId: String(event.issue_id),
      shortId: String(event.issue_id),
      title: String(event.title || ''),
      url: String(event.web_url || event.issue_url || ''),
      project: String(event.project ?? ''),
      source: `alert:${data.triggered_rule || 'unknown'}`,
    };
  }

  // Issue webhook subscription — only brand-new issues.
  if (resource === 'issue' && payload?.action === 'created' && data?.issue) {
    const issue = data.issue;
    if (!issue.id) return null;
    return {
      issueId: String(issue.id),
      shortId: String(issue.shortId || issue.id),
      title: String(issue.title || ''),
      url: String(issue.web_url || issue.permalink || ''),
      project: String(issue.project?.slug || ''),
      source: 'issue:created',
    };
  }

  return null;
}

async function dispatchToGitHub(issue: SentryIssueRef): Promise<void> {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_DISPATCH_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_type: 'sentry-issue',
      // GitHub caps client_payload values; keep the title short.
      client_payload: { ...issue, title: issue.title.slice(0, 200) },
    }),
  });
  if (!response.ok) {
    throw new Error(`GitHub dispatch failed: ${response.status} ${await response.text()}`);
  }
}

export default {
  handleSentryWebhook: async (req: Request, res: Response) => {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
    const signature = req.header('sentry-hook-signature');

    if (!verifySentrySignature(rawBody, signature, SENTRY_CLIENT_SECRET)) {
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid JSON' });
    }

    const issue = extractIssue(req.header('sentry-hook-resource'), payload);
    if (!issue) {
      return res.status(200).json({ success: true, dispatched: false });
    }

    const now = Date.now();
    const last = recentlyDispatched.get(issue.issueId);
    if (last && now - last < DEDUPE_WINDOW_MS) {
      return res.status(200).json({ success: true, dispatched: false, reason: 'duplicate' });
    }
    recentlyDispatched.set(issue.issueId, now);
    for (const [id, at] of recentlyDispatched) {
      if (now - at >= DEDUPE_WINDOW_MS) recentlyDispatched.delete(id);
    }

    // Sentry times out after 1s, so acknowledge first and dispatch after.
    res.status(202).json({ success: true, dispatched: true });

    if (!GITHUB_DISPATCH_TOKEN) {
      console.error('[Sentry webhook] GITHUB_DISPATCH_TOKEN is not set; skipping dispatch for', issue.issueId);
      return;
    }
    try {
      await dispatchToGitHub(issue);
      console.log(`[Sentry webhook] Dispatched autofix for issue ${issue.issueId} (${issue.source})`);
    } catch (error) {
      // Let a later delivery retry this issue.
      recentlyDispatched.delete(issue.issueId);
      console.error('[Sentry webhook] Failed to dispatch autofix:', error);
    }
  },
};
