import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument} from './src/model.js';
import {createSeatedListener} from './src/listener-view.js';
import {BINOCULAR_FIELD,panoramaDirection} from './src/listener-pov.js';

test('PoV starts halfway between both eyes and follows head rotation',()=>{
 const listener=createDocument().objects.find(o=>o.type==='seated-listener');
 const view=createSeatedListener(listener),pose=view.getEyePose();
 const left=view.group.getObjectByName('eye-left').getWorldPosition(new THREE.Vector3());
 const right=view.group.getObjectByName('eye-right').getWorldPosition(new THREE.Vector3());
 assert.ok(pose.position.distanceTo(left.clone().add(right).multiplyScalar(0.5))<1e-10);
 assert.ok(new THREE.Vector3(0,0,-1).applyQuaternion(pose.quaternion).z<-.99);
 view.dispose();
 const turned=createSeatedListener({...listener,headYaw:30});
 const turnedPose=turned.getEyePose(),forward=new THREE.Vector3(0,0,-1).applyQuaternion(turnedPose.quaternion);
 assert.ok(Math.abs(forward.x)>.45);
 assert.ok(Math.abs(turnedPose.position.y-pose.position.y)<.001);
 turned.dispose();
});

test('binocular panorama spans 200 degrees horizontally and 130 vertically',()=>{
 assert.deepEqual(BINOCULAR_FIELD,{horizontal:200,vertical:130});
 const angle=(a,b)=>THREE.MathUtils.radToDeg(a.angleTo(b));
 assert.ok(Math.abs(angle(panoramaDirection(.5,.5),panoramaDirection(0,.5))-100)<1e-8);
 assert.ok(Math.abs(angle(panoramaDirection(.5,.5),panoramaDirection(1,.5))-100)<1e-8);
 assert.ok(Math.abs(angle(panoramaDirection(.5,0),panoramaDirection(.5,1))-130)<1e-8);
 assert.ok(panoramaDirection(.5,.5).distanceTo(new THREE.Vector3(0,0,-1))<1e-10);
 assert.ok(panoramaDirection(0,.5).z>0&&panoramaDirection(1,.5).z>0,'peripheral edges see slightly behind the ears');
});
