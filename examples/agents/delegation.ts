/**
 * Reaching means holding.
 *
 *   bot ──▶ dana ──▶ company
 *            │          │
 *       team..all   none..own
 *            └────┬─────┘
 *          CONFLICT at team
 *
 * Each is fine alone. Every hop can only NARROW — which is what composition
 * does, and the test for whether a graph belongs here.
 */

import { chain, closure, packer, reach, register, unit, type Edge } from '../../src/index';

const send = chain(['none', 'own', 'team', 'region', 'all']);
const pk = packer(send);

const holders = ['bot', 'dana', 'company'];
const bound = [
  unit('send', { floor: 'none', ceiling: 'all' }), // bot: says nothing
  unit('send', { floor: 'team', ceiling: 'all' }), // dana: on the rota — a floor
  unit('send', { floor: 'none', ceiling: 'own' }), // company: the DPA — a ceiling
];
const edges: Edge[] = [
  ['bot', 'dana'],
  ['dana', 'company'],
];

const reg = register(
  pk,
  bound.map((u) => pk.pack(u)),
);
const rows = (h: string): number[] => [holders.indexOf(h)];

const chained = closure(reg, holders, (h) => reach(edges, h), rows);
const alone = closure(reg, holders, (h) => [h], rows); // same code, no edges

const show = (e: ReturnType<typeof closure>, h: string): string => {
  const row = e.row(h);
  if (e.clashesAt(row) !== 0) return `CONFLICT at [${pk.clashing(e.packedAt(row))}]`;
  const u = pk.unpack('send', e.packedAt(row));
  return `${u.floor}..${u.ceiling}`;
};

console.log(''.padEnd(9), 'ALONE'.padEnd(22), 'IN THE CHAIN');
for (const h of holders) {
  console.log(h.padEnd(9), show(alone, h).padEnd(22), show(chained, h));
}

console.log('\nbot reaches:', chained.via('bot').join(' → '));
