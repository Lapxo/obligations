import M0Bridge
namespace Obligations046.BridgeTests

def atoms : List (ℚ × ℚ × ℚ × ℚ) :=
  [(0,0,0,1/16),(0,1,1,3/16),(1,0,1,3/16),(1,1,0,3/16),(1,1,1,6/16)]
def expect (f : ℚ → ℚ → ℚ → ℚ) : ℚ :=
  (atoms.map (fun (a,b,c,w) => w*f a b c)).sum

/-- A normalized binary distribution with Bernoulli(3/4) pairwise marginals,
    but not the jointly independent word law. Exact arithmetic, not simulation. -/
theorem pairwise_not_joint :
    expect (fun _ _ _ => 1) = 1 ∧
    expect (fun a _ _ => a) = 3/4 ∧
    expect (fun _ b _ => b) = 3/4 ∧
    expect (fun _ _ c => c) = 3/4 ∧
    expect (fun a b _ => a*b) = 9/16 ∧
    expect (fun a _ c => a*c) = 9/16 ∧
    expect (fun _ b c => b*c) = 9/16 ∧
    expect (fun a b c => (1-a)*(1-b)*(1-c)) = 1/16 ∧
    expect (fun a b c => (1-a)*(1-b)*(1-c)) ≠ (1/4:ℚ)^3 := by
  norm_num [expect, atoms]

end Obligations046.BridgeTests
