/**
 * A product of lattices: a region of many cells is the product of their scales, and a meet splits into blocks that do
 * not interact. It answers how a region decomposes: what can be read cell by cell, packed side by side, and priced
 * block by block.
 *
 * Which operation answers this view is read off the laws its vectors fix: the view an operation has is the view of
 * the laws that name the vectors it ran on, or of the definition it implements. An operation no law reaches keeps the
 * view it was given by hand, as drift. Nothing here is new algebra: every name is re-exported once.
 */
export { buildGraph, reachIds } from '../debit/graph.ts';
export { or } from '../debit/packed.ts';
export { compose, fuse } from '../debit/unit.ts';
export { continuousForm, intervals, ladderForm } from '../lattice/forms.ts';
export { fromScale } from '../lattice/scale-lattice.ts';
export { area, centre, density, hull, outliers, steady, vertices, width } from './product/polygon.ts';
export type { Vertex } from './product/polygon.ts';
export { pour, red, stretch, tense, tighter } from './product/mould.ts';
export type { Lock } from './product/mould.ts';
export { agreements, residual, sufficient } from './product/resolution.ts';
export { curvature, distance, entangled, grow, horizon, neighbours, reach, resting, tunnel } from './product/reach.ts';
export { apart, design, horizonTotal, lone, loom, rank, sited } from './product/design.ts';
