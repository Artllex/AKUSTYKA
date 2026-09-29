import test from 'node:test';
import assert from 'node:assert/strict';
import {constrainedLeanPoint} from './src/listener-panel.js';
test('Ctrl lean keeps the other axis fixed including the circular movement boundary',()=>{
 const anchor={x:0.4,y:0.6};
 for(const axis of ['horizontal','vertical'])for(const point of [{x:0.5,y:0.3},{x:5,y:5},{x:-5,y:-5}]){
  const result=constrainedLeanPoint(anchor,point,axis);
  assert.equal(axis==='horizontal'?result.y:result.x,axis==='horizontal'?anchor.y:anchor.x);
  assert.ok(Math.hypot(result.x,result.y)<=1+1e-12);
 }
 assert.deepEqual(constrainedLeanPoint(anchor,{x:0.5,y:0.3},'horizontal'),{x:0.5,y:0.6});
 assert.deepEqual(constrainedLeanPoint(anchor,{x:0.5,y:0.3},'vertical'),{x:0.4,y:0.3});
});
import {setupListenerPanel} from './src/listener-panel.js';
test('Ctrl drag locks dominant axis until release; Escape restores initial pose',()=>{
 const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,{type:'number',handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},getBoundingClientRect(){return {left:0,top:0,width:220,height:220};},setPointerCapture(){this.captured=true;},hasPointerCapture(){return this.captured;},releasePointerCapture(){this.captured=false;},focus(){}});return nodes.get(id);};
 const previous=globalThis.document;globalThis.document={getElementById:get};
 try{
  let record={leanSide:4,leanForward:10.5},commits=0;
  setupListenerPanel({read:()=>record,preview:patch=>Object.assign(record,patch),commit:()=>commits++,cancel:start=>{record=start;}});
  const pad=get('lean-pad'),event=(x,y,ctrl=true)=>({button:0,pointerId:1,clientX:x,clientY:y,ctrlKey:ctrl});
  pad.handlers.pointerdown(event(126.4,85.4));assert.equal(record.leanForward,10.5);assert.equal(record.leanSide,4);
  pad.handlers.pointermove(event(150,83));assert.equal(record.leanForward,10.5);assert.ok(record.leanSide>4);
  pad.handlers.pointermove(event(151,40));assert.equal(record.leanForward,10.5);
  pad.handlers.pointerup(event(151,40));assert.equal(commits,1);
  const start={...record};pad.handlers.pointerdown(event(151,40));pad.handlers.pointermove(event(152,20));assert.equal(record.leanSide,start.leanSide);
  pad.handlers.keydown({key:'Escape',preventDefault(){}});assert.deepEqual(record,start);assert.equal(commits,1);
 }finally{globalThis.document=previous;}
});
