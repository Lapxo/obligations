/**
 * A board review, end to end — the same arithmetic, nothing about software.
 *
 *   MCU ┐
 *   sen ├─▶ combine ─▶ window ─▶ pick a rail
 *   fla ┘        │
 *                └─▶ if empty: which part, and what part would fix it
 */

import {
  chain,
  complexity,
  compose,
  entails,
  missing,
  packer,
  slack,
  spectrum,
  state,
  unit,
  type Unit,
} from '../../src/index';

const volts = chain([...Array(31).keys()].map((i) => (2.5 + i / 10).toFixed(1)));
const pk = packer(volts);
const part = (name: string, lo: number, hi: number): Unit =>
  unit(name, { floor: lo.toFixed(1), ceiling: hi.toFixed(1) });
const line = (u: Unit): string => `${u.floor} .. ${u.ceiling} V`;

const board = [part('MCU', 2.7, 3.6), part('sensor', 3.0, 5.0), part('flash', 2.7, 3.3)];

console.log('1 · the parts, and how much each constrains');
for (const p of board) {
  console.log(`    ${p.subject.padEnd(7)} ${line(p).padEnd(16)} says ${complexity(volts, p)}`);
}

console.log('\n2 · the window');
const window = compose(volts, board);
console.log(`    ${line(window)}   ${state(volts, window)}`);

console.log('\n3 · swap the flash for a 3.8 V part');
const worse = [board[0], board[1], part('flash', 3.8, 5.0)];
const broken = compose(volts, worse);
console.log(`    ${state(volts, broken)} — floor ${broken.floor} above ceiling ${broken.ceiling}`);
console.log(
  `    no rail in [${pk.clashing(pk.pack(broken))[0]} .. ${pk.clashing(pk.pack(broken)).at(-1)}] works`,
);

console.log('\n4 · what a replacement part would have to allow');
console.log('   ', missing(volts, part('flash', 3.8, 5.0), window));

console.log('\n5 · which part is the binding one');
for (const p of board) {
  const others = compose(
    volts,
    board.filter((q) => q !== p),
  );
  console.log(`    without ${p.subject.padEnd(7)} the window becomes ${line(others)}`);
}

console.log('\n6 · is the MCU stricter than the window?');
console.log(`    window ⊨ MCU   ${entails(volts, window, board[0])}`);

// A voltage scale is a plain ladder, so nothing is ever left over — visible
// from the scale alone, with no idea of what a volt is "worth".
console.log('\n7 · the scale itself');
console.log('   ', slack(volts, 3, 8), ' ← no slack anywhere on a ladder');
const sp = spectrum(volts, (i) => i);
console.log(
  `    ${sp.pairs} pairs → ${sp.values.length} distinct outcome, band [${sp.band.low}, ${sp.band.high}]`,
);
