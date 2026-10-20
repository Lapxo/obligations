import M0Moments046
import Mathlib.Data.Real.Sqrt
open scoped BigOperators
open Filter Topology MeasureTheory
noncomputable section
open Classical Obligations045.M0 Obligations046.Bridge Obligations046.Diagonal
namespace Obligations046.Lindeberg

/-- The exact truncated centered second moment of one Bernoulli member.
Squared cutoff is ε² times the total variance; ε>0 is required below. -/
def bernoulliTail (q cutoff : ℝ) : ℝ :=
  q*(if cutoff < (1-q)^2 then (1-q)^2 else 0) +
    (1-q)*(if cutoff < q^2 then q^2 else 0)

def ratio (M : Domain) (a : Fin M.K → Bool) (N : ℕ) (ε : ℝ) : ℝ :=
  (∑ i : Fin M.K, (allocation M.w N i:ℝ) *
    bernoulliTail (q M (a i)) (ε^2 * Obligations046.Diagonal.variance M a N)) /
      Obligations046.Diagonal.variance M a N

theorem centered_square_le_one (q : ℝ) (hq : 0 ≤ q) (hq1 : q ≤ 1) :
    q^2 ≤ 1 ∧ (1-q)^2 ≤ 1 := by constructor <;> nlinarith

theorem bernoulli_tail_zero (q cutoff : ℝ) (hq : 0 ≤ q) (hq1 : q ≤ 1)
    (hc : 1 ≤ cutoff) : bernoulliTail q cutoff = 0 := by
  have h := centered_square_le_one q hq hq1
  simp only [bernoulliTail, if_neg (not_lt.mpr (h.2.trans hc)),
    if_neg (not_lt.mpr (h.1.trans hc)), mul_zero, add_zero]

theorem cutoff_eventually_large (M : Domain) (a : Fin M.K → Bool)
    (ε : ℝ) (hε : 0 < ε) :
    ∀ᶠ N : ℕ in atTop, 1 ≤ ε^2*Obligations046.Diagonal.variance M a N := by
  have hs : 0 < ε^2 := sq_pos_of_pos hε
  have hv := (variance_atTop M a).eventually (eventually_ge_atTop (1/ε^2))
  filter_upwards [hv] with N hN
  simpa only [mul_comm] using (div_le_iff₀ hs).mp hN

theorem lindeberg_eventually_zero (M : Domain) (a : Fin M.K → Bool)
    (ε : ℝ) (hε : 0 < ε) :
    ∀ᶠ N : ℕ in atTop, ratio M a N ε = 0 := by
  filter_upwards [cutoff_eventually_large M a ε hε] with N hN
  have hz : ∀ i : Fin M.K,
      bernoulliTail (q M (a i)) (ε^2*Obligations046.Diagonal.variance M a N) = 0 :=
    fun i => bernoulli_tail_zero _ _ (q_pos M (a i)).le (q_lt_one M (a i)).le hN
  simp only [ratio, hz, mul_zero, Finset.sum_const_zero, zero_div]

theorem lindeberg_limit (M : Domain) (a : Fin M.K → Bool)
    (ε : ℝ) (hε : 0 < ε) :
    Tendsto (fun N => ratio M a N ε) atTop (𝓝 0) := by
  have he : (fun N => ratio M a N ε) =ᶠ[atTop] (fun _ => 0) :=
    lindeberg_eventually_zero M a ε hε
  exact tendsto_const_nhds.congr' he.symm

/-- Explicit two-atom expectation, to prevent treating the cutoff expression as a certificate. -/
theorem bernoulli_tail_expectation (q cutoff : ℝ) :
    (∑ b : Bool, (if b then q else 1-q) *
      (if cutoff < ((if b then (1:ℝ) else 0)-q)^2
       then ((if b then (1:ℝ) else 0)-q)^2 else 0)) = bernoulliTail q cutoff := by
  simp only [Fintype.sum_bool, Bool.false_eq_true, ite_false, zero_sub, neg_sq, ite_true,
    bernoulliTail]

theorem bernoulli_zero_cutoff (q : ℝ) (hq : 0 < q) (hq1 : q < 1) :
    bernoulliTail q 0 = q*(1-q) := by
  have h1 : 0 < (1-q)^2 := sq_pos_of_pos (by linarith)
  have h0 : 0 < q^2 := sq_pos_of_pos hq
  rw [bernoulliTail, if_pos h1, if_pos h0]
  ring

/-- Negative boundary: ε=0 gives ratio 1 at every positive sample size, not 0. -/
theorem zero_epsilon_ratio (M : Domain) (a : Fin M.K → Bool) (N : ℕ) (hN : 0 < N) :
    ratio M a N 0 = 1 := by
  have hv : 0 < Obligations046.Diagonal.variance M a N :=
    lt_of_lt_of_le (mul_pos (by exact_mod_cast hN) (variance_lower_pos M))
      (finite_variance_lower M a N)
  have hz : ∀ i : Fin M.K, bernoulliTail (q M (a i)) 0 = q M (a i)*(1-q M (a i)) :=
    fun i => bernoulli_zero_cutoff _ (q_pos M (a i)) (q_lt_one M (a i))
  simp only [ratio, zero_pow (by decide : (2:ℕ)≠0), zero_mul, hz]
  change Obligations046.Diagonal.variance M a N / Obligations046.Diagonal.variance M a N = 1
  exact div_self hv.ne'

/-- Centering at the majority threshold or at the actual probabilistic mean differs
by o(standard deviation), with the published quota rule and c<1. -/
theorem actual_mean_standardized_drift (M : Domain) (a : Fin M.K → Bool)
    (hdiag : score M a = (1:ℝ)/2) :
    Tendsto (fun N : ℕ =>
      |(∫ x, (correctCount x:ℝ) ∂(modelLaw M N a).toMeasure) - (N:ℝ)/2| /
      Real.sqrt (ProbabilityTheory.variance (fun x => (correctCount x:ℝ))
        (modelLaw M N a).toMeasure)) atTop (𝓝 0) := by
  simpa only [Obligations046.Moments.model_mean, Obligations046.Moments.model_variance,
    Real.sqrt_div (sq_nonneg _), Real.sqrt_sq_eq_abs, Real.sqrt_zero] using
      (diagonal_drift_squared_limit M a hdiag).sqrt

end Obligations046.Lindeberg
