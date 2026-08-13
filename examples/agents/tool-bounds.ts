/**
 * Hand an agent its limits instead of interrogating it.
 *
 * An agent proposes, you refuse, it retries — and every retry is a model call.
 * A range is a bound, so it goes in the tool description and the agent cannot
 * over-ask in the first place.
 */

import { chain, isConflict, packer, register, unit } from '../../src/index';

const reach = chain(['none', 'own', 'team', 'region', 'all']);
const pk = packer(reach);

const sources = [
  unit('email.send', { floor: 'none', ceiling: 'region' }), // the plan
  unit('email.send', { floor: 'none', ceiling: 'own' }), //    the contract
];
const reg = register(
  pk,
  sources.map((u) => pk.pack(u)),
);
const rows = [0, 1];
const folded = reg.fold(rows);

console.log(
  'offered to the agent:',
  isConflict(folded) ? 'WITHHELD' : `up to ${pk.unpack('email.send', folded).ceiling}`,
);

for (const at of ['own', 'team'] as const) {
  console.log(`  @ ${at}`.padEnd(10), pk.accepts(folded, pk.maskOf(at)) ? 'yes' : 'NO');
}

// The hot path allocates nothing. Zero means nothing stops it.
console.log('  clashesOf:', reg.clashesOf(rows));

// And when the sources contradict, withhold the tool rather than serving a
// plausible middle value.
const paid = register(pk, [
  pk.pack(unit('email.send', { floor: 'none', ceiling: 'own' })), // the contract
  pk.pack(unit('email.send', { floor: 'region', ceiling: 'all' })), // an add-on they bought
]);
const bad = paid.fold([0, 1]);
console.log('\nan add-on the contract forbids:');
console.log(
  '  ',
  isConflict(bad) ? `WITHHELD — sources disagree at [${pk.clashing(bad)}]` : 'served',
);
