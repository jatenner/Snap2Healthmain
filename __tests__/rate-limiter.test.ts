/**
 * Rate Limiter Tests
 */

import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '../app/lib/rate-limiter';

describe('Rate Limiter', () => {
  const config = { maxRequests: 3, windowMs: 10000 };

  it('allows requests within the limit', () => {
    const r1 = checkRateLimit('test-user-1', 'test-endpoint-1', config);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
  });

  it('blocks after exceeding the limit', () => {
    const endpoint = 'test-endpoint-block';
    checkRateLimit('test-user-2', endpoint, config);
    checkRateLimit('test-user-2', endpoint, config);
    checkRateLimit('test-user-2', endpoint, config);
    const r4 = checkRateLimit('test-user-2', endpoint, config);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.resetInSeconds).toBeGreaterThan(0);
  });

  it('different users have separate limits', () => {
    const endpoint = 'test-endpoint-separate';
    checkRateLimit('user-a', endpoint, config);
    checkRateLimit('user-a', endpoint, config);
    checkRateLimit('user-a', endpoint, config);
    const rA = checkRateLimit('user-a', endpoint, config);
    const rB = checkRateLimit('user-b', endpoint, config);
    expect(rA.allowed).toBe(false);
    expect(rB.allowed).toBe(true);
  });

  it('different endpoints have separate limits', () => {
    checkRateLimit('user-c', 'ep1', config);
    checkRateLimit('user-c', 'ep1', config);
    checkRateLimit('user-c', 'ep1', config);
    const rEp1 = checkRateLimit('user-c', 'ep1', config);
    const rEp2 = checkRateLimit('user-c', 'ep2', config);
    expect(rEp1.allowed).toBe(false);
    expect(rEp2.allowed).toBe(true);
  });
});
