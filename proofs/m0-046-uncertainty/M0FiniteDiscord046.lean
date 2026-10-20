import M0BlockCoverage046
import M0Moments046
import Obligations045.M0Coincidence
import Mathlib.Tactic.FieldSimp
open scoped BigOperators
noncomputable section
namespace Obligations046.FiniteDiscord
open Obligations046.Moments Obligations045.M0Coincidence

def discord (N k : ℕ) : ℝ := 2*(k:ℝ)*((N:ℝ)-(k:ℝ))/((N:ℝ)*((N:ℝ)-1))

theorem discord_bounds (N k : ℕ) (hN : 2 ≤ N) (hk : k ≤ N) :
    0 ≤ discord N k ∧ discord N k ≤ 1 := by
  have hN2 : (2:ℝ) ≤ N := by exact_mod_cast hN
  have hkN : (k:ℝ) ≤ N := by exact_mod_cast hk
  have hk0 : (0:ℝ) ≤ k := by positivity
  have hn0 : (0:ℝ) < N := by linarith
  have hn1 : (0:ℝ) < (N:ℝ)-1 := by linarith
  have hd : 0 < (N:ℝ)*((N:ℝ)-1) := mul_pos hn0 hn1
  unfold discord
  constructor
  · exact div_nonneg (mul_nonneg (by positivity) (sub_nonneg.mpr hkN)) (le_of_lt hd)
  · apply (div_le_one hd).mpr
    nlinarith [sq_nonneg (2*(k:ℝ)-(N:ℝ)), mul_nonneg (sub_nonneg.mpr hN2) (le_of_lt hn0)]

theorem conditional_discord_mean (q : ℝ) (N : ℕ) (hN : 2 ≤ N) :
    binExpect q N (discord N) = 2*q*(1-q) := by
  have hf : discord N = (fun k : ℕ => ((k:ℝ)*(N:ℝ)-(k:ℝ)^2)*(2/((N:ℝ)*((N:ℝ)-1)))) := by
    funext k
    unfold discord
    ring
  have hsub : binExpect q N (fun k : ℕ => (k:ℝ)*(N:ℝ)-(k:ℝ)^2) =
      binExpect q N (fun k : ℕ => (k:ℝ)*(N:ℝ))-binExpect q N (fun k : ℕ => (k:ℝ)^2) := by
    simp [binExpect, mul_sub, Finset.sum_sub_distrib]
  rw [hf, binExpect_mul_const, hsub, binExpect_mul_const, binExpect_mean, binExpect_second]
  have hN2 : (2:ℝ) ≤ N := by exact_mod_cast hN
  have hN0 : (N:ℝ) ≠ 0 := by linarith
  have hN1 : (N:ℝ)-1 ≠ 0 := by linarith
  field_simp
  ring

theorem finite_M0_discord_mean (p c : ℝ) (ws : List ℝ) (hw : ws.sum = 1)
    (N : ℕ) (hN : 2 ≤ N) :
    expect p ws (fun x => binExpect ((1-c)*p+c*x) N (discord N)) =
    2*p*(1-p)*(1-c^2*squares ws) := by
  simp_rw [conditional_discord_mean _ N hN]
  have hf : (fun x : ℝ => 2*((1-c)*p+c*x)*(1-((1-c)*p+c*x))) =
      (fun x => (-2*c^2)*x^2+(2*c*(1-2*(1-c)*p))*x+2*(1-c)*p*(1-(1-c)*p)) := by
    funext x
    ring
  rw [hf, expect_quadratic, hw]
  ring


theorem expect_mul (p : ℝ) (ws : List ℝ) (f : ℝ → ℝ) (a : ℝ) :
    expect p ws (fun x => f x*a) = expect p ws f*a := by
  induction ws generalizing f with
  | nil => rfl
  | cons w ws ih => simp only [Obligations045.M0Coincidence.expect, ih]; ring

theorem expect_sum {ι : Type*} [Fintype ι] (p : ℝ) (ws : List ℝ) (f : ι → ℝ → ℝ) :
    expect p ws (fun x => ∑ i, f i x) = ∑ i, expect p ws (f i) := by
  induction ws generalizing f with
  | nil => rfl
  | cons w ws ih =>
    simp only [Obligations045.M0Coincidence.expect, ih, Finset.mul_sum, Finset.sum_add_distrib]

theorem expect_const_one (p : ℝ) (ws : List ℝ) : expect p ws (fun _ => 1) = 1 := by
  simpa using expect_quadratic p ws 0 0 1

