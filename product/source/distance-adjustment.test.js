import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {distanceAdjustment} from './src/distance-adjustment.js';
const result={start:new THREE.Vector3(0,0,0),end:new THREE.Vector3(1,0,0),distance:1};
test('distance buttons move chosen object along measurement, leaving rotation intact',()=>{
 const first=distanceAdjustment(result,{ry:15},true,0.01,result.start,result.end);assert.equal(first.x,-0.01);assert.equal(first.ry,15);
 const second=distanceAdjustment(result,{},false,0.01,result.start,result.end);assert.equal(second.x,0.01);
 const closer=distanceAdjustment(result,{},true,-0.01,result.start,result.end);assert.equal(closer.x,0.01);
});
test('closer stops at contact; zero gap gets a finite outward direction',()=>{
 assert.equal(distanceAdjustment(result,{},true,-2,result.start,result.end).x,1);
 const touching={start:new THREE.Vector3(),end:new THREE.Vector3(),distance:0};assert.equal(distanceAdjustment(touching,{},true,0.01,new THREE.Vector3(-1,0,0),new THREE.Vector3(1,0,0)).x,-0.01);
 assert.throws(()=>distanceAdjustment(result,{},true,NaN,result.start,result.end));
});
