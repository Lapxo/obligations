/**
 * One number says how bad, never where.
 *
 *   coarse = Σ  mass · coarse
 *
 * A breakdown that does not add back is decoration, so `localise` throws.
 */

import { chain, dropTo, localise, price, type Piece, type UnitError } from '../../src/index';

const reach = chain(['none', 'own', 'team', 'region', 'all']);
const records = (i: number): number => [0, 1, 40, 900, 12_000][i] ?? 0;

console.log('capped at own instead of team:', dropTo(records, 2, 1), 'records');
console.log('price(region, own):', price(reach, records, 3, 1));

// Same total, two different stories.
const split = (pieces: Piece[]): void => {
  const total = { coarse: pieces.reduce((a, p) => a + p.mass * p.coarse, 0), gain: 0 };
  const l = localise(pieces, total);
  console.log(
    `  total ${l.total.coarse.toFixed(2)}  worst ${l.worst?.name}  ${(l.concentration * 100).toFixed(0)}%`,
  );
};
console.log('\nconcentrated:');
split([
  { name: 'one tenant', mass: 0.5, coarse: 4, gain: 0 },
  { name: 'the rest', mass: 0.5, coarse: 1, gain: 0 },
]);
console.log('spread out:');
split([
  { name: 'a', mass: 0.5, coarse: 2.5, gain: 0 },
  { name: 'b', mass: 0.5, coarse: 2.5, gain: 0 },
]);

// What it refuses, and why NaN needs its own check: every comparison with it
// is false, including the ones meant to reject it.
console.log('\nrefuses:');
for (const [why, pieces] of [
  ['a dropped piece', [{ name: 'a', mass: 0.25, coarse: 4, gain: 0 }]],
  ['a mass that is not a number', [{ name: 'a', mass: NaN, coarse: 1, gain: 0 }]],
] as [string, Piece[]][]) {
  try {
    localise(pieces, { coarse: 2.5, gain: 0 });
  } catch (e) {
    console.log(' ', why.padEnd(30), (e as UnitError).code);
  }
}
