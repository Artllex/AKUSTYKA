import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {distanceBetweenObjects} from './src/object-distance.js';
const box=(x,y,z)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1));mesh.position.set(x,y,z);return mesh;};
test('distance measures surface gap, not center gap; responds to transforms',()=>{
 const a=box(0,0,0),b=box(3,0,0);assert.ok(Math.abs(distanceBetweenObjects(a,b).distance-2)<1e-9);b.rotation.z=Math.PI/4;assert.ok(Math.abs(distanceBetweenObjects(a,b).distance-(2.5-Math.SQRT1_2))<1e-9);b.position.x=0;assert.ok(distanceBetweenObjects(a,b).distance<1e-9);
});
test('mesh to wall reports closest surface endpoints and handles cutaway-hidden wall',()=>{
 const a=box(0,1,0),wall=new THREE.Mesh(new THREE.PlaneGeometry(5,5),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));wall.rotation.x=-Math.PI/2;wall.visible=false;const result=distanceBetweenObjects(a,wall);assert.ok(Math.abs(result.distance-0.5)<1e-9);assert.ok(Math.abs(result.end.y)<1e-9);assert.ok(Math.abs(result.start.y-0.5)<1e-9);
});
test('hidden window geometry and nonphysical source markers are excluded',()=>{
 const group=new THREE.Group(),visible=box(0,0,0),hidden=box(2,0,0),marker=box(2,0,0);hidden.visible=false;marker.name='center-tweeter';group.add(visible,hidden,marker);assert.ok(Math.abs(distanceBetweenObjects(group,box(4,0,0)).distance-3)<1e-9);
});
import {createRoom} from './src/room-view.js';
import {createDocument} from './src/model.js';
import {applyObjectTransform} from './src/object-transform.js';
import {createRoomFeatureViews} from './src/room-features.js';
test('window aperture follows translation and in-plane rotation; original aperture is filled',()=>{
 const doc=createDocument(),w=doc.roomFeatures.window;const transforms={window:{x:0.6,y:0.1,z:0,rx:0,ry:0,rz:12}};
 const room=createRoom(doc.room,doc.roomFeatures,transforms),wall=room.surfaces.find(s=>s.name==='wall-front');room.group.updateMatrixWorld(true);
 const features=createRoomFeatureViews(doc.room,doc.roomFeatures),recess=features.find(v=>v.group.name==='window');applyObjectTransform(recess.group,transforms);
 const center=recess.group.localToWorld(new THREE.Vector3(0,w.height/2,0));
 const ray=(x,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,1),new THREE.Vector3(0,0,-1)).intersectObject(wall);
 assert.equal(ray(center.x,center.y).length,0);
 assert.ok(ray(w.center-w.width/2+0.1,w.bottom+w.height/2).length>0);
 for(const v of features)v.dispose();room.dispose();
});
test('moved opening stays clipped within wall bounds',()=>{
 const doc=createDocument(),room=createRoom(doc.room,doc.roomFeatures,{window:{x:20,y:20}});room.group.updateMatrixWorld(true);const wall=room.surfaces.find(s=>s.name==='wall-front'),bounds=new THREE.Box3().setFromObject(wall);assert.ok(Math.abs(bounds.min.x)<1e-8);assert.ok(Math.abs(bounds.max.x-doc.room.width)<1e-6);room.dispose();
});

