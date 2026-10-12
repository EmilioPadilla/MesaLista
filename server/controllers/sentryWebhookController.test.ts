import crypto from 'crypto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Sentry webhook → GitHub repository_dispatch bridge:
// (a) rejects deliveries without a valid HMAC signature,
// (b) dispatches new issues / fired alerts exactly once per issue,
// (c) ignores resources we don't act on (e.g. resolved issues).

const SECRET = 'test-client-secret';

process.env.SENTRY_CLIENT_SECRET = SECRET;
process.env.GITHUB_DISPATCH_TOKEN = 'ghp_test';
process.env.GITHUB_REPO = 'acme/repo';

const { default: controller, verifySentrySignature, extractIssue } = await import('./sentryWebhookController.js');

const sign = (body: Buffer) => crypto.createHmac('sha256', SECRET).update(body).digest('hex');

function makeReq(resource: string, payload: unknown, signature?: string) {
  const body = Buffer.from(JSON.stringify(payload));
  const headers: Record<string, string> = {
    'sentry-hook-resource': resource,
    'sentry-hook-signature': signature ?? sign(body),
  };
  return { body, header: (name: string) => headers[name.toLowerCase()] } as any;
}

function makeRes() {
  const res: any = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

const alertPayload = (issueId: string) => ({
  action: 'triggered',
  data: {
    event: { issue_id: issueId, title: 'TypeError: x is undefined', web_url: 'https://sentry.io/e/1', project: 42 },
    triggered_rule: 'New issue in production',
  },
});

describe('sentryWebhookController', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true, status: 204, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('verifies signatures in constant time and rejects mismatches', () => {
    const body = Buffer.from('{"a":1}');
    expect(verifySentrySignature(body, sign(body), SECRET)).toBe(true);
    expect(verifySentrySignature(body, 'deadbeef', SECRET)).toBe(false);
    expect(verifySentrySignature(body, undefined, SECRET)).toBe(false);
    expect(verifySentrySignature(body, sign(body), '')).toBe(false);
  });

  it('returns 401 and does not dispatch when the signature is invalid', async () => {
    const res = makeRes();
    await controller.handleSentryWebhook(makeReq('event_alert', alertPayload('1'), 'bad'), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('dispatches a fired alert to GitHub once per issue', async () => {
    const res = makeRes();
    await controller.handleSentryWebhook(makeReq('event_alert', alertPayload('100')), res);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/acme/repo/dispatches');
    const sent = JSON.parse(init.body);
    expect(sent.event_type).toBe('sentry-issue');
    expect(sent.client_payload).toMatchObject({ issueId: '100', source: 'alert:New issue in production' });

    const again = makeRes();
    await controller.handleSentryWebhook(makeReq('event_alert', alertPayload('100')), again);
    expect(again.status).toHaveBeenCalledWith(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a later delivery when the GitHub dispatch fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'boom' });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await controller.handleSentryWebhook(makeReq('event_alert', alertPayload('200')), makeRes());
    await controller.handleSentryWebhook(makeReq('event_alert', alertPayload('200')), makeRes());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    errorSpy.mockRestore();
  });

  it('extracts new issues and ignores other issue actions', () => {
    const created = {
      action: 'created',
      data: { issue: { id: '7', shortId: 'MESALISTA-SERVER-1', title: 'Boom', web_url: 'u', project: { slug: 'mesalista-server' } } },
    };
    expect(extractIssue('issue', created)).toMatchObject({ issueId: '7', shortId: 'MESALISTA-SERVER-1', project: 'mesalista-server' });
    expect(extractIssue('issue', { ...created, action: 'resolved' })).toBeNull();
    expect(extractIssue('installation', created)).toBeNull();
  });
});
