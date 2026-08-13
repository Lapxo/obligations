/**
 * The obligations protocol, as a library.
 *
 * A boolean answers *may I*. It cannot answer *how far*, it cannot record
 * that somebody DEPENDS on a capability, and it has nowhere to put two rules
 * that contradict each other. This replaces it with one idea: an opinion is
 * a range, and opinions combine.
 *
 * ## The whole of it
 *
 * Declare a SCALE — the levels this kind of thing comes in, weakest first.
 * An opinion puts a FLOOR under it and a CEILING over it. Combining opinions
 * takes the highest floor and the lowest ceiling.
 *
 * ```text
 *            none      own       team      region    all
 *   FREE     ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●   no opinion
 *   REQUIRED ····················●━━━━━━━━━━━━━━━━━━━●   the floor demands
 *   FORBIDDEN●━━━━━━━━━●······························   the ceiling limits
 *   CONFLICT ··········▼─────────▲····················   they cross
 * ```
 *
 * ## The part that pays for the change
 *
 * The two marks do not behave the same way, and that asymmetry is what a
 * single true/false column throws away:
 *
 * - a CEILING can always be lowered by another ceiling — take the lowest,
 *   and the answer is the same whatever order the opinions arrived in
 * - a FLOOR cannot be lowered at all. It records that something DEPENDS on
 *   the capability, so removing it has to be a visible failure rather than a
 *   quiet downgrade
 * - a floor above a ceiling is a CONTRADICTION, and it is a fact about the
 *   inputs rather than a bug in the code
 * - SILENCE IS NOT DENIAL. A source that says nothing contributes nothing.
 *   Treating silence as denial is how a capability disappears the day
 *   somebody adds an unrelated clause
 *
 * Adopting it costs close to nothing: `true` is `(bottom, top)` and `false`
 * is `(bottom, bottom)`, exactly. An existing table of
 * true/false is already valid input — enrich the rows that pay for it and
 * leave the rest.
 *
 * ## A boolean is not the origin. It is the projection that lost half.
 *
 * On a two-level scale there are FOUR opinions and a boolean can say TWO:
 *
 * ```text
 *   (no,  yes)   FREE        →  true
 *   (no,  no )   FORBIDDEN   →  false
 *   (yes, yes)   REQUIRED    →  no boolean says this
 *   (yes, no )   CONFLICT    →  no boolean says this
 * ```
 *
 * REQUIRED is "must be able to". A boolean says *may*, never *must*, so
 * nothing records that somebody depends on a capability and nothing notices
 * when a change takes it away. CONFLICT is "two promises that cannot both
 * hold"; a register of booleans has nowhere to put a contradiction, settles
 * one by precedence, and nobody finds out. That is where the bugs live.
 *
 * `asBoolean` performs the projection and names what it lost, every time.
 *
 * ## Scales that are not a single ladder
 *
 * A scale is usually a ladder — each level above the last. It does not have
 * to be: `order` builds one where two levels can be side by side, neither
 * above the other, and everything above still works.
 *
 * What a plain ladder buys is that combining costs nothing to work out, so
 * this library can answer without help. Off a ladder there is a PRICE, and a
 * price has to be measured by something that can see the data. See
 * `declines`.
 *
 * ## No engine, no binary
 *
 * There is nothing to link and no toolchain to install. What keeps this
 * honest is the shared test files under `vectors/`: pass them and you
 * conform. An operation with no vector is one nobody can port.
 *
 * The primitive does not know what its levels mean, and does not know what
 * the things it orders are for. No domain gets an API here — the moment one
 * domain's name lands in the primitive, every other domain inherits it.
 */

import type { Request } from './types';

export { UnitError } from './errors';
export type { UnitErrorCode } from './errors';

export { BOOLEAN, chain, order } from './order';

export {
  asBoolean,
  complexity,
  compose,
  composeState,
  conflictDebits,
  anyOf,
  missing,
  entails,
  permitAll,
  permitNone,
  state,
  statesPerDebit,
  table,
  unit,
} from './unit';

export { defect, dropTo, localise, price, slack, spectrum } from './price';

export {
  WIDTH,
  and,
  clashes,
  composePacked,
  debitsOwed,
  isConflict,
  packer,
  register,
  closure,
} from './packed';
export type { Effective, Packed, Packer, Register } from './packed';
export { METHODS, weakest } from './provenance';
export { effective, reach } from './reach';

export type {
  BoolView,
  Scale,
  Edge,
  Level,
  Localised,
  Method,
  Outcome,
  Piece,
  Priced,
  Request,
  State,
  Unit,
  Worth,
} from './types';

/**
 * Everything this surface cannot answer, and must not guess at.
 *
 * The boundary is where the numbers COME FROM, not what the scale looks
 * like. When the scale is DECLARED — a list of levels, and what each level
 * is worth — everything here is arithmetic and this library answers.
 *
 * When the scale is the data itself, its levels are groups nobody declared
 * and what they are worth has to be measured: somebody has to read the
 * records. That belongs to whatever can see them.
 */
export function declines(request: Request | null | undefined): string | null {
  if (Array.isArray(request?.groupings) && request.groupings.length > 1) {
    return 'these groupings come from data, and their price has to be measured, not computed';
  }
  const ask = request?.ask;
  if (typeof ask === 'string' && (ask.startsWith('cost') || ask === 'gain')) {
    return request?.scale === 'declared'
      ? null
      : 'a price over measured groupings needs a scan; declare the scale to get one here';
  }
  return null;
}
