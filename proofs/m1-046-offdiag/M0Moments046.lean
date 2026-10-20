import M0Diagonal046
import Mathlib.Probability.Variance
open scoped BigOperators
open Filter Topology MeasureTheory
noncomputable section
open Classical Obligations045.M0 Obligations046.Bridge Obligations046.Diagonal
namespace Obligations046.Moments

/-- Finite binomial expectation; no asymptotic certificate. -/
def binExpect (p : ℝ) (n : ℕ) (f : ℕ → ℝ) : ℝ :=
  ∑ k ∈ Finset.range (n+1), (n.choose k : ℝ)*p^k*(1-p)^(n-k)*f k

theorem binExpect_one (p : ℝ) (n : ℕ) : binExpect p n (fun _ => 1) = 1 := by
  unfold binExpect
  simp only [mul_one]
  calc
    _ = (p+(1-p))^n := by
      rw [add_pow]
      apply Finset.sum_congr rfl
      intro k _
      ring
    _ = 1 := by simp

theorem binExpect_succ (p : ℝ) (n : ℕ) (f : ℕ → ℝ) :
    binExpect p (n+1) f =
      (1-p)*binExpect p n f + p*binExpect p n (fun k => f (k+1)) := by
  have h := Finset.sum_choose_succ_mul (fun k j => p^k*(1-p)^j*f k) n
  unfold binExpect
  simp only [Nat.add_assoc] at h ⊢
  calc
    _ = (∑ k ∈ Finset.range (n+1), (n.choose k:ℝ)*(p^k*(1-p)^(n+1-k)*f k)) +
        ∑ k ∈ Finset.range (n+1), (n.choose k:ℝ)*(p^(k+1)*(1-p)^(n-k)*f (k+1)) := by
      convert h using 1
      apply Finset.sum_congr rfl
      intro k _
      ring
    _ = _ := by
      rw [Finset.mul_sum, Finset.mul_sum]
      congr 1
      · apply Finset.sum_congr rfl
        intro k hk
        have hk' : k ≤ n := by simpa only [Finset.mem_range, Nat.lt_succ_iff] using hk
        rw [show n+1-k = (n-k)+1 by omega, pow_succ]
        ring
      · apply Finset.sum_congr rfl
        intro k _
        rw [pow_succ]
        ring

theorem binExpect_add (p : ℝ) (n : ℕ) (f g : ℕ → ℝ) :
    binExpect p n (fun k => f k+g k) = binExpect p n f + binExpect p n g := by
  simp [binExpect, mul_add, Finset.sum_add_distrib]

theorem binExpect_mul_const (p : ℝ) (n : ℕ) (f : ℕ → ℝ) (r : ℝ) :
    binExpect p n (fun k => f k*r) = binExpect p n f*r := by
  simp only [binExpect, ← mul_assoc, Finset.sum_mul]

theorem binExpect_const (p r : ℝ) (n : ℕ) : binExpect p n (fun _ => r) = r := by
  simpa only [one_mul, binExpect_one] using binExpect_mul_const p n (fun _ => 1) r

theorem binExpect_mean (p : ℝ) (n : ℕ) : binExpect p n (fun k => (k:ℝ)) = (n:ℝ)*p := by
  induction n with
  | zero => simp [binExpect]
  | succ n ih =>
    rw [binExpect_succ]
    have hshift : binExpect p n (fun k => ((k+1:ℕ):ℝ)) = (n:ℝ)*p+1 := by
      simp only [Nat.cast_add, Nat.cast_one]
      rw [binExpect_add, ih, binExpect_const]
    rw [hshift, ih]
    push_cast
    ring

theorem binExpect_second (p : ℝ) (n : ℕ) :
    binExpect p n (fun k => (k:ℝ)^2) = (n:ℝ)*p*(1-p)+((n:ℝ)*p)^2 := by
  induction n with
  | zero => simp [binExpect]
  | succ n ih =>
    rw [binExpect_succ, ih]
    have heq : (fun k : ℕ => ((k+1:ℕ):ℝ)^2) =
        (fun k : ℕ => ((k:ℝ)^2 + (k:ℝ)*2) + 1) := by funext k; push_cast; ring
    rw [heq, binExpect_add, binExpect_add, binExpect_mul_const,
      binExpect_mean, binExpect_const, ih]
    push_cast
    ring

