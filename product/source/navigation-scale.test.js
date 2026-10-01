import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {navigationSpan,panSpeedForSpan,zoomScaleForSpan} from './src/navigation-scale.js';

test('wheel zoom changes the same world distance near and far from the target',()=>{
 const reference=5,delta=-100,far=8,near=0.8;
 const farChange=far*(1-zoomScaleForSpan(delta,far,reference));
 const nearChange=near*(1-zoomScaleForSpan(delta,near,reference));
 assert.ok(Math.abs(farChange-nearChange)<1e-10);
 assert.ok(farChange>0);
 const out=100;
 const farOut=far/zoomScaleForSpan(out,far,reference)-far;
 const nearOut=near/zoomScaleForSpan(out,near,reference)-near;
 assert.ok(Math.abs(farOut-nearOut)<1e-10);
});

test('Shift pan keeps the same world movement at every zoom level',()=>{
 const reference=5;
 assert.equal(8*panSpeedForSpan(8,reference),0.8*panSpeedForSpan(0.8,reference));
 const perspective=new THREE.PerspectiveCamera(42,1,0.01,200);
 perspective.position.set(0,0,3);
 assert.equal(navigationSpan(perspective,new THREE.Vector3()),3);
 const orthographic=new THREE.OrthographicCamera(-2,2,2,-2,0.01,200);
 orthographic.zoom=4;
 assert.equal(navigationSpan(orthographic,new THREE.Vector3()),1);
});
