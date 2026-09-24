/**
 * A pair of ideals: the upset of what a cell requires and the downset of what it permits. It answers what a cell
 * requires and permits, what two claims hold together, what a declaration decomposes into, and how much freedom is
 * left between its two poles, in bits.
 *
 * Which operation answers this view is read off the laws its vectors fix: the view an operation has is the view of
 * the laws that name the vectors it ran on, or of the definition it implements. An operation no law reaches keeps the
 * view it was given by hand, as drift. Nothing here is new algebra: every name is re-exported once.
 */
export { fromIdeals, idealComplexity, idealDebit, idealEntails, idealJoin, idealMeet, isDownset, isIdealPair, isUpset, unitComplexity } from '../debit/ideal.ts';
export { packer } from '../debit/packed.ts';
export { rebuild, register } from '../debit/register.ts';
export { holds, touches } from '../debit/standing.ts';
export { complexity, statesPerDebit } from '../debit/unit-span.ts';
export { permitAll, state, table, widen } from '../debit/unit.ts';
export { dangerous, moved, transitions } from '../debit/vector-move.ts';
export { quadrants, runQuadrants, stateAt } from '../debit/vector.ts';
export { closureViolationsIn } from '../lattice/axioms.ts';
export { isDistributive } from '../lattice/order.ts';
