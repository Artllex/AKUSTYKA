import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument,DEFAULT_ROOM} from './src/model.js';
import {parseRoomDocument} from './src/bench.js';
import {createRoom} from './src/room-view.js';
import {defaultRoomFeatures,normalizeRoomFeatures,createRoomFeatureViews} from './src/room-features.js';
import {surfaceProjection} from './src/projection.js';
test('window and door are true wall openings and retain projection dimensions',()=>{
 const features=defaultRoomFeatures(DEFAULT_ROOM),room=createRoom(DEFAULT_ROOM,features);room.group.updateMatrixWorld(true);
 for(const [name,opening,z,direction] of [['wall-front',features.window,0,-1],['wall-back',features.door,DEFAULT_ROOM.length,1]]){
  const wall=room.surfaces.find(s=>s.name===name),ray=new THREE.Raycaster(new THREE.Vector3(opening.center,(opening.bottom??0)+opening.height/2,z-direction),new THREE.Vector3(0,0,direction));
  assert.equal(ray.intersectObject(wall).length,0);
  const solid=new THREE.Raycaster(new THREE.Vector3(DEFAULT_ROOM.width-0.05,DEFAULT_ROOM.height-0.05,z-direction),new THREE.Vector3(0,0,direction));assert.ok(solid.intersectObject(wall).length>0);
  assert.ok(surfaceProjection(wall,1.6).camera.isOrthographicCamera);
 }
 room.dispose();
});
test('floor recess has a back and sides with no window or sill',()=>{
 const features=defaultRoomFeatures(DEFAULT_ROOM),views=createRoomFeatureViews(DEFAULT_ROOM,features),recess=views.find(v=>v.group.name==='window').group;
 assert.ok(recess.getObjectByName('recess-back'));assert.equal(recess.getObjectByName('window-sill'),undefined);assert.equal(recess.getObjectByName('window-upper-glass'),undefined);assert.equal(features.window.bottom,0);assert.equal(features.window.depth,0.086);
 for(const v of views)v.dispose();
});
test('room features save and load, migrate legacy and reject missing or out-of-bounds values',()=>{
 const doc=createDocument();assert.deepEqual(parseRoomDocument(JSON.stringify(doc)).roomFeatures,doc.roomFeatures);
 delete doc.roomFeatures;assert.deepEqual(parseRoomDocument(JSON.stringify(doc)).roomFeatures,defaultRoomFeatures(doc.room));
 const invalid=defaultRoomFeatures(DEFAULT_ROOM);invalid.window.width=5;assert.throws(()=>normalizeRoomFeatures(invalid,DEFAULT_ROOM));delete invalid.window.width;assert.throws(()=>normalizeRoomFeatures(invalid,DEFAULT_ROOM));
});
import {distanceBetweenObjects} from './src/object-distance.js';
test('window exact left and right wall clearances are 55.3 and 88.6 cm',()=>{
 const features=defaultRoomFeatures(DEFAULT_ROOM),room=createRoom(DEFAULT_ROOM,features),views=createRoomFeatureViews(DEFAULT_ROOM,features),window=views.find(v=>v.group.name==='window').group;
 assert.ok(Math.abs(features.window.width-1.038)<1e-12);
 assert.ok(Math.abs(distanceBetweenObjects(window,room.surfaces.find(s=>s.name==='wall-left')).distance-0.553)<1e-6);
 assert.ok(Math.abs(distanceBetweenObjects(window,room.surfaces.find(s=>s.name==='wall-right')).distance-0.886)<1e-6);
 for(const v of views)v.dispose();room.dispose();
});
test('niche extends floor shape and outline by exactly 8.6 cm only within its width',()=>{
 const features=defaultRoomFeatures(DEFAULT_ROOM),room=createRoom(DEFAULT_ROOM,features);room.group.updateMatrixWorld(true);const floor=room.surfaces.find(s=>s.name==='floor'),ray=x=>new THREE.Raycaster(new THREE.Vector3(x,1,-0.07),new THREE.Vector3(0,-1,0)).intersectObject(floor);
 assert.ok(ray(features.window.center).length>0);assert.equal(ray(0.1).length,0);
 const bounds=new THREE.Box3().setFromObject(room.group.getObjectByName('floor-outline'));assert.ok(Math.abs(bounds.min.z+0.086)<1e-8);assert.ok(Math.abs(bounds.max.z-DEFAULT_ROOM.length)<1e-6);room.dispose();
});
