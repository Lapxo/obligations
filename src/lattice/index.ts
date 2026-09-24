/**
 * The algebra entire, three theories in one library: the lattice (two-sided constraints with a price), the debit (states
 * on a scale) and the field (points with epoch and origins). Every operation is here for any consumer; a consumer that
 * wants one part asks for its subpath.
 */
export { UnitError } from './errors.ts';
export type { UnitErrorCode } from './errors.ts';

export { BOOLEAN, chain, height, isDistributive, order } from './order.ts';

export { asBoolean, bitLoss, compose, composeState, fuse, widen, conflictDebits, anyOf, missing, entails, permitAll, state, statesPerDebit, table, unit } from '../debit/unit.ts';

export { WIDTH, and, or, canonical } from '../debit/packed.ts';
export type { Packed, Packer } from '../debit/packed.ts';

export { WideMask, chunkCount } from '../debit/masks.ts';

export { rebuild, register } from '../debit/register.ts';
export type { Register } from '../debit/register.ts';

export { DANGEROUS, STATES, dangerous, moved, quadrants, runQuadrants, sizes, stateAt, transitions } from '../debit/vector.ts';
export type { Matrix, Quadrants, Run, Span } from '../debit/vector.ts';

export { METHODS, weakest } from '../debit/provenance.ts';

export { touches, holds } from '../debit/standing.ts';

export { declaration, asUnit, conj, disj } from './declaration.ts';
export type { Declaration } from './declaration.ts';

export { relate } from './lattice.ts';
export type { Poset, MeetSemilattice, JoinSemilattice, Lattice, Relation } from './lattice.ts';
export { intervals, alphabets } from './forms.ts';
export type { Interval, Alphabet } from './forms.ts';
export { foldIn, witnessesIn } from '../debit/debit.ts';
export { foldSigned } from '../field/signatures.ts';
export { size, sufficientResolution } from '../field/field.ts';
export { present, converge, endsBeforeNow } from '../field/present.ts';
export { yieldOf } from '../field/yield.ts';
export type { Act, Yield } from '../field/yield.ts';
export { frontier } from '../field/frontier.ts';
export type { Asked, Open } from '../field/frontier.ts';
export { declarationOf, unitOf, stateOf, registerOf, premiumOf, degenerate, withdrawsExactly, movesOf } from '../field/motion.ts';
export {
  violationsIn, meetViolationsIn, posetViolationsIn, closureViolationsIn,
  LATTICE_LAW_NAMES, POSET_LAW_NAMES, MEET_LAW_NAMES, JOIN_LAW_NAMES, BOTH_LAW_NAMES,
  CLOSURE_LAW_NAMES,
} from './axioms.ts';
export type { LatticeLawName } from './axioms.ts';

export { fromScale, subsets } from './scale-lattice.ts';
export { downset, freedom, fromIdeals, idealComplexity, idealDebit, idealEntails, idealJoin, idealMeet, isDownset, isIdealPair, isUpset, unitToIdeal, upset } from '../debit/ideal.ts';
export type { IdealDebit } from '../debit/ideal.ts';

export { FORM_IMPLEMENTATIONS, FORMS, ladderForm, alphabetForm, continuousForm, latticeForm } from './forms.ts';
export type { Form, FormCount } from './forms.ts';

export { buildGraph, reachIds } from '../debit/graph.ts';
export type { Graph } from '../debit/graph.ts';

export { isMonotone, vacuityOf } from './vacuity.ts';
export type { Verdict, VacuityOptions } from './vacuity.ts';

export { permute, permutationBlind, unitStream } from '../debit/shuffle.ts';

export type {
  BoolView,
  Scale,
  Edge,
  Level,
  Method,
  MeasureForm,
  DebitOutcome,
  State,
  Unit,
} from './types.ts';
export { answers, coarsen, coordinate, contracts, covers, exclusive, foldRegion, key, outranks, passes, point, region, resolution, retracted, verified, within } from '../field/field.ts';
export { disagree, latest, meetAt, origins, potential, turned } from '../field/encounter.ts';
export type { Fold, Point, Region, Sighting } from '../field/field.ts';
export { replay } from '../replay.ts';
