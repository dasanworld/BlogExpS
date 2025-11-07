import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { deriveApplicationStatusBreakdown } from '../src/features/influencer/dashboard/lib/progress';

describe('deriveApplicationStatusBreakdown', () => {
  it('computes applied count and completion rate', () => {
    const stats = deriveApplicationStatusBreakdown({
      totalAll: 12,
      totalSelected: 3,
      totalRejected: 2,
    });
    assert.equal(stats.totalAll, 12);
    assert.equal(stats.selected, 3);
    assert.equal(stats.rejected, 2);
    assert.equal(stats.applied, 7);
    assert.equal(stats.completionRate, 0.25);
  });

  it('clamps negative applied counts to zero', () => {
    const stats = deriveApplicationStatusBreakdown({
      totalAll: 4,
      totalSelected: 3,
      totalRejected: 3,
    });
    assert.equal(stats.applied, 0);
  });

  it('handles zero totals safely', () => {
    const stats = deriveApplicationStatusBreakdown({
      totalAll: 0,
      totalSelected: 0,
      totalRejected: 0,
    });
    assert.equal(stats.applied, 0);
    assert.equal(stats.completionRate, 0);
  });
});
