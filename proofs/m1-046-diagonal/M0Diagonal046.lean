import M0Bridge
import Lean.Elab.Tactic.Omega
open scoped BigOperators
open Filter Topology
noncomputable section
open Classical Obligations045.M0
namespace Obligations046.Diagonal

/-- Deterministic mean and Bernoulli variance of the declared product law.
The probabilistic CLT is not an assumption of either definition. -/
def mean (M : Domain) (a : Fin M.K → Bool) (N : ℕ) : ℝ :=
  ∑ i : Fin M.K, (allocation M.w N i : ℝ) * q M (a i)
def variance (M : Domain) (a : Fin M.K → Bool) (N : ℕ) : ℝ :=
  ∑ i : Fin M.K, (allocation M.w N i : ℝ) * (q M (a i) * (1-q M (a i)))
def varianceRate (M : Domain) (a : Fin M.K → Bool) : ℝ :=
  ∑ i : Fin M.K, M.w i * (q M (a i) * (1-q M (a i)))
def varianceLower (M : Domain) : ℝ := (1-M.c)^2 * M.p * (1-M.p)

theorem weights_fin_sum (M : Domain) : ∑ i : Fin M.K, M.w i = 1 := by
  simpa only [Fin.sum_univ_eq_sum_range] using M.weights_sum

theorem variance_lower_pos (M : Domain) : 0 < varianceLower M := by
  have hp : 0 < M.p := by linarith [M.p_half]
  unfold varianceLower
  exact mul_pos (mul_pos (sq_pos_of_pos (by linarith [M.c_lt_one])) hp)
    (by linarith [M.p_lt_one])

