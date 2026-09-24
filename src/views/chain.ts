/**
 * The lattice as a chain, or read along its chains: resolution is chain length. It answers how finely a cell is
 * resolved and how it moves along its scale: its state among the four, how two units compose, and the runs and
 * transitions of a vector of them.
 *
 * Which operation answers this view is read off the laws its vectors fix: the view an operation has is the view of
 * the laws that name the vectors it ran on, or of the definition it implements. An operation no law reaches keeps the
 * view it was given by hand, as drift. Nothing here is new algebra: every name is re-exported once.
 */
export { downset, freedom, unitToIdeal, upset } from '../debit/ideal.ts';
export { weakest } from '../debit/provenance.ts';
export { anyOf, missing } from '../debit/unit-span.ts';
export { composeState, conflictDebits, entails, unit } from '../debit/unit.ts';
export { coarsen, foldRegion, size, sufficientResolution } from '../field/field.ts';
