import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {objectOnProjectionSide} from './src/projection-objects.js';

test('projection shows objects only on the viewed side of a surface',()=>{
 const wall=new THREE.Object3D();wall.position.z=0;wall.userData.outward=new THREE.Vector3(0,0,-1);
 const inside=new THREE.Group(),insideMesh=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5));insideMesh.position.z=1;inside.add(insideMesh);
 const outside=new THREE.Group(),outsideMesh=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5));outsideMesh.position.z=-1;outside.add(outsideMesh);
 const crossing=new THREE.Group(),crossingMesh=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5));crossingMesh.position.z=0;crossing.add(crossingMesh);
 assert.equal(objectOnProjectionSide(inside,wall,'inside'),true);
 assert.equal(objectOnProjectionSide(inside,wall,'outside'),false);
 assert.equal(objectOnProjectionSide(outside,wall,'inside'),false);
 assert.equal(objectOnProjectionSide(outside,wall,'outside'),true);
 assert.equal(objectOnProjectionSide(crossing,wall,'inside'),true);
 assert.equal(objectOnProjectionSide(crossing,wall,'outside'),true);
});
