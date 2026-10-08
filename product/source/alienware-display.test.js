import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {AW3423DWF,createAlienwareDisplay} from './src/alienware-display.js';
import {createDeskRecord,COMBODESK_88} from './src/desk-model.js';
import {MODUL_STUDIO_DESK} from './src/modul-desk-model.js';
import {chooseDesk} from './src/desk-choice.js';
import {createDocument} from './src/model.js';

test('AW3423DWF stands on either selected worktop, inside its footprint',()=>{
 const doc=createDocument();
 for(const [id,top,rear,front] of [
  ['desk-combodesk-88',COMBODESK_88.worktop.top,-.317,.358],
  ['desk-modul-2025',MODUL_STUDIO_DESK.height,-.25,.35]
 ]){
  chooseDesk(doc,id);
  assert.equal(doc.objects.filter(o=>o.type==='studio-desk').length,1);
  const record=doc.objects.find(o=>o.type==='studio-desk');
  const display=createAlienwareDisplay(record);
  assert.equal(display.group.position.y,top);
  const bounds=new THREE.Box3().setFromObject(display.group);
  assert.ok(bounds.min.y>=top-1e-7);
  assert.ok(bounds.min.z>=rear-1e-7);
  assert.ok(bounds.max.z<=front+1e-7);
  assert.ok(bounds.max.x-bounds.min.x<=AW3423DWF.width+.002);
  display.dispose();
 }
});

test('OLED panel curves toward the viewer by the specified 1800R radius',()=>{
 const display=createAlienwareDisplay(createDeskRecord({width:2.477,length:3.715}));
 const panel=display.group.getObjectByName('curved-oled-screen');
 const shell=display.group.getObjectByName('curved-rear-shell-1800r');
 const points=panel.geometry.attributes.position;
 const center=points.getZ(32),edge=points.getZ(0);
 const half=(AW3423DWF.width-.018)/2;
 const expected=AW3423DWF.curveRadius-Math.sqrt(AW3423DWF.curveRadius**2-half**2);
 assert.ok(Math.abs(edge-center-expected)<1e-5);
 const shellPoints=shell.geometry.attributes.position;
 let shellFront=-Infinity;
 for(let i=0;i<shellPoints.count;i++)if(Math.abs(shellPoints.getX(i))<1e-6)shellFront=Math.max(shellFront,shellPoints.getZ(i)+shell.position.z);
 assert.ok(center+panel.position.z>shellFront+.001);
 assert.ok(Math.abs(display.group.userData.dimensions.width-.81525)<1e-8);
 display.dispose();
});
