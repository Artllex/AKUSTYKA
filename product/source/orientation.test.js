import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createRoom} from './src/room-view.js';
import {DEFAULT_ROOM} from './src/model.js';
import {surfaceProjection} from './src/projection.js';
import {orientationDirections} from './src/orientation.js';
test('orientation labels and line styles stay stable at axis-aligned floor and ceiling projections',()=>{
 const room=createRoom(DEFAULT_ROOM);
 for(const name of ['floor','ceiling'])for(const side of ['inside','outside']){
  const {camera}=surfaceProjection(room.surfaces.find(s=>s.name===name),1.6,side);
  const baseline=orientationDirections(camera);
  const signature=d=>[d.y>0,d.z<0,Math.hypot(d.x,d.y)<0.05];
  for(const error of [-1e-12,1e-12,-1e-9,1e-9]){
   const jittered=camera.clone();jittered.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,1,1).normalize(),error));
   const directions=orientationDirections(jittered);
   for(const name of ['north','east','down']){
    assert.deepEqual(signature(directions[name]),signature(baseline[name]));
    for(const key of ['x','y','z'])if(baseline[name][key]===0)assert.equal(directions[name][key],0);
   }
  }
 }
 room.dispose();
});
test('ordinary 3D orientation retains meaningful axis rotation',()=>{
 const camera=new THREE.PerspectiveCamera();camera.rotation.set(0.2,0.4,0.1);camera.updateMatrixWorld(true);
 const directions=orientationDirections(camera),inverse=camera.quaternion.clone().invert();
 assert.ok(directions.north.distanceTo(new THREE.Vector3(0,0,-1).applyQuaternion(inverse))<1e-12);
});