/-- Finite pushforward of a scalar observable, without an asserted moment. -/
theorem finite_pushforward {S T : Type*} [Fintype S] [Fintype T] [DecidableEq T]
    (m : S → ℝ) (c : S → T) (f : T → ℝ) :
    (∑ x, m x*f (c x)) = ∑ y, (∑ x, if c x=y then m x else 0)*f y := by
  symm
  simp_rw [Finset.sum_mul]
  rw [Finset.sum_comm]
  apply Finset.sum_congr rfl
  intro x _
  simp_rw [ite_mul, zero_mul]
  simp

theorem mass_card_expect (p : ℝ) (n : ℕ) (f : ℕ → ℝ) :
    (∑ x : Finset (Fin n), mass p x*f x.card) = binExpect p n f := by
  calc
    _ = ∑ k : Fin (n+1), binMass p n k*f k := by
      simpa only [count_fiber_mass] using
        finite_pushforward (mass p) (@count n) (fun k => f (k:ℕ))
    _ = binExpect p n f := by
      simp only [binMass, binExpect]
      exact Fin.sum_univ_eq_sum_range
        (fun k : ℕ => (n.choose k:ℝ)*p^k*(1-p)^(n-k)*f k) (n+1)

section ProductMoments
variable {ι : Type*} [Fintype ι] [DecidableEq ι]
    {S : ι → Type*} [∀ i, Fintype (S i)]

def expect (m : ∀ i, S i → ℝ) (f : (∀ i, S i) → ℝ) : ℝ :=
  ∑ x, (∏ i, m i (x i))*f x

theorem expect_product (m : ∀ i, S i → ℝ) (f : ∀ i, S i → ℝ) :
    expect m (fun x => ∏ i, f i (x i)) = ∏ i, ∑ s, m i s*f i s := by
  simp only [expect, ← Finset.prod_mul_distrib, Fintype.prod_sum]

theorem expect_coordinate (m : ∀ i, S i → ℝ) (hm : ∀ i, ∑ s, m i s = 1)
    (f : ∀ i, S i → ℝ) (j : ι) :
    expect m (fun x => f j (x j)) = ∑ s, m j s*f j s := by
  calc
    _ = expect m (fun x => ∏ i, if i=j then f i (x i) else 1) := by simp
    _ = ∏ i, ∑ s, m i s * (if i=j then f i s else 1) := expect_product m (fun i s => if i=j then f i s else 1)
    _ = ∏ i, if i=j then (∑ s, m i s*f i s) else 1 := by
      apply Finset.prod_congr rfl
      intro i _
      by_cases h : i=j <;> simp [h, hm]
    _ = _ := by simp

theorem expect_sum {κ : Type*} [Fintype κ] (m : ∀ i, S i → ℝ)
    (f : κ → (∀ i, S i) → ℝ) :
    expect m (fun x => ∑ j, f j x) = ∑ j, expect m (f j) := by
  simp only [expect, Finset.mul_sum]
  rw [Finset.sum_comm]

