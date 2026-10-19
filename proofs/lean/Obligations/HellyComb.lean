/- Finite nonconvex subsets, using only Lean's kernel and core lists.
   No change to the interval theorem T38 or to the algebra's representation. -/
namespace Obligations.HellyComb

def a : List Nat := [0, 1]
def b : List Nat := [1, 2]
def c : List Nat := [0, 2]
def inter (s t : List Nat) : List Nat := s.filter (fun x => t.contains x)
def triple : List Nat := inter (inter a b) c

theorem pairwise_nonempty :
    inter a b = [1] ∧ inter a c = [0] ∧ inter b c = [2] := by decide

theorem triple_empty : triple = [] := by decide

theorem c_has_a_hole : c.contains 0 = true ∧ c.contains 2 = true ∧
    c.contains 1 = false := by decide

end Obligations.HellyComb
