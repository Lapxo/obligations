/**
 * A scale that is not a plain ladder.
 *
 *          both
 *         /    \        x and y are incomparable, so
 *        x      y       {x∧y, x∨y} ≠ {x, y} and the
 *         \    /        premium stops being zero.
 *          none
 *
 * Composition and the four states are exact here too. What a PLAIN LADDER
 * buys is that the premium vanishes — being able to compare any two, not distributivity.
 * This scale is simple and still charges.
 */

import { chain, compose, defect, order, state, unit } from '../../src/index';

const T = true;
const F = false;
const powerset = order(
  ['none', 'x', 'y', 'both'],
  [
    [T, T, T, T],
    [F, T, F, T],
    [F, F, T, T],
    [F, F, F, T],
  ],
);

console.log('total?', powerset.isLadder, ' simple?', powerset.isSimple);

const onlyX = unit('scope', { floor: 'x', ceiling: 'x' });
const onlyY = unit('scope', { floor: 'y', ceiling: 'y' });
console.log('x AND y →', state(powerset, compose(powerset, [onlyX, onlyY])));

// The premium, under three unrelated valuations.
const four = chain(['a', 'b', 'c', 'd']);
const worst = (o: typeof four, f: (i: number) => number): string => {
  let m = 0;
  for (let a = 0; a < 4; a++)
    for (let b = 0; b < 4; b++) m = Math.max(m, Math.abs(defect(o, f, a, b)));
  return m.toFixed(3);
};
console.log('\n            chain   powerset');
for (const [i, f] of [
  (i: number) => i,
  (i: number) => i * i,
  (i: number) => Math.log(i + 1),
].entries()) {
  console.log(`valuation ${i}   ${worst(four, f)}   ${worst(powerset, f)}`);
}
