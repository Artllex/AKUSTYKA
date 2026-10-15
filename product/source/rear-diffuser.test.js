import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument} from './src/model.js';
import {parseRoomDocument} from './src/bench.js';
import {createRearDiffuserView,SKYLINE_CITY} from './src/rear-diffuser.js';
import {BILLY_BOOKCASE,BILLY_BOOKCASE_ID} from './src/billy-model.js';
import {acousticSurfaceCategory} from './src/acoustic-simulation.js';

test('15 cm Skyline City fits the rear wall between the door and BILLY',()=>{
 const document=createDocument(),record=document.rearDiffuser;
 assert.equal(record.width,.44);assert.equal(record.height,.44);assert.equal(record.depth,.15);
 const doorRight=document.roomFeatures.door.center+document.roomFeatures.door.width/2;
 const billy=document.objects.find(item=>item.id===BILLY_BOOKCASE_ID);
 const billyLeft=billy.position.x-(BILLY_BOOKCASE.width*Math.abs(Math.cos(billy.yaw))+BILLY_BOOKCASE.depth*Math.abs(Math.sin(billy.yaw)))/2;
 assert.ok(record.centerX-record.width/2>doorRight+.05);
 assert.ok(record.centerX+record.width/2<billyLeft-.05);
 const view=createRearDiffuserView(record,document.room);
 const bounds=new THREE.Box3().setFromObject(view.group),size=bounds.getSize(new THREE.Vector3());
 assert.ok(Math.abs(size.x-.44)<1e-8);assert.ok(Math.abs(size.y-.44)<1e-8);assert.ok(Math.abs(size.z-.15)<1e-8);
 assert.ok(Math.abs(bounds.max.z-document.room.length)<1e-8);
 assert.equal(view.group.getObjectByName('skyline-blocks').count,SKYLINE_CITY.cells**2);
 assert.equal(acousticSurfaceCategory('object:rear-diffuser-skyline-city:skyline-acoustic-proxy:0:0'),'diffuser');
 view.dispose();
});

test('Skyline City position persists and older rooms receive it',()=>{
 const document=createDocument();
 document.rearDiffuser.centerY=1.31;
 assert.equal(parseRoomDocument(JSON.stringify(document)).rearDiffuser.centerY,1.31);
 delete document.rearDiffuser;
 assert.equal(parseRoomDocument(JSON.stringify(document)).rearDiffuser.depth,.15);
});
