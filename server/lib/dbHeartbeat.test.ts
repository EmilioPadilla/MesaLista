import { describe, it, expect, vi, afterEach } from 'vitest';
import { runDbHeartbeat } from './dbHeartbeat.js';

// MESALISTA-SERVER-2: the heartbeat runs from setInterval, so a failed ping
// (database briefly unreachable) used to surface as an unhandled rejection.

afterEach(() => vi.restoreAllMocks());

describe('runDbHeartbeat', () => {
  it('pings the database and resolves true', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const $queryRaw = vi.fn().mockResolvedValue([{ '?column?': 1 }]);

    await expect(runDbHeartbeat({ $queryRaw } as any)).resolves.toBe(true);
    expect($queryRaw).toHaveBeenCalledTimes(1);
  });

  it('does not reject when the database is unreachable', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const $queryRaw = vi
      .fn()
      .mockRejectedValue(new Error("Can't reach database server at `postgres.railway.internal:5432`"));

    await expect(runDbHeartbeat({ $queryRaw } as any)).resolves.toBe(false);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('DB heartbeat failed'),
      expect.stringContaining("Can't reach database server"),
    );
  });
});
