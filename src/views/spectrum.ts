/**
 * The spectrum of a quantity on the lattice: which of its values are attainable at all. It answers which values can
 * occur: where an impossibility lives, and the extremal c_n that no declaration on n states exceeds.
 *
 * Which operation answers this view is read off the laws its vectors fix: the view an operation has is the view of
 * the laws that name the vectors it ran on, or of the definition it implements. An operation no law reaches keeps the
 * view it was given by hand, as drift. Nothing here is new algebra: every name is re-exported once.
 */
export { attainable, classifyValue } from '../lattice/price/attainable.ts';
export { meetBlocks } from '../lattice/price/blocks.ts';
export { c_n } from '../lattice/price/premium.ts';
export { spectrum } from '../lattice/price/quote.ts';
