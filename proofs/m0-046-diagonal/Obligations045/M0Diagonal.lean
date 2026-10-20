import Obligations045.ConsensusGrid
set_option maxRecDepth 10000
set_option maxHeartbeats 8000000
namespace Obligations045.Diagonal
/-- Finite diagonal vector only: K=1,p=3/4,c=1/3,w=[1].
    A=false gives q=1/2, A=true gives q=5/6.
    No general CLT or diagonal-limit theorem is declared in this file. -/
def loss2 (b N : Nat) : Nat := if 2*b < N then 2 else if 2*b == N then 1 else 0
def unbiasedNumerator (N : Nat) : Nat :=
  ((List.range (N+1)).map (fun b => Obligations045.binom N b * loss2 b N)).sum
def cases : List Nat := [1,2,3,4,5,6,7,8,9,10,11,12]
theorem unbiased_diagonal_vector : ∀ N ∈ cases, unbiasedNumerator N = 2^N := by decide
-- Total error numerator has denominator 8*6^N; the target floor is 1/8.
def errorNumerator (N : Nat) : Nat :=
  6^N+3*((List.range (N+1)).map (fun b =>
    Obligations045.binom N b * 5^b * loss2 b N)).sum
#eval cases.map (fun N => (N,errorNumerator N,8*6^N))
end Obligations045.Diagonal
