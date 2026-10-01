import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDistanceLabel,hoverDistanceLabel} from './src/distance-label.js';

test('only the distance card of the hovered laser is visible',()=>{
 const camera=new THREE.PerspectiveCamera(60,800/600,.1,100);
 camera.position.set(0,0,5);camera.lookAt(0,0,0);camera.updateProjectionMatrix();
 const group=new THREE.Group();
 const makeLine=(name,y)=>{
  const line=new THREE.Object3D();line.name=name;
  line.userData.origin=new THREE.Vector3(-1,y,0);
  line.userData.target=new THREE.Vector3(1,y,0);
  const label=createDistanceLabel(2,new THREE.Vector3(0,y,0));
  line.userData.distanceLabel=label;group.add(line,label);
  return label;
 };
 const lower=makeLine('ray-lower',0),upper=makeLine('wall-clearance-upper',1);
 assert.equal(lower.visible,false);assert.equal(upper.visible,false);
 assert.equal(hoverDistanceLabel([group],camera,{x:400,y:300},800,600),lower);
 assert.equal(lower.visible,true);assert.equal(upper.visible,false);
 const upperY=(1-new THREE.Vector3(0,1,0).project(camera).y)*300;
 assert.equal(hoverDistanceLabel([group],camera,{x:400,y:upperY},800,600),upper);
 assert.equal(lower.visible,false);assert.equal(upper.visible,true);
 assert.equal(hoverDistanceLabel([group],camera,{x:20,y:20},800,600),null);
 assert.equal(lower.visible,false);assert.equal(upper.visible,false);
 group.visible=false;
 assert.equal(hoverDistanceLabel([group],camera,{x:400,y:300},800,600),null);
 assert.equal(lower.visible,false);
});