theorem expect_support_nonneg (p : ℝ) (hp : 0 ≤ p) (hp1 : p ≤ 1)
    (ws : List ℝ) (hw : ∀ w ∈ ws, 0 ≤ w) (f : ℝ → ℝ)
    (hf : ∀ x, 0 ≤ x → x ≤ ws.sum → 0 ≤ f x) : 0 ≤ expect p ws f := by
  induction ws generalizing f with
  | nil => exact hf 0 (by norm_num) (by simp)
  | cons w ws ih =>
    have hw0 := hw w (by simp)
    have htail : ∀ a ∈ ws, 0 ≤ a := fun a ha => hw a (by simp [ha])
    have h1 : 0 ≤ expect p ws f := ih htail f (fun x hx hxs =>
      hf x hx (by simp only [List.sum_cons]; linarith))
    have h2 : 0 ≤ expect p ws (fun x => f (w+x)) := ih htail _ (fun x hx hxs =>
      hf (w+x) (by linarith) (by simp only [List.sum_cons]; linarith))
    exact add_nonneg (mul_nonneg (by linarith) h1) (mul_nonneg hp h2)

def memberQ (p c x : ℝ) := (1-c)*p+c*x

def cellMass (p c : ℝ) (ws : List ℝ) (N : ℕ) (k : Fin (N+1)) : ℝ :=
  expect p ws (fun x => (N.choose k.val : ℝ)*(memberQ p c x)^k.val*(1-memberQ p c x)^(N-k.val))

theorem cellMass_nonneg (p c : ℝ) (hp : 0 ≤ p) (hp1 : p ≤ 1)
    (hc : 0 ≤ c) (hc1 : c ≤ 1) (ws : List ℝ) (hw : ws.sum = 1)
    (hws : ∀ w ∈ ws, 0 ≤ w) (N : ℕ) (k : Fin (N+1)) : 0 ≤ cellMass p c ws N k := by
  apply expect_support_nonneg p hp hp1 ws hws
  intro x hx hxs
  have hx1 : x ≤ 1 := by simpa only [hw] using hxs
  have hq : 0 ≤ memberQ p c x := add_nonneg (mul_nonneg (by linarith) hp) (mul_nonneg hc hx)
  have hq1 : 0 ≤ 1-memberQ p c x := by
    have h := add_nonneg (mul_nonneg (by linarith : 0 ≤ 1-c) (by linarith : 0 ≤ 1-p))
      (mul_nonneg hc (by linarith : 0 ≤ 1-x))
    unfold memberQ
    nlinarith
  exact mul_nonneg (mul_nonneg (by positivity) (pow_nonneg hq _)) (pow_nonneg hq1 _)

theorem cellMass_normalized (p c : ℝ) (ws : List ℝ) (N : ℕ) :
    (∑ k : Fin (N+1), cellMass p c ws N k) = 1 := by
  unfold cellMass
  rw [← expect_sum]
  have hf : (fun x : ℝ => ∑ k : Fin (N+1),
      (N.choose k.val : ℝ)*(memberQ p c x)^k.val*(1-memberQ p c x)^(N-k.val)) = (fun _ => 1) := by
    funext x
    rw [Fin.sum_univ_eq_sum_range (fun k : ℕ => (N.choose k:ℝ)*(memberQ p c x)^k*(1-memberQ p c x)^(N-k)) (N+1)]
    simpa only [binExpect, mul_one] using binExpect_one (memberQ p c x) N
  rw [hf, expect_const_one]

theorem cellMass_discord_mean (p c : ℝ) (ws : List ℝ) (hw : ws.sum = 1)
    (N : ℕ) (hN : 2 ≤ N) :
    (∑ k : Fin (N+1), cellMass p c ws N k*discord N k.val) =
    2*p*(1-p)*(1-c^2*squares ws) := by
  unfold cellMass
  simp_rw [← expect_mul]
  rw [← expect_sum]
  have hf : (fun x : ℝ => ∑ k : Fin (N+1),
      ((N.choose k.val : ℝ)*(memberQ p c x)^k.val*(1-memberQ p c x)^(N-k.val))*discord N k.val) =
      (fun x => binExpect ((1-c)*p+c*x) N (discord N)) := by
    funext x
    rw [Fin.sum_univ_eq_sum_range (fun k : ℕ => ((N.choose k:ℝ)*(memberQ p c x)^k*(1-memberQ p c x)^(N-k))*discord N k) (N+1)]
    rfl
  rw [hf, finite_M0_discord_mean p c ws hw N hN]

-- Actual binary M0: p=3/4,c=1/2,K=1,N=4. Pair indicators share observations.
def witnessMass (k : Fin 5) : ℚ :=
  (1/4)*(Nat.choose 4 k.val : ℚ)*(3/8)^k.val*(5/8)^(4-k.val)+
  (3/4)*(Nat.choose 4 k.val : ℚ)*(7/8)^k.val*(1/8)^(4-k.val)
