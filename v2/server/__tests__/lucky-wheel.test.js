/**
 * Lucky Wheel Logic Tests
 */
const {
  DEFAULT_PRIZES,
  DEFAULT_WEIGHTS,
  selectPrize,
  calculatePrizePoints,
  validatePrize,
  getWeightPercentages,
  simulateSpins,
} = require('../lib/lucky-wheel');

describe('Lucky Wheel - selectPrize', () => {
  it('should return first prize when random value is 0', () => {
    const result = selectPrize(DEFAULT_PRIZES, DEFAULT_WEIGHTS, 0);
    expect(result.index).toBe(0);
    expect(result.prize.label).toBe('+5');
  });

  it('should return last prize when random value approaches 1', () => {
    const result = selectPrize(DEFAULT_PRIZES, DEFAULT_WEIGHTS, 0.9999);
    expect(result.index).toBe(7);
    expect(result.prize.label).toBe('jackpot');
  });

  it('should select prize based on weight threshold', () => {
    // With weights [25, 20, 18, 15, 10, 7, 3, 2], total = 100
    // Random 0.26 * 100 = 26, which is > 25 but <= 45, so should be index 1
    const result = selectPrize(DEFAULT_PRIZES, DEFAULT_WEIGHTS, 0.26);
    expect(result.index).toBe(1);
    expect(result.prize.label).toBe('+10');
  });

  it('should throw error when arrays have different lengths', () => {
    expect(() => {
      selectPrize(DEFAULT_PRIZES, [1, 2, 3]);
    }).toThrow('Prizes and weights arrays must have same length');
  });

  it('should handle custom prizes and weights', () => {
    const customPrizes = [
      { label: 'A', points: 10 },
      { label: 'B', points: 20 },
    ];
    const customWeights = [1, 1]; // 50/50

    // With random 0.3, threshold = 0.3 * 2 = 0.6, after first prize: 0.6 - 1 = -0.4 <= 0
    const result = selectPrize(customPrizes, customWeights, 0.3);
    expect(result.index).toBe(0);
    expect(result.prize.label).toBe('A');

    // With random 0.6, threshold = 0.6 * 2 = 1.2, after first prize: 1.2 - 1 = 0.2 > 0
    const result2 = selectPrize(customPrizes, customWeights, 0.6);
    expect(result2.index).toBe(1);
    expect(result2.prize.label).toBe('B');
  });
});

describe('Lucky Wheel - calculatePrizePoints', () => {
  it('should return prize points for regular prizes', () => {
    const prize = { label: '+10', points: 10 };
    expect(calculatePrizePoints(prize)).toBe(10);
  });

  it('should return 0 for multiplier prize with 0 session points', () => {
    const prize = { label: 'x2', points: 0, multiplier: 2 };
    expect(calculatePrizePoints(prize, 0)).toBe(0);
  });

  it('should double session points for x2 multiplier', () => {
    const prize = { label: 'x2', points: 0, multiplier: 2 };
    expect(calculatePrizePoints(prize, 50)).toBe(50); // x2 means add 50 more (total becomes 100)
  });

  it('should handle x3 multiplier', () => {
    const prize = { label: 'x3', points: 0, multiplier: 3 };
    expect(calculatePrizePoints(prize, 30)).toBe(60); // x3 means add 2x current (total becomes 90)
  });

  it('should return prize points when no multiplier', () => {
    const jackpot = { label: 'jackpot', points: 50, special: true };
    expect(calculatePrizePoints(jackpot, 100)).toBe(50);
  });
});

