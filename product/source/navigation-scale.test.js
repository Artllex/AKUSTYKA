import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {navigationSpan,panSpeedForSpan,zoomScaleForSpan} from './src/navigation-scale.js';

test('wheel zoom slows gently near the target, less than proportional zoom',()=>{
 const reference=5,delta=-100,far=8,near=0.8;
 const farChange=far*(1-zoomScaleForSpan(delta,far,reference));
 const nearChange=near*(1-zoomScaleForSpan(delta,near,reference));
 assert.ok(nearChange<farChange&&nearChange>farChange/3);
 const out=100;
 const farOut=far/zoomScaleForSpan(out,far,reference)-far;
 const nearOut=near/zoomScaleForSpan(out,near,reference)-near;
 assert.ok(nearOut<farOut&&nearOut>farOut/3);
});

test('Shift pan slows gently near the target in perspective and orthographic views',()=>{
 const reference=5;
 const far=8*panSpeedForSpan(8,reference),near=0.8*panSpeedForSpan(0.8,reference);
 assert.ok(near<far&&near>far/3);
 const perspective=new THREE.PerspectiveCamera(42,1,0.01,200);
 perspective.position.set(0,0,3);
 assert.equal(navigationSpan(perspective,new THREE.Vector3()),3);
 const orthographic=new THREE.OrthographicCamera(-2,2,2,-2,0.01,200);
 orthographic.zoom=4;
 assert.equal(navigationSpan(orthographic,new THREE.Vector3()),1);
});
