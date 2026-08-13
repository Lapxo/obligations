/**
 * The operating window of a board, from the datasheets.
 *
 * Every part gives a range: a minimum it will work at and an absolute maximum
 * it will survive. The board works where every range overlaps — and that is
 * combining, with no software anywhere in it.
 */

import { chain, compose, state, unit, type Unit } from '../../src/index';

/** Hundredths of a volt, 2.50 to 5.50. */
const volts = chain([...Array(31).keys()].map((i) => (2.5 + i / 10).toFixed(1)));

const part = (name: string, min: number, max: number): Unit =>
  unit(name, { floor: min.toFixed(1), ceiling: max.toFixed(1) });

const board = [part('MCU', 2.7, 3.6), part('sensor', 3.0, 5.0), part('flash', 2.7, 3.3)];

console.log('the parts:\n');
for (const p of board) console.log(`  ${p.subject.padEnd(8)} ${p.floor} .. ${p.ceiling} V`);

const window = compose(volts, board);
console.log(`\nwindow:  ${window.floor} .. ${window.ceiling} V   (${state(volts, window)})`);

// Swap the flash for one that needs more headroom than the MCU can survive.
const worse = [part('MCU', 2.7, 3.6), part('sensor', 3.0, 5.0), part('flash', 3.8, 5.0)];
const broken = compose(volts, worse);
console.log(`\nswap the flash for a 3.8 V part:`);
console.log(`  → ${state(volts, broken)}: floor ${broken.floor} above ceiling ${broken.ceiling}`);
console.log('\nNo rail supplies that board. The numbers were on three datasheets');
console.log('and the composition is what nobody does by hand on the fourth revision.');
