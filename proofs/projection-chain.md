# Finite chain derivation (text; not a Lean certificate)

Fix one finite distribution mu on X. Put nu(y)=sum_{f(x)=y} mu(x), xi(z)=sum_{g(y)=z} nu(y). Restrict summands to mu(x)>0; the containing nu and xi are then positive. All logarithms have base2.

For each such x, log(xi(g(f(x)))/mu(x)) = log(nu(f(x))/mu(x)) + log(xi(g(f(x)))/nu(f(x))). Multiply by mu(x) and sum. The left sum is H(X|Z), the first right sum H(X|Y). Regroup the last sum by f(x)=y: its coefficient is exactly nu(y), so it is H(Y|Z). Empty/zero-mass fibers contribute0. Each term is nonnegative since its fiber mass is at least its atom mass. A loss is0 iff each positive-mass fiber contains at most one positive-mass atom.

This proves the stated identity as an ordinary finite-sum derivation under the declared model. The captured vector below is classified only as bounded enumeration, not as a general Lean theorem. This is the standard deterministic conditional-entropy chain identity, not a new information-theoretic law.

Outside the chain: X=(a,b) uniform independent bits, Y=a, Z=b. H(X|Z)=1, H(X|Y)=1, H(Y|Z)=1; 1 != 2. The same prior does not rescue two arbitrary projections. Changing the prior between links invalidates regrouping. Randomized maps are outside this deterministic contract.

No algebraic admissibility condition, wire change, protocol act or destroyed field is introduced.
