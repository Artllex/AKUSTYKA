import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument} from './src/model.js';
import {createSeatedListener} from './src/listener-view.js';
import {createStudioMonitor} from './src/monitor-view.js';
import {createTweeterRays} from './src/tweeter-rays.js';
import {parseRoomDocument} from './src/bench.js';
function fixture(){const doc=createDocument(),listener=createSeatedListener(doc.objects[0]),monitors=doc.objects.filter(o=>o.type==='studio-monitor').map(createStudioMonitor);return {doc,listener,monitors,dispose(){listener.dispose();monitors.forEach(m=>m.dispose());}};}
test('two tweeter rays use actual transformed centers and normals, hitting head in default setup',()=>{const f=fixture(),rays=createTweeterRays(f.monitors,f.listener,f.doc.room);assert.equal(rays.rayCount,2);assert.equal(rays.hitCount,2);for(const monitor of f.monitors){const tweeter=monitor.getDriverCenters().find(d=>d.id==='tweeter'),ray=rays.group.getObjectByName('ray-'+monitor.group.name);assert.ok(ray.userData.origin.distanceTo(tweeter.position)<1e-9);assert.ok(ray.userData.direction.distanceTo(tweeter.normal)<1e-9);const local=ray.userData.target.clone().applyMatrix4(f.listener.group.getObjectByName('head').matrixWorld.clone().invert());assert.ok(Math.abs(local.length()-1)<1e-9);}rays.dispose();f.dispose();});
test('rays do not automatically aim at head; a rotated monitor misses and terminates at wall',()=>{const f=fixture();f.monitors[0].group.rotation.y=Math.PI/2;f.monitors[0].group.updateMatrixWorld(true);const rays=createTweeterRays(f.monitors,f.listener,f.doc.room,false),ray=rays.group.getObjectByName('ray-'+f.monitors[0].group.name);assert.equal(ray.userData.headHit,false);assert.ok(Math.abs(ray.userData.target.x-f.doc.room.width)<1e-9);assert.ok(ray.userData.direction.distanceTo(new THREE.Vector3(1,0,0))<1e-9);assert.equal(rays.group.visible,false);rays.dispose();f.dispose();});
test('lean changes head intersection without changing tweeter ray origin or direction; visibility persists',()=>{const f=fixture();const shifted=createSeatedListener({...f.doc.objects[0],leanForward:35,leanSide:0}),rays=createTweeterRays(f.monitors,shifted,f.doc.room);assert.equal(rays.hitCount,0);f.doc.showTweeterRays=false;assert.equal(parseRoomDocument(JSON.stringify(f.doc)).showTweeterRays,false);assert.throws(()=>parseRoomDocument(JSON.stringify({...f.doc,showTweeterRays:'yes'})));shifted.dispose();rays.dispose();f.dispose();});

