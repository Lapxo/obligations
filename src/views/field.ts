/**
 * The lattice laid over coordinates: every bound is held somewhere, at a resolution and an epoch, by origins. It
 * answers where a bound is held and by whom: what met there, whether the origins agree, what the present is, and what
 * a replay of everything that landed folds to.
 *
 * Which operation answers this view is read off the laws its vectors fix: the view an operation has is the view of
 * the laws that name the vectors it ran on, or of the definition it implements. An operation no law reaches keeps the
 * view it was given by hand, as drift. Nothing here is new algebra: every name is re-exported once.
 */
export { foldIn, witnessesIn } from '../debit/debit.ts';
export { disagree, latest, meetAt, origins, potential, turned } from '../field/encounter.ts';
export { contracts, coordinate, covers, exclusive, key, passes, point, region, resolution, within } from '../field/field.ts';
export { converge, endsBeforeNow, present } from '../field/present.ts';
export { amplitude, coherence, fringes, interfere, phase, seenAs } from './field/wave.ts';
export type { Claim } from './field/wave.ts';
export { cell, encounter, join, meet, observe, refine, sign } from '../lattice/obligatory.ts';
export type { Obligatory } from '../lattice/obligatory.ts';
export { budget, decohere, disturbance, distinct, evolve, sameObject } from './field/physics.ts';
export { choose, play } from './field/policy.ts';
export { selfFold } from './field/self.ts';
export type { Weights } from './field/policy.ts';
