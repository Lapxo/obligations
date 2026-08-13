/**
 * Finding the broken instrument, without knowing the true value.
 *
 * A measurement is a range: a reading plus the error the instrument admits
 * to. Two instruments measuring the same thing must overlap — if they do not,
 * at least one is wrong by more than it claims.
 *
 * That is detectable with NO reference, no calibrated standard, no ground
 * truth. It falls out of combining.
 */

import { chain, compose, state, unit, type Unit } from '../../src/index';

/** Tenths of a degree, 19.0 to 22.5. The scale is the resolution you have. */
const tenths = [...Array(36).keys()].map((i) => (19 + i / 10).toFixed(1));
// No `packer` here: 36 levels is 35 steps, and the fast form holds 32. The
// plain form has no such limit — resolution is a property of your
// instruments, not of a machine word.
const temp = chain(tenths);

/** A reading is a range: value ± the error the datasheet admits. */
const reading = (name: string, value: number, err: number): Unit =>
  unit(name, { floor: (value - err).toFixed(1), ceiling: (value + err).toFixed(1) });

const bath = [
  reading('thermo-A', 20.0, 0.5),
  reading('thermo-B', 20.3, 0.3),
  reading('thermo-C', 21.8, 0.4),
];

console.log('what each instrument admits to:\n');
for (const r of bath) console.log(`  ${r.subject.padEnd(10)} ${r.floor} .. ${r.ceiling}`);

const all = compose(temp, bath);
console.log('\nall three together:', state(temp, all));

// Leave one out. If the rest agree, the one left out is the odd one — and
// nothing here ever had to know what the temperature actually was.
console.log('\nleave one out:\n');
for (const suspect of bath) {
  const rest = bath.filter((r) => r !== suspect);
  const joint = compose(temp, rest);
  const agree = state(temp, joint) !== 'CONFLICT';
  console.log(
    `  without ${suspect.subject.padEnd(10)} ` +
      (agree ? `the rest agree on ${joint.floor}..${joint.ceiling}` : 'the rest still disagree'),
  );
}

console.log('\nOnly one of those clears the disagreement, and that names the');
console.log('instrument to recalibrate. No standard was consulted.');
