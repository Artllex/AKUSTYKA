import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createRoom} from './src/room-view.js';
import {createFootprintRoom} from './src/surface-view.js';
import {createMeshRoom} from './src/mesh-view.js';
import {initialRoomMesh} from './src/mesh-model.js';
import {DEFAULT_ROOM} from './src/model.js';
import {FOLIGNO_PLANK,FOLIGNO_SAMPLE} from './src/floor-finish.js';

test('Foligno floor keeps one physical texture scale across all room geometries',()=>{
 assert.deepEqual(FOLIGNO_PLANK,{length:1.291,width:.193,thickness:.008});
 const footprint=[{x:0,z:0},{x:DEFAULT_ROOM.width,z:0},{x:DEFAULT_ROOM.width,z:DEFAULT_ROOM.length},{x:0,z:DEFAULT_ROOM.length}];
 const views=[createRoom(DEFAULT_ROOM),createFootprintRoom(DEFAULT_ROOM,footprint),createMeshRoom(DEFAULT_ROOM,initialRoomMesh({room:DEFAULT_ROOM,roomShape:footprint}))];
 for(const view of views){
  const floor=view.surfaces.find(surface=>surface.name==='floor');
  const positions=floor.geometry.getAttribute('position'),uv=floor.geometry.getAttribute('uv');
  assert.equal(uv.count,positions.count);
  assert.equal(floor.material.color.getHex(),0xffffff);
  for(let i=0;i<positions.count;i++){
   const world=floor.localToWorld(new THREE.Vector3().fromBufferAttribute(positions,i));
   assert.ok(Math.abs(uv.getX(i)-world.x/FOLIGNO_SAMPLE.width)<1e-6);
   assert.ok(Math.abs(uv.getY(i)-world.z/FOLIGNO_SAMPLE.height)<1e-6);
  }
  view.dispose();
 }
});
