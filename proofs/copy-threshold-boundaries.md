# Copy thresholds: what is proved and what remains conditional

The Lean file proves the gap identity, the positive-gap equivalence and threshold range over rationals. It also checks the fair-two-vote polynomial and the p=3/4 three-vote value. The endpoint vectors are complete finite product Bernoulli tables with named weights and fair ties; no stochastic sampling is executed.

For the binary M0 decoder under its declared conditional joint product law, each observed correctness probability is at least (1-c)*p. When g=2*(1-c)*p-1>0, Hoeffding's bounded independent-sum inequality, conditional on the latent configuration, gives P(mean<=1/2 | configuration)<=exp(-N*g^2/2). Averaging over the declared latent law preserves the upper bound; the lower bound on each success probability does not depend on K or its allocation weights. This is a conditional concentration derivation. A complete kernel proof of the concentration and its generator bridge is still open; the gap algebra alone does not supply it. Pairwise marginals or shared draws do not establish the required joint law.

At c=1 and equal positive replication of each lineage, fair majority is a function of K named Bernoulli votes with their declared joint product law. Summing by number of correct votes gives P(B<K/2)+P(B=K/2)/2. In particular K=2,p=3/4 gives 1/4, not 1/16: omitting half the tie mass changes the decoder. K=3 gives 5/32 with equal weights, while weights (3/4,1/8,1/8) make the first vote decisive and give 1/4. The finite cases do not extend old c<1 limit theorems to c=1.

The existing off-diagonal, generator bridge and conditional diagonal contracts remain unchanged and are referenced by digest in the coverage vector. The majority floor example is not a theorem about the optimal blind decoder. Generic optimal-blind limits, full uniform Lean concentration, the price of blindness and monotonicity of the decoder gap remain open.

## Count saturation is a different assertion

Atp=3/4,c=1/2,K=1, the two latent conditional success rates are3/8 and7/8. For truth0 the corresponding report rates are1/8 and5/8. All four rates differ, so a declared nearest-rate decoder can distinguish the two truth sets as empirical frequency concentrates; this uses a conditional joint Bernoulli law and a concentration theorem, not a conclusion from c* alone. A complete general kernel argument remains open. The fixedN1/N3 vector checks the narrower finite refutation above threshold: the exact truth1 count law atN3 is(4,9,18,33)/64 and truth0 reverses it; count MAP error is13/64<1/4. Majority, count MAP and a generic optimal blind decoder are never substituted for one another.

The received initial threshold criterion n=801/tolerance0.02 and its later exploratory n<=12801 result are both retained as received evidence, not recomputed or silently merged into a law.
