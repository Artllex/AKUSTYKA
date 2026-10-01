import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument} from './src/model.js';
import {createRoom} from './src/room-view.js';
import {createSeatedListener} from './src/listener-view.js';
import {createStudioMonitor} from './src/monitor-view.js';
import {createTweeterRays} from './src/tweeter-rays.js';
import {MIN_LISTENING_DISTANCE,MIN_WALL_CLEARANCE,measureMonitorWallClearance,createMonitorWallWarnings} from './src/monitor-clearance.js';
import {updateDistanceLabels} from './src/distance-label.js';

function fixture(){const doc=createDocument(),room=createRoom(doc.room,doc.roomFeatures),listener=createSeatedListener(doc.objects[0]),monitors=doc.objects.filter(o=>o.type==='studio-monitor').map(createStudioMonitor);return {doc,room,listener,monitors,dispose(){room.dispose();listener.dispose();monitors.forEach(m=>m.dispose());}};}

test('Barefoot listening limit uses nearest real ear and colors and labels each tweeter ray',()=>{const f=fixture(),near=createTweeterRays(f.monitors,f.listener,f.doc.room);assert.equal(MIN_LISTENING_DISTANCE,1);assert.equal(near.rayCount,2);for(const monitor of f.monitors){const ray=near.group.getObjectByName('ray-'+monitor.group.name),label=near.group.getObjectByName('distance-ray-'+monitor.group.name),tweeter=monitor.getDriverCenters().find(d=>d.id==='tweeter').position,ears=['left','right'].map(side=>f.listener.group.getObjectByName('ear-'+side).getWorldPosition(new THREE.Vector3()));assert.ok(Math.abs(ray.userData.listeningDistance-Math.min(...ears.map(ear=>ear.distanceTo(tweeter))))<1e-9);assert.equal(ray.material.color.getHex(),ray.userData.tooClose?0xff303d:0x55e69a);assert.ok(label.userData.label.endsWith(' cm'));assert.ok(Math.abs(label.userData.distance-ray.userData.origin.distanceTo(ray.userData.target))<1e-8);}near.dispose();for(const monitor of f.monitors){monitor.group.position.z-=0.5;monitor.group.updateMatrixWorld(true);}const far=createTweeterRays(f.monitors,f.listener,f.doc.room);assert.equal(far.tooCloseCount,0);for(const monitor of f.monitors){const ray=far.group.getObjectByName('ray-'+monitor.group.name);assert.ok(ray.userData.listeningDistance>=1);assert.equal(ray.material.color.getHex(),0x55e69a);}far.dispose();f.dispose();});

test('wall warning touches rendered speaker and labels measured gap, even for hidden walls',()=>{const f=fixture(),monitor=f.monitors[0];assert.equal(MIN_WALL_CLEARANCE,0.127);monitor.group.position.set(0.2,0.9245,0.3);monitor.group.rotation.y=0;monitor.group.updateMatrixWorld(true);const left=f.room.surfaces.find(s=>s.name==='wall-left');left.visible=false;const warnings=measureMonitorWallClearance([monitor],f.room.surfaces);const byWall=new Map(warnings.map(w=>[w.wall,w]));assert.ok(byWall.has('wall-left'));assert.ok(byWall.has('wall-front'));assert.ok(Math.abs(byWall.get('wall-left').distance-(0.2-0.267/2))<0.002);assert.ok(Math.abs(byWall.get('wall-left').start.x-0.0665)<0.002);assert.ok(Math.abs(byWall.get('wall-front').distance-(0.3-0.245))<1e-5);const view=createMonitorWallWarnings([monitor],f.room.surfaces);const line=view.group.getObjectByName('wall-clearance-monitor-L-wall-left'),label=view.group.getObjectByName('wall-distance-monitor-L-wall-left');assert.ok(line);assert.ok(label);assert.ok(Math.abs(line.userData.start.distanceTo(line.userData.end)-line.userData.distance)<1e-8);assert.equal(label.userData.label,'6,6 cm');view.dispose();f.dispose();});

test('window opening does not create a false front-wall warning',()=>{const f=fixture(),monitor=f.monitors[0],niche=f.doc.roomFeatures.window;monitor.group.position.set(niche.center,0.9245,0.32);monitor.group.rotation.y=0;monitor.group.updateMatrixWorld(true);const warnings=measureMonitorWallClearance([monitor],f.room.surfaces);assert.ok(!warnings.some(w=>w.wall==='wall-front'));f.dispose();});
test('distance card stays beyond the laser edge while camera rotates',()=>{const f=fixture(),rays=createTweeterRays(f.monitors,f.listener,f.doc.room),label=rays.group.getObjectByName('distance-ray-monitor-L'),camera=new THREE.PerspectiveCamera();for(const position of [[2,2,4],[0,5,0.1],[-4,1,1]]){camera.position.set(...position);camera.lookAt(0,1,0);updateDistanceLabels(rays.group,camera);const up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);assert.ok(label.position.clone().sub(label.userData.anchor).dot(up)>label.scale.y/2+.04);}rays.dispose();f.dispose();});

test('rear face center and nearest cabinet point are measured separately on the same physical wall',()=>{
 const f=fixture(),monitor=f.monitors[0];
 monitor.group.position.set(0.4,0.9245,0.36);monitor.group.rotation.y=Math.PI/6;monitor.group.updateMatrixWorld(true);
 const view=createMonitorWallWarnings([monitor],f.room.surfaces),measurement=view.rearClearances[0];
 assert.equal(measurement.wall,'wall-front');
 assert.ok(measurement.center.start.distanceTo(monitor.getRearFaceCenter())<1e-9);
 assert.ok(Math.abs(measurement.center.end.z)<1e-8);
 assert.ok(measurement.nearest.distance<MIN_WALL_CLEARANCE);
 assert.ok(measurement.center.distance>MIN_WALL_CLEARANCE);
 const near=view.group.getObjectByName('wall-clearance-monitor-L-wall-front');
 const center=view.group.getObjectByName('rear-center-clearance-monitor-L-wall-front');
 assert.equal(near.material.color.getHex(),0xff303d);
 assert.equal(center.material.color.getHex(),0x55e69a);
 assert.equal(near.userData.distance,measurement.nearest.distance);
 assert.equal(center.userData.distance,measurement.center.distance);
 assert.equal(center.userData.distanceLabel.userData.title,'Środek tyłu');
 assert.equal(near.userData.distanceLabel.userData.title,'Najbliższy punkt');
 view.dispose();
 monitor.group.position.z=0.32;monitor.group.updateMatrixWorld(true);
 const closer=createMonitorWallWarnings([monitor],f.room.surfaces);
 assert.equal(closer.group.getObjectByName('rear-center-clearance-monitor-L-wall-front').material.color.getHex(),0xff303d);
 closer.dispose();f.dispose();
});

test('rear center clearance follows the recessed wall rather than the missing front-wall patch',()=>{
 const f=fixture(),monitor=f.monitors[0],niche=f.doc.roomFeatures.window;
 monitor.group.position.set(niche.center,0.9245,0.4);monitor.group.rotation.y=0;monitor.group.updateMatrixWorld(true);
 const view=createMonitorWallWarnings([monitor],f.room.surfaces),measurement=view.rearClearances[0];
 assert.equal(measurement.wall,'niche-back');
 assert.ok(Math.abs(measurement.center.end.z+niche.depth)<1e-8);
 view.dispose();f.dispose();
});
