/**
 * The dual order: the lattice read upside down, where a ceiling is a floor and a limit a demand. It answers what the
 * permitted side says on its own: the states per limit, the limits owed, the clashes read from above, and how two
 * states relate read either way.
 *
 * Which operation answers this view is read off the laws its vectors fix: the view an operation has is the view of
 * the laws that name the vectors it ran on, or of the definition it implements. An operation no law reaches keeps the
 * view it was given by hand, as drift. Nothing here is new algebra: every name is re-exported once.
 */
export {};
