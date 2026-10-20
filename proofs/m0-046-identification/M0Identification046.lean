import Obligations045.M0Coincidence
import Mathlib.Tactic.Linarith
import Mathlib.Tactic.FieldSimp
import Mathlib.Tactic.Positivity

noncomputable section
namespace Obligations046.M0Identification
open Obligations045.M0Coincidence

def powers (ws : List ℝ) (k : ℕ) : ℝ := (ws.map (fun w => w^k)).sum

def m1 (p : ℝ) (ws : List ℝ) := p*ws.sum
def m2 (p : ℝ) (ws : List ℝ) := p^2*ws.sum^2+p*(1-p)*powers ws 2
def m3 (p : ℝ) (ws : List ℝ) := p^3*ws.sum^3+3*p^2*(1-p)*ws.sum*powers ws 2+p*(1-p)*(1-2*p)*powers ws 3
def m4 (p : ℝ) (ws : List ℝ) := p^4*ws.sum^4+6*p^3*(1-p)*ws.sum^2*powers ws 2+3*(p*(1-p))^2*(powers ws 2)^2+4*p^2*(1-p)*(1-2*p)*ws.sum*powers ws 3+p*(1-p)*(1-6*p*(1-p))*powers ws 4

theorem expect_quartic (p : ℝ) (ws : List ℝ) (a b d e f : ℝ) :
    expect p ws (fun x => a*x^4+b*x^3+d*x^2+e*x+f) =
    a*m4 p ws+b*m3 p ws+d*m2 p ws+e*m1 p ws+f := by
  induction ws generalizing a b d e f with
  | nil => simp [expect, m1, m2, m3, m4, powers]
  | cons w ws ih =>
    have hf : (fun x : ℝ => a*(w+x)^4+b*(w+x)^3+d*(w+x)^2+e*(w+x)+f) =
        (fun x => a*x^4+(4*a*w+b)*x^3+(6*a*w^2+3*b*w+d)*x^2+
          (4*a*w^3+3*b*w^2+2*d*w+e)*x+(a*w^4+b*w^3+d*w^2+e*w+f)) := by
      funext x
      ring
    simp only [expect, hf]
    rw [ih, ih]
    simp only [m1, m2, m3, m4, List.sum_cons, powers, List.map_cons]
    ring

def r2 (p B : ℝ) := p^2+(1-p)^2+2*p*(1-p)*B
def r4 (p B C E : ℝ) := p^4+(1-p)^4+6*(p^2+(1-p)^2)*p*(1-p)*B-
    4*p*(1-p)*(1-2*p)^2*C+6*(p*(1-p))^2*B^2+2*p*(1-p)*(1-6*p*(1-p))*E

theorem fourth_coincidence (p c : ℝ) (ws : List ℝ) (hw : ws.sum = 1) :
    expect p ws (fun x => ((1-c)*p+c*x)^4+(1-((1-c)*p+c*x))^4) =
    r4 p (c^2*powers ws 2) (c^3*powers ws 3) (c^4*powers ws 4) := by
  have hf : (fun x : ℝ => ((1-c)*p+c*x)^4+(1-((1-c)*p+c*x))^4) =
      (fun x => (2*c^4)*x^4+(4*c^3*(2*(1-c)*p-1))*x^3+
       (6*c^2*(((1-c)*p)^2+(1-(1-c)*p)^2))*x^2+
       (4*c*(((1-c)*p)^3-(1-(1-c)*p)^3))*x+
       (((1-c)*p)^4+(1-(1-c)*p)^4)) := by
    funext x
    ring
  rw [hf, expect_quartic]
  simp only [m1, m2, m3, m4, hw, r4]
  ring

def uniformR4 (p B x : ℝ) := r4 p B (B*x) (B*x^2)

