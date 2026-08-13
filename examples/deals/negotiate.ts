/**
 * The same arithmetic used to FIND agreement instead of to refuse it.
 *
 * Two parties, several clauses. Each states a range it can live with. Where
 * the ranges overlap is the deal; where they cross is what has to move — and
 * naming the contested span turns "no deal" into a list of things to talk
 * about.
 */

import {
  and,
  anyOf,
  chain,
  complexity,
  compose,
  packer,
  state,
  unit,
  type Scale,
  type Unit,
} from '../../src/index';

const scales: Record<string, Scale> = {
  term: chain(['1 month', '6 months', '1 year', '3 years']),
  volume: chain(['100', '1k', '10k', '100k']),
  penalty: chain(['none', '1x', '5x', '20x']),
};

const buyer: Unit[] = [
  unit('term', { floor: '1 month', ceiling: '1 year' }), //   no long lock-in
  unit('volume', { floor: '10k', ceiling: '100k' }), //       needs the capacity
  unit('penalty', { floor: '5x', ceiling: '20x' }), //        wants teeth
];

const seller: Unit[] = [
  unit('term', { floor: '1 year', ceiling: '3 years' }), //   wants commitment
  unit('volume', { floor: '100', ceiling: '100k' }), //       flexible
  unit('penalty', { floor: 'none', ceiling: '1x' }), //       limited liability
];

console.log('clause      buyer            seller           together\n');
const stuck: string[] = [];
for (const [i, clause] of ['term', 'volume', 'penalty'].entries()) {
  const s = scales[clause];
  const both = compose(s, [buyer[i], seller[i]]);
  const verdict = state(s, both);
  console.log(
    `${clause.padEnd(11)}` +
      `${(buyer[i].floor + '..' + buyer[i].ceiling).padEnd(17)}` +
      `${(seller[i].floor + '..' + seller[i].ceiling).padEnd(17)}` +
      (verdict === 'CONFLICT' ? 'NO OVERLAP' : `${both.floor}..${both.ceiling}`),
  );
  if (verdict === 'CONFLICT') stuck.push(clause);
}

// A deal exists unless some clause has no overlap. Naming which ones turns
// "no deal" into a list of things to talk about.
console.log(`\ndeal? ${stuck.length === 0 ? 'yes' : `not yet — ${stuck.join(', ')}`}`);

// WHICH LEVELS ARE FOUGHT OVER. `missing` is the wrong question here: it
// answers "how do I widen to cover that", and a party conceding has to
// NARROW. What both sides need is the contested span itself.
console.log('\nthe contested span, per stuck clause:\n');
for (const clause of stuck) {
  const i = ['term', 'volume', 'penalty'].indexOf(clause);
  const s = scales[clause];
  const pk = packer(s);
  const contested = pk.clashing(and(pk.pack(buyer[i]), pk.pack(seller[i])));
  console.log(`  ${clause.padEnd(9)} nothing works in [${contested.join(', ')}]`);
  console.log(
    `  ${''.padEnd(9)} one side must cross it: buyer down from ${buyer[i].floor}, ` +
      `or seller up from ${seller[i].ceiling}`,
  );
}

// A party can offer alternatives instead of one range, and the gaps stay
// visible so nobody agrees to a middle nobody offered.
console.log('\nseller offers two structures for `term`:\n');
const offers = anyOf(scales.term, [
  unit('term', { floor: '1 month', ceiling: '6 months' }), // short, higher rate
  unit('term', { floor: '3 years', ceiling: '3 years' }), // long, discounted
]);
for (const o of offers) console.log(`  ${o.floor}..${o.ceiling}`);
console.log(`  (${offers.length} ranges — nothing in between is on the table)`);

const viable = offers.filter(
  (o) => state(scales.term, compose(scales.term, [o, buyer[0]])) !== 'CONFLICT',
);
console.log(
  `  buyer can take: ${viable.map((o) => `${o.floor}..${o.ceiling}`).join(', ') || 'neither'}`,
);

// How hard each side is negotiating, as a number.
console.log('\nhow much each side pins down:');
for (const [who, side] of [
  ['buyer', buyer],
  ['seller', seller],
] as const) {
  const total = side.reduce((a, u, i) => a + complexity(scales[u.subject], u), 0);
  console.log(`  ${who.padEnd(7)} ${total}`);
}
