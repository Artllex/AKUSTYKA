import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {MM27,MM27_DRIVERS,createMonitorPair,DEFAULT_MONITOR_EAR_DISTANCE} from './src/monitor-model.js';
import {createStudioMonitor} from './src/monitor-view.js';
import {monitorSideDistance} from './src/monitor-side-distance.js';
import {createDocument,DEFAULT_ROOM,usesDefaultListeningLayout,placeDefaultListeningLayout} from './src/model.js';
import {createSeatedListener} from './src/listener-view.js';
import {createRoom} from './src/room-view.js';
import {findMonitorCollisions} from './src/monitor-collisions.js';
import {parseRoomDocument} from './src/bench.js';
import {createDocumentHistory} from './src/history.js';
test('MM27 cabinet has real scale and five colored surface centers per monitor',()=>{
 const record=createMonitorPair(DEFAULT_ROOM)[0];record.position={x:0,y:0,z:0};record.yaw=0;
 const view=createStudioMonitor(record),size=new THREE.Box3().setFromObject(view.group.getObjectByName('cabinet')).getSize(new THREE.Vector3());
 for(const [a,b] of [[size.x,0.241],[size.y,0.521],[size.z,0.394]])assert.ok(Math.abs(a-b)<1e-6);
 const body=new THREE.Box3();view.group.traverse(o=>{if(o.isMesh&&!o.name.startsWith('center-'))body.union(new THREE.Box3().setFromObject(o));});const overall=body.getSize(new THREE.Vector3());
 for(const [a,b] of [[overall.x,MM27.overall.width],[overall.y,MM27.overall.height],[overall.z,MM27.overall.depth]])assert.ok(Math.abs(a-b)<0.0005,`${a} != ${b}`);
 assert.equal(view.getDriverCenters().length,5);
 for(const driver of MM27_DRIVERS){const p=view.getDriverCenters().find(p=>p.id===driver.id);assert.deepEqual(p.position.toArray(),driver.center);const marker=view.group.getObjectByName('center-'+driver.id);assert.equal(marker.material.color.getHex(),driver.color);assert.ok(marker.visible);assert.ok(marker.getWorldPosition(new THREE.Vector3()).distanceTo(p.position)<=0.004501);}
 assert.deepEqual(MM27_DRIVERS.slice(3).map(d=>d.normal),[[-1,0,0],[1,0,0]]);view.dispose();
});
test('centers follow speaker position and yaw, visibility does not alter geometry',()=>{
 const record=createMonitorPair(DEFAULT_ROOM)[1];record.position={x:1.7,y:0.8,z:0.6};record.yaw=Math.PI/2;record.centersVisible=false;
 const view=createStudioMonitor(record);const tweeter=view.getDriverCenters().find(d=>d.id==='tweeter');assert.ok(tweeter.position.distanceTo(new THREE.Vector3(1.897,1.0605,0.6))<1e-9);assert.ok(tweeter.normal.distanceTo(new THREE.Vector3(1,0,0))<1e-9);for(const driver of MM27_DRIVERS)assert.equal(view.group.getObjectByName('center-'+driver.id).visible,false);view.dispose();
});
test('default ears sit at 34% of room length on the sides of an equilateral tweeter triangle',()=>{
 const doc=createDocument(),listener=createSeatedListener(doc.objects[0]),monitors=doc.objects.filter(o=>o.type==='studio-monitor').map(createStudioMonitor),room=createRoom(doc.room,doc.roomFeatures);
 assert.equal(DEFAULT_MONITOR_EAR_DISTANCE,0.869);
 assert.ok(['monitor-L','monitor-R'].every(id=>Math.abs(monitorSideDistance(doc,id)-0.869)<1e-9));
 const ears=['left','right'].map(side=>listener.group.getObjectByName('ear-'+side).getWorldPosition(new THREE.Vector3()));
 const tweeters=monitors.map(m=>m.getDriverCenters().find(d=>d.id==='tweeter').position),side=tweeters[0].distanceTo(tweeters[1]);
 const apex=new THREE.Vector3(doc.room.width/2,tweeters[0].y,tweeters[0].z+Math.sqrt(3)*side/2);
 assert.ok(ears.every(ear=>Math.abs(ear.z-doc.room.length*.34)<1e-9));
 assert.ok(Math.abs(apex.distanceTo(tweeters[0])-side)<1e-9&&Math.abs(apex.distanceTo(tweeters[1])-side)<1e-9);
 for(let i=0;i<2;i++){const segment=new THREE.Line3(tweeters[i],apex),closest=new THREE.Vector3();segment.closestPointToPoint(ears[i],true,closest);assert.ok(closest.distanceTo(ears[i])<1e-9);}
 assert.ok(apex.z>ears[0].z+.09&&apex.z<ears[0].z+.2);
 const collisions=findMonitorCollisions(monitors,[listener.group,...monitors.map(m=>m.group)],doc.room,room.surfaces);assert.equal(collisions.surfaces.size,0);assert.equal(collisions.targets.size,0);
 room.dispose();listener.dispose();monitors.forEach(m=>m.dispose());
});
test('an untouched older listening layout migrates while edited monitor placement is preserved',()=>{
 const old=createDocument(),listener=old.objects[0],pair=old.objects.slice(1),spacing=Math.min(1.2,old.room.width*.48),z=Math.min(.65,old.room.length*.22);
 listener.position.z=old.room.length*.45;
 for(let i=0;i<2;i++){const x=old.room.width/2+(i===0?-1:1)*spacing/2;pair[i].position={x,y:.9245,z};pair[i].yaw=Math.atan2(old.room.width/2-x,old.room.length*.45-z);}
 const migrated=parseRoomDocument(JSON.stringify(old)),fresh=createDocument();
 assert.deepEqual(migrated.objects.map(o=>[o.position,o.yaw]),fresh.objects.map(o=>[o.position,o.yaw]));
 pair[0].position.z+=.05;const custom=parseRoomDocument(JSON.stringify(old));assert.equal(custom.objects[0].position.z,old.room.length*.45);assert.equal(custom.objects[1].position.z,z+.05);
});
test('default listening layout follows a resized room while manual positions stay independent',()=>{
 const doc=createDocument(),width=doc.room.width;assert.equal(usesDefaultListeningLayout(doc),true);
 doc.room={...doc.room,length:4.2};placeDefaultListeningLayout(doc);assert.equal(usesDefaultListeningLayout(doc),true);
 const view=createSeatedListener(doc.objects[0]),ears=['left','right'].map(side=>view.group.getObjectByName('ear-'+side).getWorldPosition(new THREE.Vector3()));assert.ok(ears.every(ear=>Math.abs(ear.z-4.2*.34)<1e-9));view.dispose();
 doc.objects[1].position.x+=.03;assert.equal(usesDefaultListeningLayout(doc),false);const moved=doc.objects[1].position.x;doc.room={...doc.room,width:width+.2};assert.equal(doc.objects[1].position.x,moved);
});
test('monitor pair round trips and full-document history retains placements',()=>{
 const doc=createDocument(),pair=doc.objects.filter(o=>o.type==='studio-monitor');assert.equal(pair.length,2);assert.deepEqual(pair.map(o=>o.channel),['L','R']);assert.deepEqual(parseRoomDocument(JSON.stringify(doc)),doc);
 const history=createDocumentHistory(doc),initial=pair[0].position.x;pair[0].position.x+=0.1;history.push(doc);assert.equal(history.undo().objects.find(o=>o.id===pair[0].id).position.x,initial);assert.equal(history.redo().objects.find(o=>o.id===pair[0].id).position.x,initial+0.1);
 for(const patch of [{yaw:NaN},{model:'other'},{position:{x:0,y:-1,z:0}}])assert.throws(()=>parseRoomDocument(JSON.stringify({...doc,objects:[{...pair[0],...patch}]})));
 const legacy={...doc,objects:doc.objects.filter(o=>o.type!=='studio-monitor')};assert.deepEqual(parseRoomDocument(JSON.stringify(legacy)).objects,legacy.objects);
});
