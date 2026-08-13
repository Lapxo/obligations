/**
 * Keep versus delete.
 *
 *          now   30d   90d   1y   7y   forever
 *   keep   ·····················●━━━━━━━━━●     floor at 7y
 *   forget ●                                    ceiling at now
 *   ────────────────────────────────────────────
 *          └────── contested ──────┘   CONFLICT
 *
 * Both obligations are real. A register of booleans resolves this as
 * whichever job runs last.
 */

import { and, chain, compose, packer, state, unit } from '../../src/index';

const horizon = chain(['now', '30 days', '90 days', '1 year', '7 years', 'forever']);
const pk = packer(horizon);

const keep = unit('job_id', { floor: '7 years', ceiling: 'forever' });
const forget = unit('job_id', { floor: 'now', ceiling: 'now' });

console.log('keep alone  ', state(horizon, keep));
console.log('forget alone', state(horizon, forget));

const both = compose(horizon, [keep, forget]);
console.log('together    ', state(horizon, both));
console.log('lost        ', pk.clashing(and(pk.pack(keep), pk.pack(forget))));
