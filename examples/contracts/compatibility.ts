/**
 * Is this deploy safe, across every consumer at once?
 *
 * A producer emits: that is a ceiling — the most that can appear in its
 * output. A consumer needs: that is a floor — the least it can work with.
 * Combine every consumer and the answer covers all of them at the same time.
 */

import { chain, compose, missing, state, unit, type Unit } from '../../src/index';

/** Shape versions, oldest first. Yours will be whatever you version by. */
const shape = chain(['v1', 'v2', 'v3', 'v4']);

const producer = unit('order.created', { floor: 'v1', ceiling: 'v3' });
const consumers: Unit[] = [
  unit('billing', { floor: 'v1', ceiling: 'v4' }),
  unit('search', { floor: 'v2', ceiling: 'v4' }),
  unit('legacy-etl', { floor: 'v1', ceiling: 'v2' }),
];

console.log('producer emits  ', `${producer.floor}..${producer.ceiling}`);
for (const c of consumers) console.log(`  ${c.subject.padEnd(12)} ${c.floor}..${c.ceiling}`);

const together = compose(shape, [producer, ...consumers]);
console.log('\nall together    ', `${together.floor}..${together.ceiling}`, state(shape, together));

// Now drop v1 support from the producer, as a cleanup ticket would.
const dropped = unit('order.created', { floor: 'v2', ceiling: 'v3' });
const after = compose(shape, [dropped, ...consumers]);
console.log('\nafter dropping v1:', state(shape, after));
for (const c of consumers) {
  const gap = missing(shape, dropped, c);
  if (gap.raiseFloorTo === null && gap.raiseCeilingTo === null) continue;
  console.log(`  ${c.subject} needs`, gap);
}

console.log('\n`legacy-etl` tops out at v2 and the producer now starts there —');
console.log('they still overlap. Drop v2 as well and they do not.');
const harder = compose(shape, [
  unit('order.created', { floor: 'v3', ceiling: 'v3' }),
  ...consumers,
]);
console.log('  dropping v2 too:', state(shape, harder));
