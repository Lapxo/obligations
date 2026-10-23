# Declared finite linear influence identities

For the declared finite synchronous family, complete mixing has drift -Cov_n(alpha,x); constant alpha preserves the mean. Homogeneous transport has drift a Cov_n(W^T 1,x), not generally a covariance with degree. Correlation size requires an explicit covariance law and a nonzero denominator.

With a declared nonnegative normalized left-stationary vector of W, homogeneous alpha also preserves the weighted mean.

Declared conditions:
- n>=1; rational finite vectors in executable cases
- Row-stochastic W; alpha in [0,1]^n; zero noise; linear coordinates
- The homogeneous transport identity additionally requires constant alpha
- K_corr uses the declared covariance, not keys, Kish, accuracy or causal independence

a constraint evaluatorary: T2 is excluded. Finite identities are kernel-checked over rationals; no general real convergence or stochastic covariance theorem is claimed by the finite cases.

Evidence status: Lean identities plus exact finite vectors; covariance evolution derivation separated from its scalar normalization. T2 remains pending approval.