describe('Lucky Wheel - validatePrize', () => {
  it('should return true for valid prize', () => {
    expect(validatePrize({ label: '+5', points: 5 })).toBe(true);
  });

  it('should return false for null', () => {
    expect(validatePrize(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(validatePrize(undefined)).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(validatePrize('string')).toBe(false);
    expect(validatePrize(123)).toBe(false);
  });

  it('should return false for missing label', () => {
    expect(validatePrize({ points: 5 })).toBe(false);
  });

  it('should return false for missing points', () => {
    expect(validatePrize({ label: '+5' })).toBe(false);
  });

  it('should return false for non-string label', () => {
    expect(validatePrize({ label: 123, points: 5 })).toBe(false);
  });

  it('should return false for non-number points', () => {
    expect(validatePrize({ label: '+5', points: '5' })).toBe(false);
  });
});

describe('Lucky Wheel - getWeightPercentages', () => {
  it('should convert weights to percentages', () => {
    const percentages = getWeightPercentages([50, 50]);
    expect(percentages).toEqual([50, 50]);
  });

  it('should handle default weights', () => {
    const percentages = getWeightPercentages();
    // Default weights sum to 100, so percentages should equal weights
    expect(percentages).toEqual([25, 20, 18, 15, 10, 7, 3, 2]);
  });

  it('should round to one decimal place', () => {
    const percentages = getWeightPercentages([1, 1, 1]);
    // Each should be 33.3%
    expect(percentages).toEqual([33.3, 33.3, 33.3]);
  });
});

describe('Lucky Wheel - simulateSpins', () => {
  it('should return distribution matching weight ratios roughly', () => {
    const distribution = simulateSpins(10000);

    // +5 should have ~25% (2500), jackpot should have ~2% (200)
    const plus5Ratio = distribution['+5'] / 10000;
    const jackpotRatio = distribution['jackpot'] / 10000;

    // Allow 5% variance
    expect(plus5Ratio).toBeGreaterThan(0.20);
    expect(plus5Ratio).toBeLessThan(0.30);
    expect(jackpotRatio).toBeGreaterThan(0.01);
    expect(jackpotRatio).toBeLessThan(0.05);
  });

  it('should include all prizes in distribution', () => {
    const distribution = simulateSpins(1000);
    DEFAULT_PRIZES.forEach(prize => {
      expect(distribution).toHaveProperty(prize.label);
    });
  });
});

describe('Lucky Wheel - Edge Cases', () => {
  it('should handle single prize', () => {
    const prizes = [{ label: 'only', points: 100 }];
    const weights = [1];
    const result = selectPrize(prizes, weights, 0.5);
    expect(result.prize.label).toBe('only');
  });

  it('should handle very small weights', () => {
    const prizes = [
      { label: 'common', points: 1 },
      { label: 'rare', points: 100 },
    ];
    const weights = [999, 1]; // 99.9% vs 0.1%
    const distribution = { common: 0, rare: 0 };

    for (let i = 0; i < 10000; i++) {
      const { prize } = selectPrize(prizes, weights);
      distribution[prize.label]++;
    }

    expect(distribution.common).toBeGreaterThan(9800);
    expect(distribution.rare).toBeLessThan(200);
  });

  it('should handle zero weight (never selected)', () => {
    const prizes = [
      { label: 'always', points: 1 },
      { label: 'never', points: 100 },
    ];
    const weights = [1, 0];

    for (let i = 0; i < 100; i++) {
      const { prize } = selectPrize(prizes, weights);
      expect(prize.label).toBe('always');
    }
  });
});

describe('Lucky Wheel - Integration', () => {
  it('should work end-to-end: select prize and calculate points', () => {
    const sessionPoints = 25;
    const { prize } = selectPrize(DEFAULT_PRIZES, DEFAULT_WEIGHTS, 0.95); // Should get x2 or jackpot

    if (prize.multiplier) {
      const points = calculatePrizePoints(prize, sessionPoints);
      expect(points).toBe(sessionPoints * (prize.multiplier - 1));
    } else {
      const points = calculatePrizePoints(prize, sessionPoints);
      expect(points).toBe(prize.points);
    }
  });

  it('should validate all default prizes', () => {
    DEFAULT_PRIZES.forEach(prize => {
      expect(validatePrize(prize)).toBe(true);
    });
  });
});
