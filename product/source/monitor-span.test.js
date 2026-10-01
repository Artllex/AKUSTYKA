import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument} from './src/model.js';
import {createStudioMonitor} from './src/monitor-view.js';
import {createMonitorSpan} from './src/monitor-span.js';
import {hoverDistanceLabel} from './src/distance-label.js';

test('monitor spacing laser and card appear together only over the tweeter span',()=>{
 const doc=createDocument(),monitors=doc.objects.filter(o=>o.type==='studio-monitor').map(createStudioMonitor);
 const span=createMonitorSpan(monitors),ray=span.group.getObjectByName('monitor-span-ray'),label=span.group.getObjectByName('distance-monitor-span');
 const tweeters=monitors.map(m=>m.getDriverCenters().find(d=>d.id==='tweeter').position);
 assert.ok(Math.abs(span.distance-tweeters[0].distanceTo(tweeters[1]))<1e-9);
 assert.equal(ray.visible,false);assert.equal(label.visible,false);
 const camera=new THREE.PerspectiveCamera(60,800/600,.1,100);
 camera.position.copy(ray.position).add(new THREE.Vector3(0,0,5));camera.lookAt(ray.position);camera.updateProjectionMatrix();
 assert.equal(hoverDistanceLabel([span.group],camera,{x:400,y:300},800,600),label);
 assert.equal(ray.visible,true);assert.equal(label.visible,true);
 assert.equal(hoverDistanceLabel([span.group],camera,{x:0,y:0},800,600),null);
 assert.equal(ray.visible,false);assert.equal(label.visible,false);
 assert.equal(hoverDistanceLabel([span.group],camera,null,800,600),null);
 assert.equal(ray.visible,false);assert.equal(label.visible,false);
 span.dispose();monitors.forEach(m=>m.dispose());
});