theorem bernoulli_variance_lower (M : Domain) (b : Bool) :
    varianceLower M ≤ q M b * (1-q M b) := by
  have hc : 0 ≤ 1-M.c := by linarith [M.c_lt_one]
  have hp : 0 ≤ M.p := by linarith [M.p_half]
  have hprod : 0 ≤ (1-M.c)*M.p := mul_nonneg hc hp
  have hprod' : 0 ≤ (1-M.c)*(1-M.p) := mul_nonneg hc (by linarith [M.p_lt_one])
  cases b <;> simp only [q, Bool.false_eq_true, ite_false, add_zero, ite_true]
  · unfold varianceLower
    nlinarith [mul_nonneg hprod M.c_nonneg]
  · unfold varianceLower
    nlinarith [mul_nonneg hprod' M.c_nonneg]

theorem variance_rate_pos (M : Domain) (a : Fin M.K → Bool) :
    0 < varianceRate M a := by
  have h : varianceLower M ≤ varianceRate M a := by
    calc
      varianceLower M = ∑ i : Fin M.K, M.w i * varianceLower M := by
        rw [← Finset.sum_mul, weights_fin_sum, one_mul]
      _ ≤ varianceRate M a := Finset.sum_le_sum (fun i _ =>
        mul_le_mul_of_nonneg_left (bernoulli_variance_lower M (a i)) (M.w_nonneg i))
  exact lt_of_lt_of_le (variance_lower_pos M) h

theorem finite_variance_lower (M : Domain) (a : Fin M.K → Bool) (N : ℕ) :
    (N:ℝ)*varianceLower M ≤ variance M a N := by
  have hsum : ∑ i : Fin M.K, (allocation M.w N i : ℝ) = (N:ℝ) := by
    exact_mod_cast (by simpa only [Fin.sum_univ_eq_sum_range] using allocation_sum M N)
  calc
    (N:ℝ)*varianceLower M = ∑ i : Fin M.K,
        (allocation M.w N i : ℝ)*varianceLower M := by rw [← Finset.sum_mul, hsum]
    _ ≤ variance M a N := Finset.sum_le_sum (fun i _ =>
      mul_le_mul_of_nonneg_left (bernoulli_variance_lower M (a i)) (by positivity))

theorem mean_rounding_bound (M : Domain) (a : Fin M.K → Bool) (N : ℕ) :
    |mean M a N - (N:ℝ)*score M a| ≤ (M.K:ℝ) := by
  have heq : mean M a N - (N:ℝ)*score M a =
      ∑ i : Fin M.K, ((allocation M.w N i : ℝ)-(N:ℝ)*M.w i)*q M (a i) := by
    simp only [mean, score, Finset.mul_sum, ← Finset.sum_sub_distrib]
    apply Finset.sum_congr rfl
    intro i _
    ring
  rw [heq]
  calc
    _ ≤ ∑ i : Fin M.K, |((allocation M.w N i : ℝ)-(N:ℝ)*M.w i)*q M (a i)| :=
      Finset.abs_sum_le_sum_abs _ _
    _ ≤ ∑ _i : Fin M.K, (1:ℝ) := by
      apply Finset.sum_le_sum
      intro i _
      rw [abs_mul, abs_of_pos (q_pos M (a i))]
      have hdis : |(allocation M.w N i : ℝ)-(N:ℝ)*M.w i| ≤ 1 :=
        abs_le.mpr ⟨le_of_lt (allocation_discrepancy M N i).1,
          le_of_lt (allocation_discrepancy M N i).2⟩
      exact (mul_le_mul_of_nonneg_right hdis (le_of_lt (q_pos M (a i)))).trans
        (by simpa using le_of_lt (q_lt_one M (a i)))
    _ = (M.K:ℝ) := by simp

theorem diagonal_mean_bound (M : Domain) (a : Fin M.K → Bool)
    (hdiag : score M a = (1:ℝ)/2) (N : ℕ) :
    |mean M a N - (N:ℝ)/2| ≤ (M.K:ℝ) := by
  simpa only [hdiag, mul_one_div] using mean_rounding_bound M a N

theorem variance_rate_limit (M : Domain) (a : Fin M.K → Bool) :
    Tendsto (fun N : ℕ => variance M a N / (N:ℝ)) atTop (𝓝 (varianceRate M a)) := by
  have h := tendsto_finset_sum Finset.univ (fun (i : Fin M.K) _ =>
    (allocation_ratio M i).mul_const (q M (a i)*(1-q M (a i))))
  convert h using 1
  funext N
  simp only [variance, Finset.sum_div, div_mul_eq_mul_div]

/-- Variance really diverges for this fixed domain, including zero-weight lineages. -/
theorem variance_atTop (M : Domain) (a : Fin M.K → Bool) :
    Tendsto (variance M a) atTop atTop := by
  apply tendsto_atTop_mono (fun N => finite_variance_lower M a N)
  exact tendsto_natCast_atTop_atTop.atTop_mul_const (variance_lower_pos M)

/-- On the diagonal the bounded quota drift is negligible compared with variance.
This is a CLT prerequisite, not a CLT or a probability-tail certificate. -/
theorem diagonal_drift_squared_limit (M : Domain) (a : Fin M.K → Bool)
    (hdiag : score M a = (1:ℝ)/2) :
    Tendsto (fun N : ℕ => (mean M a N - (N:ℝ)/2)^2 / variance M a N)
      atTop (𝓝 0) := by
  have hupper : Tendsto (fun N : ℕ => (M.K:ℝ)^2 / variance M a N)
      atTop (𝓝 0) := tendsto_const_nhds.div_atTop (variance_atTop M a)
  apply tendsto_of_tendsto_of_tendsto_of_le_of_le' tendsto_const_nhds hupper
  · filter_upwards [(variance_atTop M a).eventually (eventually_ge_atTop 1)] with N hN
    exact div_nonneg (sq_nonneg _) (by linarith)
  · filter_upwards [(variance_atTop M a).eventually (eventually_ge_atTop 1)] with N hN
    apply div_le_div_of_nonneg_right _ (by linarith)
    have habs := diagonal_mean_bound M a hdiag N
    nlinarith [sq_abs (mean M a N - (N:ℝ)/2), abs_nonneg (mean M a N - (N:ℝ)/2)]

open Obligations046.Bridge

def complement {ι : Type*} [Fintype ι] {n : ι → ℕ} (x : World n) : World n :=
  fun i => (x i)ᶜ

theorem complement_involutive {ι : Type*} [Fintype ι] {n : ι → ℕ} (x : World n) :
    complement (complement x) = x := by funext i; simp [complement]

theorem unbiased_mass_complement (n : ℕ) (x : Finset (Fin n)) :
    mass (1/2 : ℝ) xᶜ = mass (1/2 : ℝ) x := by
  have hx : x.card ≤ n := by simpa using x.card_le_univ
  simp only [mass, Finset.card_compl, Fintype.card_fin]
  norm_num
  rw [Nat.sub_sub_self hx, mul_comm]

theorem unbiased_joint_complement {ι : Type*} [Fintype ι] (n : ι → ℕ)
    (x : World n) :
    jointMass n (fun _ => (1/2 : ℝ)) (complement x) =
      jointMass n (fun _ => (1/2 : ℝ)) x := by
  apply Finset.prod_congr rfl
  intro i _
  exact unbiased_mass_complement (n i) (x i)

theorem count_complement (M : Domain) (N : ℕ) (x : World (sizes M N)) :
    correctCount (complement x) + correctCount x = N := by
  have hsum : ∑ i : Fin M.K, sizes M N i = N := by
    simpa only [Fin.sum_univ_eq_sum_range] using allocation_sum M N
  unfold correctCount
  rw [← Finset.sum_add_distrib]
  convert hsum using 1
  apply Finset.sum_congr rfl
  intro i _
  simp only [complement, Finset.card_compl, Fintype.card_fin]
  exact Nat.sub_add_cancel (by simpa using (x i).card_le_univ)

theorem fair_loss_reflection (b d N : ℕ) (h : b+d=N) :
    fairLoss b N + fairLoss d N = 1 := by
  unfold fairLoss
  split_ifs <;> norm_num <;> omega

/-- Genuine diagonal subdomain, exact for every N (even N=0).
It is not asserted for arbitrary diagonal scores with unequal q_i. -/
theorem unbiased_conditional_exact (M : Domain) (a : Fin M.K → Bool)
    (hunbiased : ∀ i, q M (a i) = (1:ℝ)/2) (N : ℕ) :
    conditionalError M N a = (1:ℝ)/2 := by
  let f : World (sizes M N) → ℝ := fun x =>
    jointMass (sizes M N) (fun _ => (1/2:ℝ)) x * fairLoss (correctCount x) N
  have hrep : conditionalError M N a = ∑ x, f x := by
    rw [← conditional_error_representation, modelLaw, memberLaw_expectation]
    simp only [f, hunbiased]
  have hsym : ∑ x, f (complement x) = ∑ x, f x :=
    Fintype.sum_bijective complement
      ⟨fun x y h => by simpa only [complement_involutive] using congrArg complement h,
       fun x => ⟨complement x, complement_involutive x⟩⟩ _ _ (fun _ => rfl)
  have hpair : ∀ x, f (complement x) + f x =
      jointMass (sizes M N) (fun _ => (1/2:ℝ)) x := by
    intro x
    simp only [f, unbiased_joint_complement, ← mul_add]
    rw [fair_loss_reflection _ _ _ (count_complement M N x), mul_one]
  have htotal : (∑ x, f (complement x)) + (∑ x, f x) = 1 := by
    rw [← Finset.sum_add_distrib]
    simp only [hpair]
    exact jointMass_sum _ _
  rw [hrep]
  linarith

theorem floor_limit_diag_unbiased (M : Domain) (a : Fin M.K → Bool)
    (hunbiased : ∀ i, q M (a i) = (1:ℝ)/2) :
    Tendsto (fun N => conditionalError M N a) atTop (𝓝 ((1:ℝ)/2)) := by
  simpa only [unbiased_conditional_exact M a hunbiased] using
    (tendsto_const_nhds : Tendsto (fun _ : ℕ => (1:ℝ)/2) atTop (𝓝 ((1:ℝ)/2)))

/-- c=1 lies outside Domain: cumulative-floor quotas alone do not preserve ties.
With two equal-weight deterministic lineages (false,true), odd sizes favor true. -/
theorem deterministic_quota_even (m : ℕ) :
    fairLoss ((2*m) - (2*m)/2) (2*m) = (1:ℝ)/2 := by
  have h : (2*m)/2 = m := by omega
  rw [h]
  have hsub : 2*m-m = m := by omega
  rw [hsub]
  simp [fairLoss, Nat.not_lt.mpr (le_refl (2*m))]

theorem deterministic_quota_odd (m : ℕ) :
    fairLoss ((2*m+1) - (2*m+1)/2) (2*m+1) = 0 := by
  have h : (2*m+1)/2 = m := by omega
  rw [h]
  have hl : ¬ 2*(2*m+1-m) < 2*m+1 := by omega
  have he : ¬ 2*(2*m+1-m) = 2*m+1 := by omega
  simp only [fairLoss, if_neg hl, if_neg he]

/-- A legal heterogeneous diagonal; score=1/2 does not imply every q_i=1/2. -/
def heterogeneous : Domain where
  K := 2
  K_pos := by norm_num
  p := 3/4
  c := 1/2
  p_half := by norm_num
  p_lt_one := by norm_num
  c_nonneg := by norm_num
  c_lt_one := by norm_num
  w := fun i => if i=0 then 3/4 else if i=1 then 1/4 else 0
  w_nonneg := by intro i; split_ifs <;> norm_num
  weights_sum := by norm_num [Finset.sum_range_succ]

def heterogeneousA : Fin 2 → Bool := fun i => i.val == 1

theorem heterogeneous_diagonal : score heterogeneous heterogeneousA = (1:ℝ)/2 := by
  change (∑ i : Fin 2, (if (i:ℕ)=0 then (3:ℝ)/4 else if (i:ℕ)=1 then 1/4 else 0) *
    ((1-(1:ℝ)/2)*(3/4) + if (i:ℕ)==1 then (1:ℝ)/2 else 0)) = 1/2
  norm_num [Fin.sum_univ_succ]

theorem heterogeneous_not_unbiased :
    ¬ (∀ i, q heterogeneous (heterogeneousA i) = (1:ℝ)/2) := by
  intro h
  have h0 := h ⟨0, by norm_num [heterogeneous]⟩
  norm_num [q, heterogeneous, heterogeneousA] at h0

end Obligations046.Diagonal
