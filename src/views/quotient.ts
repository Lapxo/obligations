/**
 * The lattice read through a congruence: what a coarser resolution, a predicate or a reordering cannot tell apart is
 * one class. It answers what is lost and what is kept when a bound is read coarser: how many questions a body of
 * claims asks, and the coarsest reading that still moves a verdict.
 *
 * Which operation answers this view is read off the laws its vectors fix: the view an operation has is the view of
 * the laws that name the vectors it ran on, or of the definition it implements. An operation no law reaches keeps the
 * view it was given by hand, as drift. Nothing here is new algebra: every name is re-exported once.
 */
export { permutationBlind, permute } from '../debit/shuffle.ts';
export { answers, outranks, retracted, verified } from '../field/field.ts';
