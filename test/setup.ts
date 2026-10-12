import {deepStrictEqual,notDeepStrictEqual} from 'node:assert/strict';
import {test} from 'node:test';
// A negative sample pays by differing from its explicit proposed answer.
Object.assign(globalThis,{test,compare(actual:unknown,expected:unknown,about?:unknown):boolean {
 const no=about!==null&&typeof about==='object'&&(about as Record<string,unknown>)['expected.ok']===false;
 const message=typeof about==='string'?about:JSON.stringify(about);
 (no?notDeepStrictEqual:deepStrictEqual)(actual,expected,message);
 return true;
}});
