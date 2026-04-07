/**
 * Correlation Engine Tests
 *
 * Verifies: null finding generation, hypothesis ledger, FDR correction.
 * These tests use the insight-simulation scenarios.
 */

import { describe, it, expect } from 'vitest';
import { runAllScenarios, runScenario } from '../app/lib/insight-simulation';

describe('Correlation Engine + Insight Builder', () => {
  const results = runAllScenarios();

  it('all scenarios pass basic checks', () => {
    for (const result of results) {
      for (const check of result.checks) {
        expect(check.passed, `${result.name}: ${check.description} — ${check.detail}`).toBe(true);
      }
    }
  });

  it('every scenario produces facts', () => {
    for (const result of results) {
      expect(result.insight.facts.length).toBeGreaterThan(0);
    }
  });

  it('every scenario produces scores', () => {
    for (const result of results) {
      expect(result.insight.scores.length).toBeGreaterThan(0);
    }
  });

  it('recommendations are capped at 5', () => {
    for (const result of results) {
      expect(result.insight.recommendations.length).toBeLessThanOrEqual(5);
    }
  });

  it('recommendations all have IDs', () => {
    for (const result of results) {
      for (const rec of result.insight.recommendations) {
        expect(rec.id).toBeTruthy();
        expect(rec.id.length).toBeGreaterThan(0);
      }
    }
  });

  it('confidence overall is between 10 and 100', () => {
    for (const result of results) {
      expect(result.insight.confidence.overall).toBeGreaterThanOrEqual(10);
      expect(result.insight.confidence.overall).toBeLessThanOrEqual(100);
    }
  });

  it('high caffeine scenario prioritizes caffeine-related recommendation', () => {
    const caffeineResult = results.find(r => r.name.includes('Caffeine'));
    expect(caffeineResult).toBeDefined();
    const topRec = caffeineResult!.insight.recommendations[0];
    expect(topRec).toBeDefined();
    // Should be about caffeine pattern or caffeine timing
    expect(topRec!.id).toContain('caffeine');
  });

  it('underfueling scenario flags low adequacy as persistent', () => {
    const underResult = results.find(r => r.name.includes('Underfueling'));
    expect(underResult).toBeDefined();
    const adequacyRec = underResult!.insight.recommendations.find(r => r.id.includes('adequacy'));
    expect(adequacyRec).toBeDefined();
    expect(adequacyRec!.recurrence).toBe('persistent');
  });

  it('improving scenario has fewer recommendations than problem scenarios', () => {
    const improving = results.find(r => r.name.includes('Improving'));
    const underfueling = results.find(r => r.name.includes('Underfueling'));
    expect(improving).toBeDefined();
    expect(underfueling).toBeDefined();
    expect(improving!.insight.recommendations.length).toBeLessThanOrEqual(underfueling!.insight.recommendations.length);
  });

  it('patterns have findingType set', () => {
    for (const result of results) {
      for (const pattern of result.insight.patterns) {
        expect(['helpful', 'harmful', 'neutral']).toContain(pattern.findingType);
      }
    }
  });
});
