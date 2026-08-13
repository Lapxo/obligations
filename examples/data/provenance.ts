/**
 * A claim is worth its weakest input.
 *
 *   declared ─── statistics ─── sample ─── exact
 *      │                                     │
 *   absorbs                              identity
 *
 * Not a second algebra: it is `compose` on that order.
 */

import { METHODS, weakest, type Method } from '../../src/index';

console.log(METHODS.join(' < '), '\n');

const cases: Method[][] = [
  ['exact', 'exact'],
  ['exact', 'sample'],
  ['exact', 'exact', 'declared'],
  [],
];
for (const inputs of cases) {
  console.log((inputs.join(' + ') || '(nothing)').padEnd(28), '→', weakest(inputs));
}
