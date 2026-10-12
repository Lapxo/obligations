import type {Scalar,Unmeasured} from './error-events.ts';
export type UnanimityModel=Readonly<{c:number;p:number;n:number}>;
function valid({c,p,n}:UnanimityModel):void {
  if(!Number.isFinite(c)||c<0||c>1||!Number.isFinite(p)||p<0||p>1||!Number.isSafeInteger(n)||n<2)throw new Error('REFUSE·measure invalid unanimity model');
}
function logSum(a:number,b:number):number {const high=Math.max(a,b);return high===-Infinity?high:high+Math.log(Math.exp(a-high)+Math.exp(b-high));}
/** Conditional false unanimity under the explicitly handed T1 generative model. */
export function unanimityFloor(model:UnanimityModel,k:number):Scalar {
  valid(model);if(!Number.isSafeInteger(k)||k<1)throw new Error('REFUSE·measure invalid witness count');
  const {c,p,n}=model;
  if(c===1||p===1)return {status:'measured',value:1};
  if(p===0)return {status:'measured',value:c};
  const logPrivate=Math.log1p(-c)+k*Math.log(p)+(1-k)*Math.log(n-1);
  const logA=logSum(c===0?-Infinity:Math.log(c),logPrivate),logB=Math.log1p(-c)+k*Math.log1p(-p);
  const odds=logA-logB;
  const value=odds>=0?1/(1+Math.exp(-odds)):Math.exp(odds)/(1+Math.exp(odds));
  return {status:'measured',value};
}
/** First integer k after which F is non-decreasing; checks odds in log space. */
export function unanimityThreshold(model:UnanimityModel,searchLimit:number):Scalar {
  valid(model);if(!Number.isSafeInteger(searchLimit)||searchLimit<1)throw new Error('REFUSE·measure invalid search budget');
  const {c,p,n}=model,q=p/(n-1),coefficient=1-p-q;
  if(c===1||p===0||p===1||coefficient<=0)return {status:'measured',value:1};
  if(c===0)return {status:'unmeasured',cause:'no finite nondecreasing threshold for this model'};
  const right=Math.log(p)+Math.log(c),base=Math.log(coefficient)+Math.log1p(-c)+Math.log(n-1);
  for(let k=1;k<=searchLimit;k++)if(base+k*Math.log(q)<=right)return {status:'measured',value:k};
  return {status:'unmeasured',cause:'threshold outside declared search budget'};
}
export type Descent=Readonly<{scope:string; restsOn:readonly string[]}>;
/** Count distinct proper descendants in a fully handed declared graph, never activity. */
export function descentCount(graph:readonly Descent[],cell:string):Scalar {
  const nodes=new Map<string,readonly string[]>();
  for(const node of graph){if(!node.scope||nodes.has(node.scope))throw new Error('REFUSE·measure duplicate or absent graph scope');nodes.set(node.scope,[...new Set(node.restsOn)]);}
  if(!nodes.has(cell)||[...nodes.values()].some(parents=>parents.some(parent=>!nodes.has(parent))))return {status:'unmeasured',cause:'incomplete declared descent graph'};
  const seen=new Map<string,boolean>(),visiting=new Set<string>();
  function reaches(scope:string):boolean {
    if(visiting.has(scope))throw new Error('REFUSE·measure cyclic descent at '+scope);
    if(seen.has(scope))return seen.get(scope)!;
    visiting.add(scope);let result=false;
    for(const parent of nodes.get(scope)!){const nested=reaches(parent);result=result||parent===cell||nested;}
    visiting.delete(scope);seen.set(scope,result);return result;
  }
  let count=0;for(const scope of nodes.keys())if(reaches(scope)&&scope!==cell)count++;
  return {status:'measured',value:count};
}
export const modelRequired=(measure:string):Unmeasured=>({status:'unmeasured',cause:'declared model required for '+measure});
