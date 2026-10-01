import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument,DEFAULT_ROOM} from './src/model.js';
import {createRackRecord,ensureRackRecord,moveDefaultRackWithRoom,RACK_15U} from './src/rack-model.js';
import {createRackView} from './src/rack-view.js';
import {parseRoomDocument} from './src/bench.js';

test('15U rack stands on the floor inside the rear right corner and keeps its mounting scale',()=>{
 const doc=createDocument(),record=doc.objects.find(object=>object.id==='rack-15u');
 assert.equal(RACK_15U.mountingHeight,15*0.04445);
 const view=createRackView(record),bounds=new THREE.Box3().setFromObject(view.group);
 assert.ok(bounds.min.x>0&&bounds.max.x<doc.room.width);
 assert.ok(bounds.min.z>0&&bounds.max.z<doc.room.length);
 assert.ok(Math.abs(bounds.min.y)<1e-8);
 assert.ok(Math.abs(bounds.max.y-RACK_15U.height)<1e-8);
 assert.equal(view.group.getObjectsByProperty('name','rack-mount-hole').length,90);
 view.dispose();
});

test('rack follows a resized corner unless moved; old documents can add one rack',()=>{
 const doc=createDocument(),nextRoom={...DEFAULT_ROOM,width:3.2,length:4.1};
 moveDefaultRackWithRoom(doc,nextRoom);
 assert.deepEqual(doc.objects.find(o=>o.id==='rack-15u').position,createRackRecord(nextRoom).position);
 const rack=doc.objects.find(o=>o.id==='rack-15u');rack.position.x-=0.1;
 moveDefaultRackWithRoom(doc,{...nextRoom,width:3.4});
 assert.equal(rack.position.x,createRackRecord(nextRoom).position.x-0.1);
 doc.objects=doc.objects.filter(o=>o.id!=='rack-15u');
 const loaded=parseRoomDocument(JSON.stringify(doc));
 assert.equal(loaded.objects.filter(o=>o.id==='rack-15u').length,0);
 ensureRackRecord(loaded);ensureRackRecord(loaded);
 assert.equal(loaded.objects.filter(o=>o.id==='rack-15u').length,1);
});
