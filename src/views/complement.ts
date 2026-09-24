/**
 * Complements: where the lattice is distributive every demand has one, and on the Boolean part of a scale truth is
 * functional. It answers what can be taken back exactly (a withdrawal loses nothing only where demands have
 * complements) and where a clash is a plain contradiction.
 *
 * Which operation answers this view is read off the laws its vectors fix: the view an operation has is the view of
 * the laws that name the vectors it ran on, or of the definition it implements. An operation no law reaches keeps the
 * view it was given by hand, as drift. Nothing here is new algebra: every name is re-exported once.
 */
export { and, canonical, opinion } from '../debit/packed.ts';
export { asBoolean, bitLoss } from '../debit/unit.ts';
