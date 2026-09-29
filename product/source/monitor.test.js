import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {MM27,MM27_DRIVERS,createMonitorPair} from './src/monitor-model.js';
import {createStudioMonitor} from './src/monitor-view.js';
import {createDocument,DEFAULT_ROOM} from './src/model.js';
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
test('monitor pair round trips and full-document history retains placements',()=>{
 const doc=createDocument(),pair=doc.objects.filter(o=>o.type==='studio-monitor');assert.equal(pair.length,2);assert.deepEqual(pair.map(o=>o.channel),['L','R']);assert.deepEqual(parseRoomDocument(JSON.stringify(doc)),doc);
 const history=createDocumentHistory(doc),initial=pair[0].position.x;pair[0].position.x+=0.1;history.push(doc);assert.equal(history.undo().objects.find(o=>o.id===pair[0].id).position.x,initial);assert.equal(history.redo().objects.find(o=>o.id===pair[0].id).position.x,initial+0.1);
 for(const patch of [{yaw:NaN},{model:'other'},{position:{x:0,y:-1,z:0}}])assert.throws(()=>parseRoomDocument(JSON.stringify({...doc,objects:[{...pair[0],...patch}]})));
 const legacy={...doc,objects:doc.objects.filter(o=>o.type!=='studio-monitor')};assert.equal(parseRoomDocument(JSON.stringify(legacy)).objects.length,1);
});
