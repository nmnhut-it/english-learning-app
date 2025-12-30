/**
 * Lucky Wheel Logic - Testable module
 */

const DEFAULT_PRIZES = [
  { label: '+5', points: 5, color: 0x10b981 },
  { label: '+10', points: 10, color: 0x3b82f6 },
  { label: '+15', points: 15, color: 0x8b5cf6 },
  { label: '+20', points: 20, color: 0xf59e0b },
  { label: '+25', points: 25, color: 0xef4444 },
  { label: '+30', points: 30, color: 0xec4899 },
  { label: 'x2', points: 0, color: 0x6366f1, multiplier: 2 },
  { label: 'jackpot', points: 50, color: 0xfbbf24, special: true },
];

// Weights for prizes (index matches DEFAULT_PRIZES)
// Higher weight = higher chance
const DEFAULT_WEIGHTS = [25, 20, 18, 15, 10, 7, 3, 2];

/**
 * Select a prize using weighted random selection
 * @param {Array} prizes - Array of prize objects
 * @param {Array} weights - Array of weights (same length as prizes)
 * @param {number} randomValue - Random value between 0 and 1 (for testing)
 * @returns {Object} Selected prize with index
 */
function selectPrize(prizes = DEFAULT_PRIZES, weights = DEFAULT_WEIGHTS, randomValue = Math.random()) {
  if (prizes.length !== weights.length) {
    throw new Error('Prizes and weights arrays must have same length');
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let threshold = randomValue * totalWeight;

  for (let i = 0; i < prizes.length; i++) {
    threshold -= weights[i];
    if (threshold <= 0) {
      return { prize: prizes[i], index: i };
    }
  }

  // Fallback to last prize
  return { prize: prizes[prizes.length - 1], index: prizes.length - 1 };
}

/**
 * Calculate actual points from a prize
 * @param {Object} prize - Prize object
 * @param {number} currentSessionPoints - Current session points (for multiplier)
 * @returns {number} Actual points to award
 */
function calculatePrizePoints(prize, currentSessionPoints = 0) {
  if (prize.multiplier) {
    return currentSessionPoints * (prize.multiplier - 1); // x2 means add current points again
  }
  return prize.points;
}

/**
 * Validate prize object
 * @param {Object} prize - Prize to validate
 * @returns {boolean} True if valid
 */
function validatePrize(prize) {
  if (!prize || typeof prize !== 'object') return false;
  if (typeof prize.label !== 'string') return false;
  if (typeof prize.points !== 'number') return false;
  return true;
}

/**
 * Get weight distribution as percentages
 * @param {Array} weights - Array of weights
 * @returns {Array} Array of percentages
 */
function getWeightPercentages(weights = DEFAULT_WEIGHTS) {
  const total = weights.reduce((sum, w) => sum + w, 0);
  return weights.map(w => Math.round((w / total) * 100 * 10) / 10);
}

/**
 * Simulate multiple spins for testing distribution
 * @param {number} spins - Number of spins to simulate
 * @param {Array} prizes - Prize array
 * @param {Array} weights - Weights array
 * @returns {Object} Distribution of results
 */
function simulateSpins(spins, prizes = DEFAULT_PRIZES, weights = DEFAULT_WEIGHTS) {
  const distribution = {};
  prizes.forEach(p => distribution[p.label] = 0);

  for (let i = 0; i < spins; i++) {
    const { prize } = selectPrize(prizes, weights);
    distribution[prize.label]++;
  }

  return distribution;
}

module.exports = {
  DEFAULT_PRIZES,
  DEFAULT_WEIGHTS,
  selectPrize,
  calculatePrizePoints,
  validatePrize,
  getWeightPercentages,
  simulateSpins,
};