theorem uniform_fourth_strict (p B x y : ℝ) (hp : 0 < p) (hp1 : p < 1)
    (hB : 0 < B) (hx : 0 < x) (hy : x < y) (hy1 : y ≤ 1) :
    uniformR4 p B y < uniformR4 p B x := by
  have ha : 0 < p*(1-p) := mul_pos hp (sub_pos.mpr hp1)
  have hs : 0 < x+y := by linarith
  have hs2 : x+y ≤ 2 := by linarith
  have hd : 0 ≤ (1-2*p)^2 := sq_nonneg _
  have hn : (1-6*p*(1-p))*(x+y)-2*(1-2*p)^2 < 0 := by
    by_cases h : 0 ≤ 1-6*p*(1-p)
    · have hh := mul_le_mul_of_nonneg_left hs2 h
      nlinarith [sq_nonneg (1-2*p)]
    · have hh : (1-6*p*(1-p))*(x+y) < 0 := mul_neg_of_neg_of_pos (lt_of_not_ge h) hs
      nlinarith
  have hf : uniformR4 p B y-uniformR4 p B x =
      2*p*(1-p)*B*(y-x)*((1-6*p*(1-p))*(x+y)-2*(1-2*p)^2) := by
    unfold uniformR4 r4
    ring
  have hp1' : 0 < 1-p := sub_pos.mpr hp1
  have hgap : 0 < y-x := sub_pos.mpr hy
  have hpos : 0 < 2*p*(1-p)*B*(y-x) := by positivity
  have := mul_neg_of_pos_of_neg hpos hn
  linarith

theorem uniform_pair_fourth_injective (p B₁ B₂ x₁ x₂ : ℝ)
    (hp : 0 < p) (hp1 : p < 1) (hB₁ : 0 < B₁) (hB₂ : 0 < B₂)
    (hx₁ : 0 < x₁) (hx₂ : 0 < x₂) (hx₁1 : x₁ ≤ 1) (hx₂1 : x₂ ≤ 1)
    (h2 : r2 p B₁ = r2 p B₂)
    (h4 : uniformR4 p B₁ x₁ = uniformR4 p B₂ x₂) : B₁ = B₂ ∧ x₁ = x₂ := by
  have ha : 0 < p*(1-p) := mul_pos hp (sub_pos.mpr hp1)
  have hB : B₁ = B₂ := by unfold r2 at h2; nlinarith
  subst B₂
  refine ⟨rfl, ?_⟩
  rcases lt_trichotomy x₁ x₂ with h|h|h
  · have := uniform_fourth_strict p B₁ x₁ x₂ hp hp1 hB₁ hx₁ h hx₂1
    linarith
  · exact h
  · have := uniform_fourth_strict p B₁ x₂ x₁ hp hp1 hB₁ hx₂ h hx₁1
    linarith

-- Recovery is algebraic only after the explicitly uniform moment model has been justified.
theorem recover_uniform_parameters (B x c K : ℝ) (hx : x ≠ 0)
    (hB : B = c*x) (hK : c = K*x) : c = B/x ∧ K = B/x^2 := by
  constructor
  · apply (eq_div_iff hx).mpr
    nlinarith
  · apply (eq_div_iff (pow_ne_zero 2 hx)).mpr
    nlinarith [hB, congrArg (fun t : ℝ => t*x) hK]

