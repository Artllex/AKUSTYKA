import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDeskRecord,COMBODESK_88} from './src/desk-model.js';
import {createModulDeskRecord,MODUL_STUDIO_DESK} from './src/modul-desk-model.js';
import {createRackRecord,RACK_15U} from './src/rack-model.js';
import {createAlienwareDisplay} from './src/alienware-display.js';
import {createMotu24Ai,createMoniconXL,createProArtP16,MOTU_24AI,MONICON_XL,PROART_P16} from './src/studio-peripherals.js';

const room={width:2.477,length:3.715,height:2.605};

test('MOTU 24Ai occupies one unit between the RIVECO mounting rails',()=>{
 const view=createMotu24Ai(createRackRecord(room));
 const front=new THREE.Box3().setFromObject(view.group.getObjectByName('motu-front-panel'));
 const body=new THREE.Box3().setFromObject(view.group.getObjectByName('motu-chassis'));
 assert.ok(Math.abs(front.max.x-front.min.x-MOTU_24AI.width)<1e-8);
 assert.ok(front.min.x>-RACK_15U.width/2&&front.max.x<RACK_15U.width/2);
 assert.ok(Math.abs(front.max.y-front.min.y-RACK_15U.mountingHeight/15)<1e-8);
 assert.ok(body.min.z>-RACK_15U.depth/2&&body.max.z<RACK_15U.depth/2);
 assert.ok(view.group.getObjectByName('meter-glass'));
 assert.equal(view.group.getObjectsByProperty('name','analog-db25').length,3);
 view.dispose();
});

for(const [name,record,halfWidth,rear,front,top] of [
 ['A',createDeskRecord(room),COMBODESK_88.worktop.width/2,-COMBODESK_88.worktop.depth+(COMBODESK_88.depth-COMBODESK_88.worktop.depth)/2+COMBODESK_88.worktop.depth/2,(COMBODESK_88.depth-COMBODESK_88.worktop.depth)/2+COMBODESK_88.worktop.depth/2,COMBODESK_88.worktop.top],
 ['B',createModulDeskRecord(room),MODUL_STUDIO_DESK.top.width/2,MODUL_STUDIO_DESK.top.frontZ-MODUL_STUDIO_DESK.top.depth,MODUL_STUDIO_DESK.top.frontZ,MODUL_STUDIO_DESK.height]
])test(`Palmer and ASUS remain fully on desk ${name}, clear of the Alienware display`,()=>{
 const palmer=createMoniconXL(record),laptop=createProArtP16(record),display=createAlienwareDisplay(record);
 const left=new THREE.Box3().setFromObject(laptop.group),right=new THREE.Box3().setFromObject(palmer.group),screen=new THREE.Box3().setFromObject(display.group.getObjectByName('curved-oled-screen'));
 for(const box of [left,right]){
  assert.ok(box.min.x>=-halfWidth-1e-5&&box.max.x<=halfWidth+1e-5);
  assert.ok(box.min.z>=rear-1e-5&&box.max.z<=front+1e-5);
  assert.ok(box.min.y>=top-1e-5);
  assert.ok(!box.intersectsBox(screen));
 }
 assert.ok(!left.intersectsBox(right));
 assert.ok(Math.abs(right.max.x-right.min.x-MONICON_XL.width)<.005);
 assert.ok(Math.abs(left.max.x-left.min.x-PROART_P16.width)<.005);
 assert.ok(palmer.group.getObjectByName('main-volume-knob'));
 assert.equal(laptop.group.getObjectsByProperty('name','keyboard-key').length,96);
 const oled=laptop.group.getObjectByName('display-wallpaper').geometry.parameters;
 assert.ok(Math.abs(oled.width/oled.height-1.6)<.001,'ProArt panel follows the 16:10 display ratio');
 palmer.dispose();laptop.dispose();display.dispose();
});
