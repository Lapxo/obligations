/**
 * A Galois connection between two orders, and the closure it induces: a form and the checks it derives, a set of
 * names and what they reach, a set of values and the laws they satisfy. It answers what is determined by what: the
 * closure of a body of claims, and the extension of a form.
 *
 * Which operation answers this view is read off the laws its vectors fix: the view an operation has is the view of
 * the laws that name the vectors it ran on, or of the definition it implements. An operation no law reaches keeps the
 * view it was given by hand, as drift. Nothing here is new algebra: every name is re-exported once.
 */
export { alphabets } from '../lattice/forms.ts';
export { relate } from '../lattice/lattice.ts';