theorem uniform_cK_injective (p c₁ c₂ K₁ K₂ : ℝ)
    (hp : 0 < p) (hp1 : p < 1) (hc₁ : 0 < c₁) (hc₂ : 0 < c₂)
    (hc₁1 : c₁ ≤ 1) (hc₂1 : c₂ ≤ 1) (hK₁ : 1 ≤ K₁) (hK₂ : 1 ≤ K₂)
    (h2 : r2 p (c₁^2/K₁) = r2 p (c₂^2/K₂))
    (h4 : r4 p (c₁^2/K₁) (c₁^3/K₁^2) (c₁^4/K₁^3) =
          r4 p (c₂^2/K₂) (c₂^3/K₂^2) (c₂^4/K₂^3)) : c₁ = c₂ ∧ K₁ = K₂ := by
  have hK₁0 : 0 < K₁ := by linarith
  have hK₂0 : 0 < K₂ := by linarith
  have hf (c K : ℝ) : r4 p (c^2/K) (c^3/K^2) (c^4/K^3) =
      uniformR4 p (c^2/K) (c/K) := by simp only [uniformR4, r4]; ring
  rw [hf, hf] at h4
  have h := uniform_pair_fourth_injective p (c₁^2/K₁) (c₂^2/K₂) (c₁/K₁) (c₂/K₂)
    hp hp1 (by positivity) (by positivity) (by positivity) (by positivity)
    ((div_le_one hK₁0).mpr (by linarith)) ((div_le_one hK₂0).mpr (by linarith)) h2 h4
  have rec (c K : ℝ) (hc : 0 < c) (hK : 0 < K) :
      c = (c^2/K)/(c/K) ∧ K = (c^2/K)/(c/K)^2 := by
    have hb : c^2/K = c*(c/K) := by ring
    have hk : c = K*(c/K) := by field_simp [ne_of_gt hK]
    exact recover_uniform_parameters (c^2/K) (c/K) c K (ne_of_gt (div_pos hc hK)) hb hk
  have h₁ := rec c₁ K₁ hc₁ hK₁0
  have h₂ := rec c₂ K₂ hc₂ hK₂0
  constructor
  · rw [h₁.1, h₂.1, h.1, h.2]
  · rw [h₁.2, h₂.2, h.1, h.2]

def weightsA : List ℝ := List.replicate 36 (1/42) ++ List.replicate 3 (1/21)
def weightsB : List ℝ := List.replicate 48 (1/96) ++ List.replicate 16 (1/32)

theorem nonuniform_normalized : weightsA.sum = 1 ∧ weightsB.sum = 1 := by
  norm_num [weightsA, weightsB, List.sum_replicate]

theorem nonuniform_power_collision :
    (7/10:ℝ)^2*powers weightsA 2 = (4/5:ℝ)^2*powers weightsB 2 ∧
    (7/10:ℝ)^3*powers weightsA 3 = (4/5:ℝ)^3*powers weightsB 3 ∧
    (7/10:ℝ)^4*powers weightsA 4 = (4/5:ℝ)^4*powers weightsB 4 := by
  norm_num [powers, weightsA, weightsB, List.sum_replicate]

theorem nonuniform_same_pair_fourth (p : ℝ) :
    r2 p ((7/10)^2*powers weightsA 2) = r2 p ((4/5)^2*powers weightsB 2) ∧
    r4 p ((7/10)^2*powers weightsA 2) ((7/10)^3*powers weightsA 3) ((7/10)^4*powers weightsA 4) =
    r4 p ((4/5)^2*powers weightsB 2) ((4/5)^3*powers weightsB 3) ((4/5)^4*powers weightsB 4) := by
  obtain ⟨h2,h3,h4⟩ := nonuniform_power_collision
  exact ⟨congrArg (r2 p) h2, by rw [h2,h3,h4]⟩

theorem nonuniform_distinct_parameters :
    (7/10:ℝ) ≠ 4/5 ∧ (1:ℝ)/powers weightsA 2 = 147/4 ∧
    (1:ℝ)/powers weightsB 2 = 48 := by
  norm_num [powers, weightsA, weightsB, List.sum_replicate]

-- Population expectations themselves coincide, not just invented summaries.
theorem nonuniform_actual_fourth_collision (p : ℝ) :
    expect p weightsA (fun x => ((1-(7/10))*p+(7/10)*x)^4+(1-((1-(7/10))*p+(7/10)*x))^4) =
    expect p weightsB (fun x => ((1-(4/5))*p+(4/5)*x)^4+(1-((1-(4/5))*p+(4/5)*x))^4) := by
  rw [fourth_coincidence p (7/10) weightsA nonuniform_normalized.1,
      fourth_coincidence p (4/5) weightsB nonuniform_normalized.2]
  exact (nonuniform_same_pair_fourth p).2


def uniformWeights (n : ℕ) : List ℝ := List.replicate n (1/(n:ℝ))

