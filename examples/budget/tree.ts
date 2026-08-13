/**
 * Committed versus capped, up an org tree.
 *
 * Each team has a floor — what it has already committed — and a ceiling — what
 * it is allowed to spend. Roll them up and the crossing arrives before the
 * quarter does, not after.
 */

import { chain, compose, localise, state, unit, type Piece, type Unit } from '../../src/index';

/** Thousands per month. */
const spend = chain(['0', '10', '25', '50', '100', '250']);

const teams: Unit[] = [
  unit('platform', { floor: '25', ceiling: '100' }),
  unit('growth', { floor: '10', ceiling: '50' }),
  unit('data', { floor: '50', ceiling: '100' }),
];

for (const t of teams)
  console.log(`${t.subject.padEnd(10)} committed ${t.floor}k, capped ${t.ceiling}k`);

const org = compose(spend, teams);
console.log('\nrolled up:', `${org.floor}k..${org.ceiling}k`, state(spend, org));

// Now `data` signs a contract that commits it past the group cap.
const over = [teams[0], teams[1], unit('data', { floor: '250', ceiling: '250' })];
const broken = compose(spend, over);
console.log('\nif data commits 250k:', state(spend, broken));
console.log(`  floor ${broken.floor}k is above ceiling ${broken.ceiling}k`);

// "We are over" is not actionable. WHERE is.
const pieces: Piece[] = [
  { name: 'platform', mass: 0.25, coarse: 0, gain: 0 },
  { name: 'growth', mass: 0.25, coarse: 0, gain: 0 },
  { name: 'data', mass: 0.5, coarse: 4, gain: 0 },
];
const where = localise(pieces, {
  coarse: pieces.reduce((a, p) => a + p.mass * p.coarse, 0),
  gain: 0,
});
console.log(
  `\nof the overrun, ${(where.concentration * 100).toFixed(0)}% sits in \`${where.worst?.name}\``,
);
console.log('\nThat is the difference between "we are 12% over" and');
console.log('"one team carries all of it".');
