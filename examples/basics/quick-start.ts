/**
 * Two sources, one action. The lowest ceiling wins.
 *
 *          none    own    team   region   all
 *   plan   ●━━━━━━━━━━━━━━━●
 *   dpa    ●━━━━━━━●
 *   ───────────────────────────────────────────
 *   both   ●━━━━━━━●                      FORBIDDEN
 */

import { chain, compose, state, unit } from '../../src/index';

const detail = chain(['none', 'own', 'team', 'region', 'all']);

const plan = unit('export', { floor: 'none', ceiling: 'team' });
const dpa = unit('export', { floor: 'none', ceiling: 'own' });

const both = compose(detail, [plan, dpa]);
console.log(both, state(detail, both));

// A floor cannot be lowered. Put one above the ceiling and they cross.
//
//   rota   ················●━━━━━━━━━━━━━━━●
//   dpa    ●━━━━━━━●
//   ───────────────────────────────────────────
//                  └── contested ──┘   CONFLICT
const rota = unit('export', { floor: 'team', ceiling: 'all' });
const crossed = compose(detail, [rota, dpa]);
console.log(crossed, state(detail, crossed));
