import {sub,mul,div,one,zero,type Q} from './rational.ts';
/** Shared exact row reduction. Callers validate matrices and budget their own domains.
 * Mutates only the caller-owned working matrix; never the supplied model. */
export function reduceExact(matrix:Q[][],columns:number){
 const rows=matrix.length;
 const transform=matrix.map((_,i)=>matrix.map((__,j)=>i===j?one:zero));
 let rank=0;const pivots:number[]=[];
 for(let column=0;column<columns;column++){
  const pivot=matrix.findIndex((row,i)=>i>=rank&&row[column]![0]!==0n);if(pivot<0)continue;
  [matrix[rank],matrix[pivot]]=[matrix[pivot]!,matrix[rank]!];[transform[rank],transform[pivot]]=[transform[pivot]!,transform[rank]!];
  const divisor=matrix[rank]![column]!;matrix[rank]=matrix[rank]!.map(v=>div(v,divisor));transform[rank]=transform[rank]!.map(v=>div(v,divisor));
  for(let i=0;i<rows;i++)if(i!==rank){const amount=matrix[i]![column]!;matrix[i]=matrix[i]!.map((v,j)=>sub(v,mul(amount,matrix[rank]![j]!)));transform[i]=transform[i]!.map((v,j)=>sub(v,mul(amount,transform[rank]![j]!)));}
  pivots.push(column);rank++;
 }
 return {rank,pivots,transform};
}