theorem expect_cross_centered (m : ∀ i, S i → ℝ)
    (f : ∀ i, S i → ℝ) (hf : ∀ i, ∑ s, m i s*f i s = 0)
    (i j : ι) (hne : i≠j) :
    expect m (fun x => f i (x i)*f j (x j)) = 0 := by
  calc
    _ = expect m (fun x => ∏ k, if k=i then f k (x k) else if k=j then f k (x k) else 1) := by
      congr 1
      funext x
      rw [Finset.prod_eq_mul_prod_diff_singleton (Finset.mem_univ i)]
      simp only [ite_true]
      congr 1
      symm
      calc
        _ = ∏ k ∈ Finset.univ \ {i}, if k=j then f k (x k) else 1 := by
          apply Finset.prod_congr rfl
          intro k hk
          have hki : k≠i := by simpa using (Finset.mem_sdiff.mp hk).2
          simp only [if_neg hki]
        _ = f j (x j) := by simp [Finset.prod_ite_eq', Ne.symm hne]
    _ = ∏ k, ∑ s, m k s*(if k=i then f k s else if k=j then f k s else 1) :=
      expect_product m (fun k s => if k=i then f k s else if k=j then f k s else 1)
    _ = 0 := Finset.prod_eq_zero (Finset.mem_univ i) (by simpa using hf i)

theorem expect_centered_square (m : ∀ i, S i → ℝ)
    (hm : ∀ i, ∑ s, m i s = 1)
    (f : ∀ i, S i → ℝ) (hf : ∀ i, ∑ s, m i s*f i s = 0) :
    expect m (fun x => (∑ i, f i (x i))^2) =
      ∑ i, ∑ s, m i s*(f i s)^2 := by
  simp_rw [pow_two, Fintype.sum_mul_sum, expect_sum]
  apply Finset.sum_congr rfl
  intro i _
  have hc : ∀ j, expect m (fun x => f i (x i)*f j (x j)) =
      if j=i then (∑ s, m i s*(f i s*f i s)) else 0 := by
    intro j
    by_cases h : j=i
    · subst j
      simp only [ite_true]
      exact expect_coordinate m hm (fun k s => f k s*f k s) i
    · rw [if_neg h]
      exact expect_cross_centered m f hf i j (Ne.symm h)
  simp_rw [hc]
  simp

end ProductMoments

theorem mass_card_mean (p : ℝ) (n : ℕ) :
    (∑ x : Finset (Fin n), mass p x*(x.card:ℝ)) = (n:ℝ)*p := by
  rw [mass_card_expect, binExpect_mean]

theorem mass_card_second (p : ℝ) (n : ℕ) :
    (∑ x : Finset (Fin n), mass p x*(x.card:ℝ)^2) =
      (n:ℝ)*p*(1-p)+((n:ℝ)*p)^2 := by
  calc
    _ = binExpect p n (fun k => (k:ℝ)^2) := mass_card_expect _ _ _
    _ = _ := binExpect_second p n

theorem mass_centered_mean (p : ℝ) (n : ℕ) :
    (∑ x : Finset (Fin n), mass p x*((x.card:ℝ)-(n:ℝ)*p)) = 0 := by
  simp only [mul_sub, Finset.sum_sub_distrib, ← Finset.sum_mul]
  rw [mass_card_mean, mass_sum]
  ring

theorem mass_centered_second (p : ℝ) (n : ℕ) :
    (∑ x : Finset (Fin n), mass p x*((x.card:ℝ)-(n:ℝ)*p)^2) =
      (n:ℝ)*p*(1-p) := by
  calc
    _ = (∑ x : Finset (Fin n), mass p x*(x.card:ℝ)^2) -
        (∑ x : Finset (Fin n), mass p x*(x.card:ℝ))*(2*((n:ℝ)*p)) +
        (∑ x : Finset (Fin n), mass p x)*((n:ℝ)*p)^2 := by
      rw [Finset.sum_mul, Finset.sum_mul, ← Finset.sum_sub_distrib, ← Finset.sum_add_distrib]
      apply Finset.sum_congr rfl
      intro x _
      ring
    _ = _ := by rw [mass_card_second, mass_card_mean, mass_sum]; ring

section ActualMoments
variable {ι : Type*} [Fintype ι] [DecidableEq ι]

theorem member_total_mean (n : ι → ℕ) (p : ι → ℝ)
    (hp : ∀ i, 0 ≤ p i) (hp1 : ∀ i, p i ≤ 1) :
    (∫ x, (correctCount x:ℝ) ∂(memberLaw n p hp hp1).toMeasure) =
      ∑ i, (n i:ℝ)*p i := by
  rw [memberLaw_expectation]
  change expect (fun i => mass (p i)) (fun x => (correctCount x:ℝ)) = _
  have he : (fun x : World n => (correctCount x:ℝ)) =
      (fun x => ∑ i, ((x i).card:ℝ)) := by funext x; simp [correctCount]
  rw [he, expect_sum]
  apply Finset.sum_congr rfl
  intro i _
  rw [expect_coordinate _ (fun j => mass_sum (p j) (n j))
      (fun j (s : Finset (Fin (n j))) => (s.card:ℝ)), mass_card_mean]

theorem member_total_centered_second (n : ι → ℕ) (p : ι → ℝ)
    (hp : ∀ i, 0 ≤ p i) (hp1 : ∀ i, p i ≤ 1) :
    (∫ x, ((correctCount x:ℝ) - ∑ i, (n i:ℝ)*p i)^2
      ∂(memberLaw n p hp hp1).toMeasure) =
      ∑ i, (n i:ℝ)*p i*(1-p i) := by
  rw [memberLaw_expectation]
  change expect (fun i => mass (p i))
    (fun x => ((correctCount x:ℝ) - ∑ i, (n i:ℝ)*p i)^2) = _
  have he : (fun x : World n => ((correctCount x:ℝ) - ∑ i, (n i:ℝ)*p i)^2) =
      (fun x => (∑ i, (((x i).card:ℝ)-(n i:ℝ)*p i))^2) := by
    funext x
    simp only [correctCount, Nat.cast_sum, Finset.sum_sub_distrib]
  rw [he, expect_centered_square _ (fun j => mass_sum (p j) (n j))
    (fun j (s : Finset (Fin (n j))) => (s.card:ℝ)-(n j:ℝ)*p j)
    (fun j => mass_centered_mean (p j) (n j))]
  apply Finset.sum_congr rfl
  intro i _
  exact mass_centered_second (p i) (n i)

end ActualMoments

theorem model_mean (M : Domain) (a : Fin M.K → Bool) (N : ℕ) :
    (∫ x, (correctCount x:ℝ) ∂(modelLaw M N a).toMeasure) = mean M a N := by
  exact member_total_mean _ _ _ _

theorem model_centered_second (M : Domain) (a : Fin M.K → Bool) (N : ℕ) :
    (∫ x, ((correctCount x:ℝ)-mean M a N)^2 ∂(modelLaw M N a).toMeasure) =
      Obligations046.Diagonal.variance M a N := by
  simpa only [mean, Obligations046.Diagonal.variance, mul_assoc] using
    member_total_centered_second (sizes M N) (fun i => q M (a i))
      (fun i => (q_pos M (a i)).le) (fun i => (q_lt_one M (a i)).le)

theorem model_variance (M : Domain) (a : Fin M.K → Bool) (N : ℕ) :
    ProbabilityTheory.variance (fun x => (correctCount x:ℝ)) (modelLaw M N a).toMeasure =
      Obligations046.Diagonal.variance M a N := by
  rw [ProbabilityTheory.variance_eq_integral (measurable_of_finite _).aemeasurable,
    model_mean]
  exact model_centered_second M a N

/-- The asymptotic variance statements now refer to the actual admitted probability law. -/
theorem model_variance_rate_limit (M : Domain) (a : Fin M.K → Bool) :
    Tendsto (fun N : ℕ =>
      ProbabilityTheory.variance (fun x => (correctCount x:ℝ)) (modelLaw M N a).toMeasure /
        (N:ℝ)) atTop (𝓝 (varianceRate M a)) := by
  simpa only [model_variance] using variance_rate_limit M a

theorem model_variance_atTop (M : Domain) (a : Fin M.K → Bool) :
    Tendsto (fun N : ℕ =>
      ProbabilityTheory.variance (fun x => (correctCount x:ℝ)) (modelLaw M N a).toMeasure)
      atTop atTop := by
  simpa only [model_variance] using variance_atTop M a

/-- Counterexample to replacing the joint product law by matching individual marginals.
Two perfectly correlated Bernoulli(3/4) members have variance 3/4, not 3/8. -/
theorem correlated_pair_second :
    (∑ b : Bool, (if b then (3:ℝ)/4 else 1/4)*
      ((if b then (2:ℝ) else 0)-3/2)^2) = 3/4 := by
  norm_num [Fintype.sum_bool]

theorem correlated_pair_not_independent_variance :
    (∑ b : Bool, (if b then (3:ℝ)/4 else 1/4)*
      ((if b then (2:ℝ) else 0)-3/2)^2) ≠ 2*((3:ℝ)/4)*(1-3/4) := by
  rw [correlated_pair_second]
  norm_num

end Obligations046.Moments
