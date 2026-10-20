import Mathlib.Data.Real.Basic
import Mathlib.Tactic.Ring
namespace Obligations045.M0Coincidence
/-- Exact expectation over independent Bernoulli(p) latent lineages.
    The recurrence keeps both branches and their actual probabilities. -/
def expect (p : ℝ) : List ℝ → (ℝ → ℝ) → ℝ
  | [], f => f 0
  | w :: ws, f => (1-p)*expect p ws f + p*expect p ws (fun x => f (w+x))
def squares (ws : List ℝ) : ℝ := (ws.map (fun w => w^2)).sum

theorem expect_quadratic (p : ℝ) (ws : List ℝ) (a b d : ℝ) :
    expect p ws (fun x => a*x^2+b*x+d) =
    a*(p^2*ws.sum^2+p*(1-p)*squares ws)+b*p*ws.sum+d := by
  induction ws generalizing a b d with
  | nil => simp [expect, squares]
  | cons w ws ih =>
    have hf : (fun x : ℝ => a*(w+x)^2+b*(w+x)+d) =
        (fun x => a*x^2+(2*a*w+b)*x+(a*w^2+b*w+d)) := by
      funext x
      ring
    simp only [expect, hf]
    rw [ih, ih]
    simp only [List.sum_cons, squares, List.map_cons]
    ring

theorem pair_coincidence (p c : ℝ) (ws : List ℝ) (hw : ws.sum = 1) :
    expect p ws (fun x => ((1-c)*p+c*x)^2+(1-((1-c)*p+c*x))^2) =
    p^2+(1-p)^2+2*c^2*p*(1-p)*squares ws := by
  have hf : (fun x : ℝ => ((1-c)*p+c*x)^2+(1-((1-c)*p+c*x))^2) =
      (fun x => (2*c^2)*x^2+(2*c*(2*(1-c)*p-1))*x+
        (((1-c)*p)^2+(1-(1-c)*p)^2)) := by
    funext x
    ring
  rw [hf, expect_quadratic, hw]
  ring

theorem triple_redundant (q : ℝ) :
    q^3+(1-q)^3 = (3*(q^2+(1-q)^2)-1)/2 := by ring
end Obligations045.M0Coincidence
