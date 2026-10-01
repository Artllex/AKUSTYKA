import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument,DEFAULT_ROOM} from './src/model.js';
import {MODUL_DESK_ID,MODUL_STUDIO_DESK as D,createModulDeskRecord,ensureModulDeskRecord,moveDefaultModulDeskWithRoom} from './src/modul-desk-model.js';
import {createModulDeskView} from './src/modul-desk-view.js';
import {createRackView} from './src/rack-view.js';
import {createSeatedListener} from './src/listener-view.js';
import {parseRoomDocument} from './src/bench.js';

test('rear modul desk follows the supplied envelope and assembly, without blocking door or rack',()=>{
 const doc=createDocument(),record=doc.objects.find(o=>o.id===MODUL_DESK_ID);
 assert.equal(record.model,'modul-studio-desk-2025');
 assert.equal(record.yaw,Math.PI);
 const view=createModulDeskView(record),rack=createRackView(doc.objects.find(o=>o.id==='rack-15u')),listener=createSeatedListener(doc.objects.find(o=>o.id==='listener-1'));
 const bounds=new THREE.Box3().setFromObject(view.group),rackBounds=new THREE.Box3().setFromObject(rack.group),listenerBounds=new THREE.Box3().setFromObject(listener.group);
 assert.ok(Math.abs(bounds.max.x-bounds.min.x-D.width)<1e-6);
 assert.ok(Math.abs(bounds.max.z-bounds.min.z-D.depth)<1e-6);
 assert.ok(Math.abs(bounds.max.y-D.height)<.001);
 assert.equal(view.group.getObjectsByProperty('name','curved-side-panel').length,2);
 assert.equal(view.group.getObjectsByProperty('name','centre-support').length,1);
 assert.equal(view.group.getObjectsByProperty('name','pull-out-keyboard-tray').length,1);
 assert.equal(view.group.getObjectsByProperty('name','main-top-with-cable-hole')[0].geometry.parameters.shapes.holes.length,1);
 assert.equal(view.group.getObjectsByProperty('name','cable-grommet-ring').length,1);
 assert.ok(bounds.min.x>doc.roomFeatures.door.center+doc.roomFeatures.door.width/2);
 assert.ok(bounds.max.z<rackBounds.min.z);
 assert.ok(bounds.min.z>listenerBounds.max.z);
 assert.ok(bounds.max.x<DEFAULT_ROOM.width&&bounds.max.z<DEFAULT_ROOM.length);
 view.dispose();rack.dispose();listener.dispose();
});

test('rear desk persists, migrates to existing rooms once and follows room size only while untouched',()=>{
 const doc=createDocument();assert.equal(doc.objects.filter(o=>o.id===MODUL_DESK_ID).length,1);
 const old=JSON.parse(JSON.stringify(doc));old.objects=old.objects.filter(o=>o.id!==MODUL_DESK_ID);
 const loaded=parseRoomDocument(JSON.stringify(old));assert.equal(loaded.objects.filter(o=>o.id===MODUL_DESK_ID).length,1);
 assert.equal(parseRoomDocument(JSON.stringify(loaded)).objects.filter(o=>o.id===MODUL_DESK_ID).length,1);
 const bare=parseRoomDocument(JSON.stringify({schemaVersion:1,units:'m',room:DEFAULT_ROOM,objects:[]}));assert.equal(bare.objects.length,0);
 const next={...DEFAULT_ROOM,width:3,length:4};moveDefaultModulDeskWithRoom(doc,next);
 const record=doc.objects.find(o=>o.id===MODUL_DESK_ID);assert.deepEqual(record.position,createModulDeskRecord(next).position);
 record.position.z-=.1;moveDefaultModulDeskWithRoom(doc,{...next,length:4.2});assert.equal(record.position.z,createModulDeskRecord(next).position.z-.1);
 ensureModulDeskRecord(doc);assert.equal(doc.objects.filter(o=>o.id===MODUL_DESK_ID).length,1);
});
