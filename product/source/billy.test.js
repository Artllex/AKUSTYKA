import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument,DEFAULT_ROOM,usesDefaultListeningLayout} from './src/model.js';
import {BILLY_BOOKCASE,BILLY_BOOKCASE_ID,createBillyRecord,ensureBillyRecord,moveDefaultBillyWithRoom} from './src/billy-model.js';
import {createBillyView} from './src/billy-view.js';
import {parseRoomDocument} from './src/bench.js';
import {objectReflectingFaces} from './src/object-reflections.js';
import {acousticSurfaceCategory,defaultAcousticSettings,pathAcoustics} from './src/acoustic-simulation.js';

test('BILLY has exact outer dimensions, five open shelves and clears the rear door',()=>{
 const document=createDocument(),record=document.objects.find(object=>object.id===BILLY_BOOKCASE_ID);
 assert.equal(BILLY_BOOKCASE.width,0.6);
 assert.equal(record.model,'ikea-billy-60x28x202');
 const view=createBillyView(record),bounds=new THREE.Box3().setFromObject(view.group),size=bounds.getSize(new THREE.Vector3());
 assert.ok(Math.abs(size.x-BILLY_BOOKCASE.width)<1e-8);
 assert.ok(Math.abs(size.y-BILLY_BOOKCASE.height)<1e-8);
 assert.ok(Math.abs(size.z-BILLY_BOOKCASE.depth)<1e-8);
 assert.equal(view.group.children.filter(part=>/^billy-shelf-\d+$/.test(part.name)).length,5);
 assert.equal(view.group.getObjectByName('billy-side').material.color.getHex(),0x27292b);
 assert.equal(view.group.getObjectByName('billy-shelf-front-1').material.color.getHex(),0x202225);
 assert.equal(view.group.getObjectByName('billy-back').material.color.getHex(),0x222426);
 const doorRight=document.roomFeatures.door.center+document.roomFeatures.door.width/2;
 assert.ok(bounds.min.x>doorRight+0.1);
 assert.ok(bounds.max.x<document.room.width);
 assert.ok(bounds.max.z<document.room.length);
 assert.ok(Math.abs(bounds.min.y)<1e-8);
 const reflecting=objectReflectingFaces([view.group]).faces;
 assert.ok(reflecting.some(face=>face.mesh.name==='billy-back'));
 assert.ok(reflecting.some(face=>face.mesh.name==='billy-shelf-1'));
 assert.equal(acousticSurfaceCategory(reflecting[0].id),'bookcase');
 assert.equal(pathAcoustics({surface:reflecting[0].id,length:3},2,defaultAcousticSettings()).material,'wood');
 view.dispose();
});

test('old 80 cm BILLY documents load as 60 cm without losing placement',()=>{
 const document=createDocument(),record=document.objects.find(object=>object.id===BILLY_BOOKCASE_ID);
 record.id='bookcase-billy-80x28x202';
 record.model='ikea-billy-80x28x202';
 record.position.x+=0.13;
 document.transforms={'bookcase-billy-80x28x202':{x:0.07,y:0,z:0,rx:0,ry:0,rz:0}};
 const loaded=parseRoomDocument(JSON.stringify(document));
 const migrated=loaded.objects.find(object=>object.id===BILLY_BOOKCASE_ID);
 assert.equal(migrated.model,'ikea-billy-60x28x202');
 assert.equal(migrated.position.x,record.position.x);
 assert.equal(loaded.transforms[BILLY_BOOKCASE_ID].x,0.07);
 assert.equal(loaded.transforms['bookcase-billy-80x28x202'],undefined);
 assert.equal(loaded.objects.filter(object=>object.type==='bookcase').length,1);
});

test('BILLY persists, follows default room length and can be added to an old document',()=>{
 const document=createDocument(),nextRoom={...DEFAULT_ROOM,width:3.2,length:4.1};
 assert.equal(usesDefaultListeningLayout(document),true);
 moveDefaultBillyWithRoom(document,nextRoom);
 const record=document.objects.find(object=>object.id===BILLY_BOOKCASE_ID);
 assert.deepEqual(record.position,createBillyRecord(nextRoom).position);
 assert.deepEqual(parseRoomDocument(JSON.stringify(document)).objects.find(object=>object.id===BILLY_BOOKCASE_ID),record);
 record.position.x-=0.1;
 moveDefaultBillyWithRoom(document,{...nextRoom,length:4.4});
 assert.equal(record.position.x,createBillyRecord(nextRoom).position.x-0.1);
 document.objects=document.objects.filter(object=>object.id!==BILLY_BOOKCASE_ID);
 assert.equal(usesDefaultListeningLayout(document),true);
 ensureBillyRecord(document);ensureBillyRecord(document);
 assert.equal(document.objects.filter(object=>object.id===BILLY_BOOKCASE_ID).length,1);
});
