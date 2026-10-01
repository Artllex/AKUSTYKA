import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument,DEFAULT_ROOM,usesDefaultListeningLayout,placeDefaultListeningLayout} from './src/model.js';
import {COMBODESK_88 as D,createDeskRecord,ensureDeskRecord,moveDefaultDeskWithRoom} from './src/desk-model.js';
import {createDeskView} from './src/desk-view.js';
import {parseRoomDocument} from './src/bench.js';

test('ComboDesk 88 has published envelope, distinct tiers, three rack bays and cable passages',()=>{
 const record=createDocument().objects.find(o=>o.type==='studio-desk');
 assert.equal(record.model,'thomann-combodesk-88-r-base-black');
 const view=createDeskView(record),group=view.group,bounds=new THREE.Box3().setFromObject(group);
 assert.ok(Math.abs(bounds.max.x-bounds.min.x-D.width)<1e-6);
 assert.ok(Math.abs(bounds.max.z-bounds.min.z-D.depth)<1e-6);
 assert.ok(Math.abs(bounds.min.y)<1e-6);
 assert.ok(Math.abs(bounds.max.y-D.height)<1e-6);
 assert.equal(group.getObjectsByProperty('name','shaped-side-panel').length,2);
 const sides=group.getObjectsByProperty('name','shaped-side-panel');
 const frontAt=(side,low,high)=>{
  const positions=side.geometry.attributes.position;let front=-Infinity;
  for(let i=0;i<positions.count;i++)if(positions.getY(i)>=low&&positions.getY(i)<=high)front=Math.max(front,positions.getZ(i));
  return front;
 };
 for(const side of sides){
  assert.ok(frontAt(side,.30,.36)<frontAt(side,.58,.62)-.14,'knee cutout must be deeply recessed');
  assert.ok(frontAt(side,.00,.03)>frontAt(side,.30,.36)+.09,'foot must return forward at floor level');
 }
 assert.ok(Math.abs(sides[0].position.x+sides[1].position.x-0.018)<1e-8,'side panels must be mirrored');
 assert.equal(group.getObjectsByProperty('name','side-screw').length,10);
 assert.equal(group.getObjectsByProperty('name','rack-divider').length,4);
 const tray=group.getObjectByName('keyboard-tray');
 assert.deepEqual([tray.geometry.parameters.width,tray.geometry.parameters.depth],[1.56,.3]);
 const back=group.getObjectByName('rear-panel-three-cable-holes');
 assert.equal(back.geometry.parameters.shapes.holes.length,3);
 const shelf=group.getObjectByName('upper-shelf');
 assert.equal(shelf.geometry.parameters.depth,.268);
 assert.ok(shelf.position.y>group.getObjectByName('worktop').position.y);
 assert.ok(bounds.min.x>0&&bounds.max.x<DEFAULT_ROOM.width&&bounds.min.z>0);
 view.dispose();
});

test('desk is saved, follows room width while untouched, and can be added to old documents once',()=>{
 const doc=createDocument(),desk=doc.objects.find(o=>o.type==='studio-desk');
 const next={...DEFAULT_ROOM,width:3.1};moveDefaultDeskWithRoom(doc,next);
 assert.deepEqual(desk.position,createDeskRecord(next).position);
 desk.position.x+=.1;moveDefaultDeskWithRoom(doc,{...next,width:3.3});
 assert.equal(desk.position.x,createDeskRecord(next).position.x+.1);
 placeDefaultListeningLayout(doc);assert.equal(desk.position.x,createDeskRecord(next).position.x+.1);
 const loaded=parseRoomDocument(JSON.stringify(doc));
 assert.equal(loaded.objects.filter(o=>o.type==='studio-desk').length,1);
 loaded.objects=loaded.objects.filter(o=>o.type!=='studio-desk');
 const old=parseRoomDocument(JSON.stringify(loaded));
 assert.equal(old.objects.filter(o=>o.type==='studio-desk').length,0);
 const legacy=createDocument();legacy.objects=legacy.objects.filter(o=>o.type!=='studio-desk');
 assert.equal(usesDefaultListeningLayout(legacy),true);
 ensureDeskRecord(old);ensureDeskRecord(old);
 assert.equal(old.objects.filter(o=>o.type==='studio-desk').length,1);
});
