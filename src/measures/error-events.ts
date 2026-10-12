/** Errors are handed by a declared form predicate; labels do not establish independence. */
export type ErrorEvent = Readonly<{event:string; origin:string; error:0|1}>;
export type Unmeasured = Readonly<{status:'unmeasured'; cause:string}>;
export type ErrorMatrix = Readonly<{status:'measured'; origins:readonly string[]; events:readonly string[]; matrix:readonly (readonly number[])[]}>;
export type Covariance = ErrorMatrix;
export type Scalar = Readonly<{status:'measured'; value:number}>|Unmeasured;
export type ObservationPolicy = Readonly<{minCells:number}>;

export function errorMatrix(rows:readonly ErrorEvent[],policy:ObservationPolicy,requested?:readonly string[]):ErrorMatrix|Unmeasured {
  if(!policy||!Number.isSafeInteger(policy.minCells)||policy.minCells<2)throw new Error('REFUSE·measure invalid minimum cells');
  if(!Array.isArray(rows)||(requested!==undefined&&!Array.isArray(requested)))throw new Error('REFUSE·measure invalid event population');
  const cells=new Map<string,Map<string,number>>();
  for(const row of rows){
    if(!row||typeof row.event!=='string'||!row.event||typeof row.origin!=='string'||!row.origin||(row.error!==0&&row.error!==1))throw new Error('REFUSE·measure invalid error event');
    const at=cells.get(row.event)??new Map<string,number>();
    if(at.has(row.origin)&&at.get(row.origin)!==row.error)throw new Error('REFUSE·measure conflicting error event');
    at.set(row.origin,row.error);cells.set(row.event,at);
  }
  const origins=[...new Set(requested??rows.map(row=>row.origin))].sort();
  if(origins.some(origin=>typeof origin!=='string'||!origin))throw new Error('REFUSE·measure invalid origin');
  const events=[...cells.keys()].filter(event=>origins.some(origin=>cells.get(event)!.has(origin))).sort();
  if(events.length<policy.minCells||!origins.length)return {status:'unmeasured',cause:'insufficient observed events'};
  if(events.some(event=>origins.some(origin=>!cells.get(event)!.has(origin))))return {status:'unmeasured',cause:'incomplete shared event observations'};
  return {status:'measured',origins,events,matrix:events.map(event=>origins.map(origin=>cells.get(event)!.get(origin)!))};
}

/** Population normalization: the measured population is exactly the handed event set. */
export function covariance(reading:ErrorMatrix|Unmeasured):Covariance|Unmeasured {
  if(!reading||(reading.status!=='measured'&&reading.status!=='unmeasured'))throw new Error('REFUSE·measure invalid error matrix reading');
  if(reading.status==='unmeasured')return reading;
  if(!Array.isArray(reading.events)||!Array.isArray(reading.origins)||!Array.isArray(reading.matrix))throw new Error('REFUSE·measure invalid error matrix');
  const n=reading.events.length,m=reading.origins.length;
  if(!n||!m||reading.events.some(event=>typeof event!=='string'||!event)||reading.origins.some(origin=>typeof origin!=='string'||!origin)||
    reading.matrix.length!==n||reading.matrix.some(row=>!Array.isArray(row)||row.length!==m||row.some(x=>x!==0&&x!==1))||new Set(reading.events).size!==n||new Set(reading.origins).size!==m)throw new Error('REFUSE·measure invalid error matrix');
  const mean=reading.origins.map((_,i)=>reading.matrix.reduce((sum:number,row:readonly number[])=>sum+row[i]!,0)/n);
  const matrix=Array.from({length:m},(_,i)=>Array.from({length:m},(_,j)=>reading.matrix.reduce((sum:number,row:readonly number[])=>sum+(row[i]!-mean[i]!)*(row[j]!-mean[j]!),0)/n));
  return {...reading,matrix};
}
export const errorCovariance=(rows:readonly ErrorEvent[],policy:ObservationPolicy):Covariance|Unmeasured=>covariance(errorMatrix(rows,policy));

/** Effective rank of observed variation; zero variation identifies no dependence. */
export function participationRatio(reading:Covariance|Unmeasured):Scalar {
  if(!reading||(reading.status!=='measured'&&reading.status!=='unmeasured'))throw new Error('REFUSE·measure invalid covariance reading');
  if(reading.status==='unmeasured')return reading;
  const n=reading.origins?.length;
  if(!n||!Array.isArray(reading.matrix)||reading.matrix.length!==n||reading.matrix.some(row=>!Array.isArray(row)||row.length!==n||row.some(value=>!Number.isFinite(value))))
    throw new Error('REFUSE·measure invalid covariance matrix');
  for(let i=0;i<n;i++){
    if(reading.matrix[i]![i]!<0)throw new Error('REFUSE·measure negative covariance diagonal');
    for(let j=0;j<n;j++)if(reading.matrix[i]![j]!==reading.matrix[j]![i])throw new Error('REFUSE·measure nonsymmetric covariance');
  }
  const trace=reading.matrix.reduce((sum,row,i)=>sum+row[i]!,0);
  const square=reading.matrix.reduce((sum:number,row:readonly number[])=>sum+row.reduce((n:number,value:number)=>n+value*value,0),0);
  if(square===0)return {status:'unmeasured',cause:'zero observed variation; dependence unidentified'};
  return {status:'measured',value:trace*trace/square};
}
