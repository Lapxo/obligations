/**
 * "Any of these routes will do" — as a list, so the agent sees the gaps.
 *
 * A task can often be done more than one way, and the ways are not one range.
 * Handing the agent a single range that spans them would let it ask for
 * something no route actually offers.
 */

import { anyOf, chain, complexity, compose, state, unit } from '../../src/index';

const reach = chain(['none', 'own', 'team', 'region', 'all']);

// Three ways to answer a support question, each with its own reach.
const routes = [
  unit('lookup', { floor: 'none', ceiling: 'own' }), //    the cache: this user only
  unit('lookup', { floor: 'region', ceiling: 'all' }), //  the warehouse: broad, slow
  unit('lookup', { floor: 'none', ceiling: 'own' }), //    a duplicate route
];

const offered = anyOf(reach, routes);
console.log('routes offered:');
for (const r of offered) console.log(`  ${r.floor}..${r.ceiling}`);
console.log(`  (${offered.length} of ${routes.length} — duplicates collapsed)`);

// `team` is in the gap. A single spanning range would have offered it.
const atTeam = unit('lookup', { floor: 'team', ceiling: 'team' });
const reachable = offered.some(
  (r) =>
    reach.leq(reach.rank(r.floor), reach.rank('team')) &&
    reach.leq(reach.rank('team'), reach.rank(r.ceiling)),
);
console.log(`\ncan any route serve \`team\`? ${reachable ? 'yes' : 'no'}`);
console.log('  a single range none..all would have said yes, and been wrong.');

// Add a mid-tier route and the gap closes on its own.
const withIndex = anyOf(reach, [...routes, unit('lookup', { floor: 'own', ceiling: 'region' })]);
console.log(
  `\nafter adding a mid-tier route: ${withIndex.length} range(s) —`,
  withIndex.map((r) => `${r.floor}..${r.ceiling}`).join(', '),
);

// And what the company allows still applies to whichever route is picked.
const dpa = unit('lookup', { floor: 'none', ceiling: 'own' });
console.log('\nwith the contract applied to each route:');
for (const r of offered) {
  const both = compose(reach, [r, dpa]);
  console.log(
    `  ${r.floor}..${r.ceiling}`.padEnd(18),
    state(reach, both) === 'CONFLICT' ? 'RULED OUT' : `${both.floor}..${both.ceiling}`,
  );
}

// How much each statement actually says — nothing to do with satisfiability.
console.log('\nhow constrained each is:');
for (const r of [...offered, atTeam])
  console.log(`  ${r.floor}..${r.ceiling}`.padEnd(18), complexity(reach, r));
