import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {AW3423DWF,createAlienwareDisplay} from './src/alienware-display.js';
import {createDeskRecord,COMBODESK_88} from './src/desk-model.js';
import {MODUL_STUDIO_DESK} from './src/modul-desk-model.js';
import {chooseDesk} from './src/desk-choice.js';
import {createDocument} from './src/model.js';
import {createDeskView} from './src/desk-view.js';
import {createModulDeskView} from './src/modul-desk-view.js';
import {createStudioMonitor} from './src/monitor-view.js';
import {createSeatedListener} from './src/listener-view.js';
import {createTweeterRays} from './src/tweeter-rays.js';

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
  const base=new THREE.Box3();
  for(const part of display.group.children.filter(item=>item.name==='v-foot'||item.name==='rear-foot'))base.expandByObject(part);
  assert.ok(bounds.min.y>=top-1e-7);
  assert.ok(base.min.z>=rear-1e-7);
  assert.ok(base.min.z<rear+.01);
  assert.ok(base.max.z<=front+1e-7);
  assert.ok(bounds.min.z>=rear-.045,'rear shell and vent overhang the back edge by at most 4.5 cm');
  assert.ok(bounds.max.x-bounds.min.x<=AW3423DWF.width+.002);
  for(const foot of display.group.children.filter(part=>part.name==='v-foot')){
   const vertices=foot.geometry.attributes.position;
   let tip=-Infinity,root=Infinity;
   for(let i=0;i<vertices.count;i++){
    if(Math.abs(vertices.getX(i))>.22)tip=Math.max(tip,vertices.getZ(i));
    if(Math.abs(vertices.getX(i))<.04)root=Math.min(root,vertices.getZ(i));
   }
   assert.ok(tip>.14&&root<0,'V feet point toward the listener (+Z)');
  }
  display.dispose();
 }
});

test('the two tweeter rays clear the complete display on both desks',()=>{
 const doc=createDocument();
 for(const id of ['desk-combodesk-88','desk-modul-2025']){
  chooseDesk(doc,id);
  const record=doc.objects.find(o=>o.type==='studio-desk');
  const desk=id==='desk-modul-2025'?createModulDeskView(record):createDeskView(record);
  const display=createAlienwareDisplay(record);desk.group.add(display.group);desk.group.updateMatrixWorld(true);
  const listener=createSeatedListener(doc.objects.find(o=>o.type==='seated-listener'));
  const speakers=doc.objects.filter(o=>o.type==='studio-monitor').map(createStudioMonitor);
  const rays=createTweeterRays(speakers,listener,doc.room);
  const shellBounds=new THREE.Box3().setFromObject(display.group.getObjectByName('curved-rear-shell-1800r'));
  for(const ray of rays.group.children.filter(part=>part.name.startsWith('ray-'))){
   const {origin,direction,target}=ray.userData;
   const hits=new THREE.Raycaster(origin,direction,0,target.distanceTo(origin)).intersectObject(display.group,true);
   assert.equal(hits.length,0,`${id}: ${ray.name} must clear the display`);
   // In the top view the beam must also miss the screen's footprint, regardless of height.
   if(shellBounds.max.z>=origin.z){
    const x=origin.x+(shellBounds.max.z-origin.z)*direction.x/direction.z;
    assert.ok(direction.x>0?x<shellBounds.min.x-.005:x>shellBounds.max.x+.005,`${id}: ${ray.name} must miss the screen in plan view`);
   }
  }
  rays.dispose();listener.dispose();for(const speaker of speakers)speaker.dispose();display.dispose();desk.dispose();
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

test('height-adjustment stem and neck stay behind the OLED screen',()=>{
 const display=createAlienwareDisplay(createDeskRecord({width:2.477,length:3.715}));
 const screen=new THREE.Box3().setFromObject(display.group.getObjectByName('curved-oled-screen'));
 for(const name of ['stand-stem','stand-neck']){
  const part=new THREE.Box3().setFromObject(display.group.getObjectByName(name));
  assert.ok(part.max.z<screen.min.z,`${name} must not pierce the visible screen`);
 }
 display.dispose();
});
