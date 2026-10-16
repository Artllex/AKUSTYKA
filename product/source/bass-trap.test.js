import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument} from './src/model.js';
import {parseRoomDocument} from './src/bench.js';
import {bassTrapPlacement,LEFT_FRONT_LEG,normalizeBassTraps} from './src/bass-trap-model.js';
import {createBassTrapView} from './src/bass-trap-view.js';
import {acousticSurfaceCategory} from './src/acoustic-simulation.js';

const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} ≠ ${expected}`);

test('front-left traps are stacked, each with a 50 cm room-facing diagonal',()=>{
 const document=createDocument(),records=document.bassTraps.filter(trap=>trap.corner==='front-left');
 assert.equal(records.length,2);
 const [lower,upper]=records.map(record=>bassTrapPlacement(record,document.room));
 close(lower.bottom,0);close(lower.top,1);close(upper.bottom,1);close(upper.top,2);
 for(const trap of [lower,upper]){
  close(trap.leg,Math.sqrt(.5*.5/2));
  assert.deepEqual(trap.triangle[0],[0,0]);
  assert.deepEqual(trap.triangle[1],[LEFT_FRONT_LEG,0]);
  assert.deepEqual(trap.triangle[2],[0,LEFT_FRONT_LEG]);
  close(Math.hypot(trap.diagonal[0][0]-trap.diagonal[1][0],trap.diagonal[0][1]-trap.diagonal[1][1]),.5);
  const view=createBassTrapView(records[trap===lower?0:1],document.room);
  const diagonal=view.group.getObjectByName('fabric-diagonal');
  const normal=new THREE.Vector3().fromBufferAttribute(diagonal.geometry.attributes.normal,0);
  assert.ok(normal.x>0&&normal.z>0,'hypotenuse must face the room');
  const bounds=new THREE.Box3().setFromObject(view.group);
  close(bounds.min.x,0);close(bounds.max.x,LEFT_FRONT_LEG);
  close(bounds.min.z,0);close(bounds.max.z,LEFT_FRONT_LEG);
  close(bounds.min.y,trap.bottom);close(bounds.max.y,trap.top);
  view.dispose();
 }
 assert.ok(upper.top<document.room.height);
});

test('trap arrangement persists and old documents receive the default arrangement',()=>{
 const document=createDocument();
 assert.equal(document.bassTraps.length,5);
 assert.equal(parseRoomDocument(JSON.stringify(document)).bassTraps.length,5);
 delete document.bassTraps;
 assert.equal(parseRoomDocument(JSON.stringify(document)).bassTraps.length,5);
 assert.throws(()=>normalizeBassTraps([{...createDocument().bassTraps[0],bottom:2}],document.room,document.roomFeatures));
});

test('rear-right trap stacks directly above the old one and migrates saved rooms',()=>{
 const document=createDocument(),records=document.bassTraps.filter(trap=>trap.corner==='rear-right');
 assert.equal(records.length,2);
 const [lower,upper]=records.map(record=>bassTrapPlacement(record,document.room));
 close(lower.bottom,0);close(lower.top,1);close(upper.bottom,1);close(upper.top,2);
 assert.deepEqual(lower.triangle,upper.triangle);
 close(lower.hypotenuse,upper.hypotenuse);
 assert.ok(upper.top<document.room.height);
 const older={...document,bassTraps:document.bassTraps.filter(trap=>trap.id!=='bass-trap-rear-right-upper')};
 const loaded=parseRoomDocument(JSON.stringify(older));
 assert.equal(loaded.bassTraps.filter(trap=>trap.corner==='rear-right').length,2);
 assert.equal(parseRoomDocument(JSON.stringify(loaded)).bassTraps.filter(trap=>trap.corner==='rear-right').length,2);
});

test('fabric is acoustic panel material and wooden lids remain wood',()=>{
 assert.equal(acousticSurfaceCategory('object:bass-trap-front-left-upper:fabric-diagonal:0:0'),'panel');
 assert.equal(acousticSurfaceCategory('object:bass-trap-front-left-upper:cap-top:1:0'),'wood');
});
