import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument,DEFAULT_ROOM} from './src/model.js';
import {parseRoomDocument} from './src/bench.js';
import {createBillyRecord,BILLY_BOOKCASE} from './src/billy-model.js';
import {createPvm20m2eRecord,ensurePvm20m2eRecord,moveDefaultPvm20m2eWithFeatures,PVM_20M2E,PVM_20M2E_ID,pvm20m2eClearances} from './src/pvm-20m2e-model.js';
import {createPvm20m2eView} from './src/pvm-20m2e-view.js';
import {acousticSurfaceCategory} from './src/acoustic-simulation.js';

test('PVM chassis matches the specified envelope and has CRT/front/rear detail',()=>{
 const record=createPvm20m2eRecord(DEFAULT_ROOM),view=createPvm20m2eView(record,{mount:false}),cabinet=view.group.getObjectByName('pvm-cabinet');
 const size=new THREE.Box3().setFromObject(cabinet).getSize(new THREE.Vector3());
 for(const [actual,expected] of [[size.x,.450],[size.y,.458],[size.z,.503]])assert.ok(Math.abs(actual-expected)<1e-6);
 for(const name of ['pvm-curved-crt-glass','pvm-control-knob-0','pvm-rear-ventilation','pvm-ac-inlet','pvm-bnc-rim-0-0'])assert.ok(view.group.getObjectByName(name),name);
 const screen=view.group.getObjectByName('pvm-curved-crt-glass').geometry.attributes.position;
 const middle=12*33+16,edge=12*33;
 assert.ok(screen.getZ(middle)<screen.getZ(edge)-.005);
 assert.ok(view.group.getObjectByName('pvm-control-knob-0').position.x<0);
 assert.ok(view.group.getObjectByName('pvm-rear-ventilation').position.z>=0);
 view.dispose();
});

test('PVM is centered below rear switch and clears door, Billy and rear wall',()=>{
 const doc=createDocument(),record=doc.objects.find(item=>item.id===PVM_20M2E_ID),clearance=pvm20m2eClearances(record,doc.room,doc.roomFeatures);
 assert.equal(record.position.x,doc.roomFeatures.switch.center);
 assert.ok(Math.abs(clearance.switchGap-.01)<1e-9);
 assert.ok(Math.abs(clearance.wallGap-PVM_20M2E.wallBracket)<1e-9);
 assert.ok(clearance.doorGap>.1);
 const billy=createBillyRecord(doc.room),halfProjected=(BILLY_BOOKCASE.width+BILLY_BOOKCASE.depth)/(2*Math.SQRT2);
 assert.ok(billy.position.x-halfProjected-clearance.right>.05);
 assert.ok(clearance.bottom>.6);
});

test('PVM persists in saved rooms, appears once in older rooms and follows an untouched switch',()=>{
 const doc=createDocument();assert.equal(acousticSurfaceCategory('object:'+PVM_20M2E_ID+':pvm-cabinet'),'television');
 const saved=parseRoomDocument(JSON.stringify(doc));assert.equal(saved.objects.filter(item=>item.id===PVM_20M2E_ID).length,1);
 const old={...doc,objects:doc.objects.filter(item=>item.id!==PVM_20M2E_ID)};
 const migrated=parseRoomDocument(JSON.stringify(old));assert.equal(migrated.objects.filter(item=>item.id===PVM_20M2E_ID).length,1);
 ensurePvm20m2eRecord(migrated);assert.equal(migrated.objects.filter(item=>item.id===PVM_20M2E_ID).length,1);
 const features=structuredClone(doc.roomFeatures);features.switch.center+=.03;features.switch.bottom+=.02;
 moveDefaultPvm20m2eWithFeatures(doc,features);
 assert.equal(doc.objects.find(item=>item.id===PVM_20M2E_ID).position.x,features.switch.center);
 assert.ok(Math.abs(doc.objects.find(item=>item.id===PVM_20M2E_ID).position.y-(features.switch.bottom-.01-.458))<1e-9);
});
