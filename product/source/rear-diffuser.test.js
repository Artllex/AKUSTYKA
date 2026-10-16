import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument} from './src/model.js';
import {parseRoomDocument} from './src/bench.js';
import {createRearDiffuserView,BINARY_DIFFUSER} from './src/rear-diffuser.js';
import {BILLY_BOOKCASE,BILLY_BOOKCASE_ID} from './src/billy-model.js';
import {acousticSurfaceCategory} from './src/acoustic-simulation.js';

test('binary diffuser is portrait, 1 cm above the rear switch, and clears the ceiling, door and BILLY',()=>{
 const document=createDocument(),record=document.rearDiffuser,room=document.room;
 assert.equal(record.id,'rear-diffuser-binary');
 assert.equal(record.width,.6);assert.equal(record.height,1.2);assert.equal(record.depth,.11);
 assert.equal(record.centerX,document.roomFeatures.switch.center);
 const switchTop=document.roomFeatures.switch.bottom+document.roomFeatures.switch.height;
 assert.ok(Math.abs(record.centerY-record.height/2-switchTop-BINARY_DIFFUSER.switchGap)<1e-9);
 assert.ok(record.centerY+record.height/2<room.height);
 const doorRight=document.roomFeatures.door.center+document.roomFeatures.door.width/2;
 const billy=document.objects.find(item=>item.id===BILLY_BOOKCASE_ID);
 const billyLeft=billy.position.x-(BILLY_BOOKCASE.width*Math.abs(Math.cos(billy.yaw))+BILLY_BOOKCASE.depth*Math.abs(Math.sin(billy.yaw)))/2;
 assert.ok(record.centerX-record.width/2>doorRight);
 assert.ok(record.centerX+record.width/2<billyLeft);
 const view=createRearDiffuserView(record,room);
 const bounds=new THREE.Box3().setFromObject(view.group),size=bounds.getSize(new THREE.Vector3());
 assert.ok(Math.abs(size.x-.6)<1e-6);assert.ok(Math.abs(size.y-1.2)<1e-6);assert.ok(Math.abs(size.z-.11)<1e-6);
 assert.ok(Math.abs(bounds.max.z-room.length)<1e-6);
 assert.ok(view.group.getObjectByName('binary-perforation').count>400);
 assert.equal(view.group.getObjectByName('skyline-blocks'),undefined);
 assert.equal(acousticSurfaceCategory('object:rear-diffuser-binary:binary-acoustic-proxy:0:0'),'diffuser');
 view.dispose();
});

test('old Skyline is replaced on load; an explicitly absent rear panel stays absent',()=>{
 const document=createDocument();
 document.rearDiffuser={id:'rear-diffuser-skyline-city',model:'asound-skyline-city-44x44x15',width:.44,height:.44,depth:.15,centerX:1.4,centerY:1.185};
 const migrated=parseRoomDocument(JSON.stringify(document));
 assert.equal(migrated.rearDiffuser.id,'rear-diffuser-binary');
 assert.equal(migrated.rearDiffuser.depth,.11);
 delete document.rearDiffuser;
 assert.equal(parseRoomDocument(JSON.stringify(document)).rearDiffuser.id,'rear-diffuser-binary');
 document.rearDiffuser=null;
 assert.equal(parseRoomDocument(JSON.stringify(document)).rearDiffuser,null);
});