theorem uniform_normalized (n : ℕ) (hn : 0 < n) : (uniformWeights n).sum = 1 := by
  have hn0 : (n:ℝ) ≠ 0 := by exact_mod_cast (Nat.ne_of_gt hn)
  simp [uniformWeights, List.sum_replicate, hn0]

theorem uniform_powers (n k : ℕ) : powers (uniformWeights n) k = (n:ℝ)*(1/(n:ℝ))^k := by
  simp [powers, uniformWeights, List.sum_replicate]

theorem uniform_population_pair (p c : ℝ) (n : ℕ) (hn : 0 < n) :
    expect p (uniformWeights n) (fun x => ((1-c)*p+c*x)^2+(1-((1-c)*p+c*x))^2) =
    r2 p (c^2/(n:ℝ)) := by
  rw [pair_coincidence p c (uniformWeights n) (uniform_normalized n hn)]
  change p^2+(1-p)^2+2*c^2*p*(1-p)*powers (uniformWeights n) 2 = _
  rw [uniform_powers]
  unfold r2
  have hn0 : (n:ℝ) ≠ 0 := by exact_mod_cast (Nat.ne_of_gt hn)
  field_simp
  ring

theorem uniform_population_fourth (p c : ℝ) (n : ℕ) (hn : 0 < n) :
    expect p (uniformWeights n) (fun x => ((1-c)*p+c*x)^4+(1-((1-c)*p+c*x))^4) =
    r4 p (c^2/(n:ℝ)) (c^3/(n:ℝ)^2) (c^4/(n:ℝ)^3) := by
  rw [fourth_coincidence p c (uniformWeights n) (uniform_normalized n hn)]
  rw [uniform_powers, uniform_powers, uniform_powers]
  have hn0 : (n:ℝ) ≠ 0 := by exact_mod_cast (Nat.ne_of_gt hn)
  congr 1 <;> field_simp <;> ring


theorem uniform_population_identification (p c₁ c₂ : ℝ) (n₁ n₂ : ℕ)
    (hp : 0 < p) (hp1 : p < 1) (hc₁ : 0 < c₁) (hc₂ : 0 < c₂)
    (hc₁1 : c₁ ≤ 1) (hc₂1 : c₂ ≤ 1) (hn₁ : 0 < n₁) (hn₂ : 0 < n₂)
    (h2 : expect p (uniformWeights n₁) (fun x => ((1-c₁)*p+c₁*x)^2+(1-((1-c₁)*p+c₁*x))^2) =
          expect p (uniformWeights n₂) (fun x => ((1-c₂)*p+c₂*x)^2+(1-((1-c₂)*p+c₂*x))^2))
    (h4 : expect p (uniformWeights n₁) (fun x => ((1-c₁)*p+c₁*x)^4+(1-((1-c₁)*p+c₁*x))^4) =
          expect p (uniformWeights n₂) (fun x => ((1-c₂)*p+c₂*x)^4+(1-((1-c₂)*p+c₂*x))^4)) :
    c₁ = c₂ ∧ n₁ = n₂ := by
  rw [uniform_population_pair p c₁ n₁ hn₁, uniform_population_pair p c₂ n₂ hn₂] at h2
  rw [uniform_population_fourth p c₁ n₁ hn₁, uniform_population_fourth p c₂ n₂ hn₂] at h4
  have h := uniform_cK_injective p c₁ c₂ (n₁:ℝ) (n₂:ℝ) hp hp1 hc₁ hc₂ hc₁1 hc₂1
    (by exact_mod_cast hn₁) (by exact_mod_cast hn₂) h2 h4
  exact ⟨h.1, by exact_mod_cast h.2⟩

theorem unknown_p_alias (p : ℝ) : r2 p 1 = 1 ∧ r4 p 1 1 1 = 1 := by
  constructor <;> simp only [r2, r4] <;> ring

theorem zero_c_alias (p : ℝ) : r2 p 0 = p^2+(1-p)^2 ∧
    r4 p 0 0 0 = p^4+(1-p)^4 := by
  constructor <;> simp only [r2, r4] <;> ring

end Obligations046.M0Identification