def witnessScore (k : Fin 5) : ℚ := ((2*k.val*(4-k.val):ℕ):ℚ)/12

theorem witness_normalized : (∑ k : Fin 5, witnessMass k) = 1 := by
  norm_num [witnessMass, Fin.sum_univ_succ, Nat.choose]

theorem witness_mean : (∑ k : Fin 5, witnessMass k*witnessScore k) = 9/32 := by
  norm_num [witnessMass, witnessScore, Fin.sum_univ_succ, Nat.choose]

theorem witness_variance :
    (∑ k : Fin 5, witnessMass k*(witnessScore k-9/32)^2) = 157/2048 := by
  norm_num [witnessMass, witnessScore, Fin.sum_univ_succ, Nat.choose]

theorem pairs_not_iid : (157/2048:ℚ) > 1/(4*6) := by norm_num
theorem repeated_cells_not_iid : (157/2048:ℚ) > 1/(4*100) := by norm_num

theorem fixed_quota_negative : (3/8:ℚ) ≠ 21/64 := by norm_num

theorem finite_M0_tail (p c : ℝ) (hp : 0 ≤ p) (hp1 : p ≤ 1)
    (hc : 0 ≤ c) (hc1 : c ≤ 1) (ws : List ℝ) (hw : ws.sum = 1)
    (hws : ∀ w ∈ ws, 0 ≤ w) (N T : ℕ) (hN : 2 ≤ N) (hT : 0 < T)
    (eps : ℝ) (heps : 0 < eps) :
    BlockCoverage.iidSum (cellMass p c ws N) (fun k => discord N k.val) T
      (BlockCoverage.bad T (2*p*(1-p)*(1-c^2*squares ws)) eps) ≤
      min 1 (1/(4*(T:ℝ)*eps^2)) := by
  have hm : BlockCoverage.avg (cellMass p c ws N) (fun k => discord N k.val) =
      2*p*(1-p)*(1-c^2*squares ws) := cellMass_discord_mean p c ws hw N hN
  rw [← hm]
  apply BlockCoverage.clipped_block_tail
  · exact cellMass_nonneg p c hp hp1 hc hc1 ws hw hws N
  · exact cellMass_normalized p c ws N
  · intro k
    exact discord_bounds N k.val hN (Nat.lt_succ_iff.mp k.isLt)
  · exact hT
  · exact heps


theorem squares_nonneg (ws : List ℝ) : 0 ≤ squares ws := by
  exact List.sum_nonneg (fun a ha => by obtain ⟨w, _, rfl⟩ := List.mem_map.mp ha; positivity)

theorem squares_zero_sum (ws : List ℝ) (h : squares ws = 0) : ws.sum = 0 := by
  induction ws with
  | nil => rfl
  | cons w ws ih =>
    have hs : w^2+squares ws = 0 := by simpa [squares] using h
    have hw : w = 0 := by nlinarith [squares_nonneg ws, sq_nonneg w]
    have ht : squares ws = 0 := by nlinarith
    simp [hw, ih ht]

theorem squares_le_total_square (ws : List ℝ) (hws : ∀ w ∈ ws, 0 ≤ w) :
    squares ws ≤ ws.sum^2 := by
  induction ws with
  | nil => simp [squares]
  | cons w ws ih =>
    have htail : ∀ a ∈ ws, 0 ≤ a := fun a ha => hws a (by simp [ha])
    have hi := ih htail
    have hsum : 0 ≤ ws.sum := List.sum_nonneg htail
    have hw0 : 0 ≤ w := hws w (by simp)
    simp only [squares, List.map_cons, List.sum_cons]
    change w^2+squares ws ≤ (w+ws.sum)^2
    nlinarith [mul_nonneg hw0 hsum]

theorem participation_ge_one (ws : List ℝ) (hw : ws.sum = 1)
    (hws : ∀ w ∈ ws, 0 ≤ w) : 0 < squares ws ∧ 1 ≤ 1/squares ws := by
  have hp : 0 < squares ws := by
    have h0 := squares_nonneg ws
    have hn : squares ws ≠ 0 := by intro h; have hz := squares_zero_sum ws h; linarith
    exact lt_of_le_of_ne h0 (Ne.symm hn)
  have hsq := squares_le_total_square ws hws
  refine ⟨hp, ?_⟩
  apply (le_div_iff₀ hp).mpr
  rw [hw] at hsq
  nlinarith

end Obligations046.FiniteDiscord
