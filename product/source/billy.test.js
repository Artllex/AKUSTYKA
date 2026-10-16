import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument,DEFAULT_ROOM,usesDefaultListeningLayout} from './src/model.js';
import {BILLY_BOOKCASE,BILLY_BOOKCASE_ID,createBillyRecord,ensureBillyRecord,moveDefaultBillyWithRoom} from './src/billy-model.js';
import {createBillyView} from './src/billy-view.js';
import {parseRoomDocument} from './src/bench.js';
import {objectReflectingFaces} from './src/object-reflections.js';
import {acousticSurfaceCategory,defaultAcousticSettings,pathAcoustics} from './src/acoustic-simulation.js';
import {bassTrapPlacement} from './src/bass-trap-model.js';

test('BILLY has exact outer dimensions, five open shelves and clears the rear door',()=>{
 const document=createDocument(),record=document.objects.find(object=>object.id===BILLY_BOOKCASE_ID);
 assert.equal(BILLY_BOOKCASE.width,0.8);
 assert.equal(record.model,'ikea-billy-80x28x202');
 const view=createBillyView(record),bounds=new THREE.Box3().setFromObject(view.group),size=bounds.getSize(new THREE.Vector3());
 const projectedWidth=BILLY_BOOKCASE.width*Math.abs(Math.cos(record.yaw))+BILLY_BOOKCASE.depth*Math.abs(Math.sin(record.yaw));
 const projectedDepth=BILLY_BOOKCASE.width*Math.abs(Math.sin(record.yaw))+BILLY_BOOKCASE.depth*Math.abs(Math.cos(record.yaw));
 assert.ok(Math.abs(size.x-projectedWidth)<1e-8);
 assert.ok(Math.abs(size.y-BILLY_BOOKCASE.height)<1e-8);
 assert.ok(Math.abs(size.z-projectedDepth)<1e-8);
 assert.equal(view.group.children.filter(part=>/^billy-shelf-\d+$/.test(part.name)).length,5);
 assert.equal(view.group.getObjectByName('billy-side').material.color.getHex(),0x27292b);
 assert.equal(view.group.getObjectByName('billy-shelf-front-1').material.color.getHex(),0x202225);
 assert.equal(view.group.getObjectByName('billy-back'),undefined);
 const doorRight=document.roomFeatures.door.center+document.roomFeatures.door.width/2;
 assert.ok(bounds.min.x>doorRight+0.1);
 assert.ok(bounds.max.x<document.room.width);
 assert.ok(bounds.max.z<document.room.length);
 assert.ok(Math.abs(bounds.min.y)<1e-8);
 const reflecting=objectReflectingFaces([view.group]).faces;
 assert.ok(!reflecting.some(face=>face.mesh.name==='billy-back'));
 assert.ok(reflecting.some(face=>face.mesh.name==='billy-shelf-1'));
 assert.equal(acousticSurfaceCategory(reflecting[0].id),'bookcase');
 assert.equal(pathAcoustics({surface:reflecting[0].id,length:3},2,defaultAcousticSettings()).material,'wood');
 view.dispose();
});

test('BILLY stands parallel to the rear-right trap diagonal with wall and trap clearance',()=>{
 const document=createDocument(),record=document.objects.find(object=>object.id===BILLY_BOOKCASE_ID);
 const trap=bassTrapPlacement(document.bassTraps.find(item=>item.corner==='rear-right'),document.room);
 const diagonal=new THREE.Vector2(trap.diagonal[1][0]-trap.diagonal[0][0],trap.diagonal[1][1]-trap.diagonal[0][1]).normalize();
 const shelfDirection=new THREE.Vector2(Math.cos(record.yaw),-Math.sin(record.yaw));
 assert.ok(Math.abs(shelfDirection.dot(diagonal))>1-1e-8);
 const view=createBillyView(record),bounds=new THREE.Box3().setFromObject(view.group);
 const corners=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([sx,sz])=>{
  const x=sx*BILLY_BOOKCASE.width/2,z=sz*BILLY_BOOKCASE.depth/2;
  return [record.position.x+x*Math.cos(record.yaw)+z*Math.sin(record.yaw),record.position.z-x*Math.sin(record.yaw)+z*Math.cos(record.yaw)];
 });
 const maxSum=Math.max(...corners.map(([x,z])=>x+z));
 const trapLine=document.room.width+document.room.length-trap.leg;
 assert.ok((trapLine-maxSum)/Math.SQRT2>=0.05,'bookcase must clear the trap face');
 assert.ok(bounds.max.x<=document.room.width-0.019);
 assert.ok(bounds.max.z<=document.room.length-0.019);
 const doorRight=document.roomFeatures.door.center+document.roomFeatures.door.width/2;
 assert.ok(bounds.min.x>doorRight+0.1);
 view.dispose();
});

test('untouched rear-wall BILLY documents migrate to the angled position',()=>{
 const document=createDocument(),record=document.objects.find(object=>object.id===BILLY_BOOKCASE_ID);
 const doorRight=document.roomFeatures.door.center+document.roomFeatures.door.width/2;
 record.position={x:doorRight+(document.room.width-doorRight)/2,y:0,z:document.room.length-BILLY_BOOKCASE.depth/2-0.015};
 record.yaw=0;
 const migrated=parseRoomDocument(JSON.stringify(document)).objects.find(object=>object.id===BILLY_BOOKCASE_ID);
 assert.deepEqual(migrated.position,createBillyRecord(document.room).position);
 assert.equal(migrated.yaw,Math.PI/4);
 record.position.x-=0.1;
 const custom=parseRoomDocument(JSON.stringify(document)).objects.find(object=>object.id===BILLY_BOOKCASE_ID);
 assert.deepEqual(custom.position,record.position);
 assert.equal(custom.yaw,0);
});

test('old 60 cm BILLY documents load as 80 cm without losing custom placement',()=>{
 const document=createDocument(),record=document.objects.find(object=>object.id===BILLY_BOOKCASE_ID);
 record.id='bookcase-billy-60x28x202';
 record.model='ikea-billy-60x28x202';
 record.position.x+=0.13;
 document.transforms={'bookcase-billy-60x28x202':{x:0.07,y:0,z:0,rx:0,ry:0,rz:0}};
 const loaded=parseRoomDocument(JSON.stringify(document));
 const migrated=loaded.objects.find(object=>object.id===BILLY_BOOKCASE_ID);
 assert.equal(migrated.model,'ikea-billy-80x28x202');
 assert.equal(migrated.position.x,record.position.x);
 assert.equal(loaded.transforms[BILLY_BOOKCASE_ID].x,0.07);
 assert.equal(loaded.transforms['bookcase-billy-60x28x202'],undefined);
 assert.equal(loaded.objects.filter(object=>object.type==='bookcase').length,1);
});

test('untouched 60 cm BILLY moves to a safe 80 cm corner position on load',()=>{
 const document=createDocument(),record=document.objects.find(object=>object.id===BILLY_BOOKCASE_ID);
 const oldCornerOffset=(0.6+BILLY_BOOKCASE.depth)/(2*Math.SQRT2)+0.02;
 record.id='bookcase-billy-60x28x202';record.model='ikea-billy-60x28x202';
 record.position={x:document.room.width-oldCornerOffset,y:0,z:document.room.length-oldCornerOffset};
 const loaded=parseRoomDocument(JSON.stringify(document));
 assert.deepEqual(loaded.objects.find(object=>object.id===BILLY_BOOKCASE_ID).position,createBillyRecord(document.room).position);
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
