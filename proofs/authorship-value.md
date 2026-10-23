# Authorship value: the full-support lemma

Written conditional law. The common-function factorization has its separate kernel statement; the entropy/common-part corollary remains bibliographic and is not declared Lean formalized. Admission is resolved by the instrument. Domain: finite random variables, binary truth Y, and a deterministic projection K=kappa(X). For the public API X is a named binary vector and kappa is its sum. Entropies use base 2 and positive-probability support.

## Hypothesis

For every x with P(X=x)>0, both P(Y=0|X=x)>0 and P(Y=1|X=x)>0. This does not require every possible x to have positive mass.

## Claim and proof

Let G=X meet (Y,K) be the maximal deterministic common function under the information order. K is a function of both X and (Y,K), so is a common function. For any common function W=a(X)=b(Y,K), fix a positive-mass k. Every positive-mass x in its fiber has both truth values in support, hence a(x)=b(0,k)=b(1,k). Thus W is constant on each K fiber and is a function of K, almost surely. Maximality gives G informationally equivalent to K and H(G|K)=0.

Since K is deterministic from X, I(X;(Y,K))=H(K)+I(X;Y|K). Definition 2.4 therefore gives RI_H(X,(Y,K))=I(X;(Y,K))-H(G)=I(X;Y|K)=V. H satisfies Definition 2.6; Theorem 2.8 identifies RI_H with the premium g_H. QED.

The source is Two-Sided Constraints on a Valued Lattice v1.0.0, DOI 10.5281/zenodo.21858428, Remark 1.1, Definitions 2.4/2.6 and Theorem 2.8. Reviewed PDF SHA-256: 69dcbd6fec21a85125659ac719ca178754daa524f4a060349b724360c3b30653.

## Fixed positive vector

X is uniform on 00,01,10,11; K=X1+X2. P(Y=1|X)=(1/2,1/4,3/4,1/2). The (Y=0,Y=1) masses are (1/8,1/8), (3/16,1/16), (1/16,3/16), (1/8,1/8). Both truth values occur at every x. H(Y|K)=1 and H(Y|X)=(1+h2(1/4))/2. Therefore V=RI_H=(1-h2(1/4))/2>0 bits.

## Fixed counterexample outside the hypothesis

Keep X and K but set Y=X1. Positive atoms (00,0),(01,0),(10,1),(11,1) each have mass 1/4. (Y,K) reconstructs X, so G is equivalent to X. Then H(G|K)=1/2 bit and V=1/2 bit, but RI_H=0. This refutes the extension without the support condition, not the lemma.

Zero support does not always break the equality. In general RI_H=V-H(G|K); the public API leaves its identification with V open as authorship-value/support-with-zeros when the sufficient support condition is absent. The 168 zero-support patterns reported under T8 from T1 remain reported evidence; no campaign file or execution is verified here.

## Implementation and formalization boundaries

The public function reuses marginalInformation and, transitively, mixProjectionLoss and exact rational masses. It computes V, not a second entropy engine or a general common-part graph. Exact positivity certifies the support condition; binary64 entropy does not certify exact numerical zero. The mathematical equivalence V=0 iff Y is conditionally independent of X given K remains unchanged; exchangeability is not necessary.

Optional Lean formalization is step 5, pending feasibility. No new axiom, experiment, author merge, admission or authority follows from this reading.
