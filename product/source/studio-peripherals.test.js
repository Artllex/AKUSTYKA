import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDeskRecord,COMBODESK_88} from './src/desk-model.js';
import {createModulDeskRecord,MODUL_STUDIO_DESK} from './src/modul-desk-model.js';
import {createRackRecord,RACK_15U} from './src/rack-model.js';
import {createAlienwareDisplay} from './src/alienware-display.js';
import {createMotu24Ai,createMoniconXL,createProArtP16,createStreamDeckXL,createGxt144Rexx,createBehringerModelD,createBehringerKobolExpander,MOTU_24AI,MONICON_XL,PROART_P16,STREAM_DECK_XL,GXT_144_REXX,MODEL_D,KOBOL_EXPANDER} from './src/studio-peripherals.js';

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

test('Model D and Kobol Expander occupy separate 3U bays below MOTU in the 19-inch rack',()=>{
 const rack=createRackRecord(room);
 const views=[createBehringerModelD(rack),createBehringerKobolExpander(rack),createMotu24Ai(rack)];
 const boxes=views.map(view=>new THREE.Box3().setFromObject(view.group));
 for(let i=0;i<2;i++){
  assert.equal(views[i].group.userData.rackUnits,3);
  assert.ok(boxes[i].min.x>=-RACK_15U.width/2&&boxes[i].max.x<=RACK_15U.width/2);
  assert.ok(boxes[i].min.y>0&&boxes[i].max.y<RACK_15U.height);
  assert.ok(!boxes[i].intersectsBox(boxes[i+1]),'rack modules need a physical gap');
 }
 assert.ok(Math.abs(new THREE.Box3().setFromObject(views[0].group.getObjectByName('synth-front-panel')).getSize(new THREE.Vector3()).x-MODEL_D.width)<1e-6);
 assert.ok(Math.abs(new THREE.Box3().setFromObject(views[1].group.getObjectByName('synth-front-panel')).getSize(new THREE.Vector3()).x-KOBOL_EXPANDER.width)<1e-6);
 assert.equal(views[0].group.getObjectsByProperty('name','3u-rack-ear').length,2);
 assert.equal(views[1].group.getObjectsByProperty('name','3u-rack-ear').length,2);
 assert.equal(views[1].group.getObjectsByProperty('name','kobol-patch-jack').length,31);
 for(const view of views)view.dispose();
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

for(const [name,record,halfWidth,rear,front,top] of [
 ['A',createDeskRecord(room),COMBODESK_88.worktop.width/2,-COMBODESK_88.worktop.depth+(COMBODESK_88.depth-COMBODESK_88.worktop.depth)/2+COMBODESK_88.worktop.depth/2,(COMBODESK_88.depth-COMBODESK_88.worktop.depth)/2+COMBODESK_88.worktop.depth/2,COMBODESK_88.worktop.top],
 ['B',createModulDeskRecord(room),MODUL_STUDIO_DESK.top.width/2,MODUL_STUDIO_DESK.top.frontZ-MODUL_STUDIO_DESK.top.depth,MODUL_STUDIO_DESK.top.frontZ,MODUL_STUDIO_DESK.height]
])test(`Stream Deck XL and GXT 144 Rexx fit on desk ${name} beside the existing equipment`,()=>{
 const views=[createStreamDeckXL(record),createGxt144Rexx(record),createMoniconXL(record),createProArtP16(record),createAlienwareDisplay(record)];
 const boxes=views.map(view=>new THREE.Box3().setFromObject(view.group));
 for(const box of boxes.slice(0,2)){
  assert.ok(box.min.x>=-halfWidth&&box.max.x<=halfWidth);
  assert.ok(box.min.z>=rear&&box.max.z<=front);
  assert.ok(box.min.y>=top-1e-5);
  for(const other of boxes.slice(2))assert.ok(!box.intersectsBox(other),'new desk object overlaps existing equipment');
 }
 assert.ok(!boxes[0].intersectsBox(boxes[1]));
 assert.equal(views[0].group.getObjectsByProperty('name','stream-deck-lcd-key').length,STREAM_DECK_XL.keys);
 assert.ok(views[0].group.getObjectByName('stream-deck-stand'));
 assert.ok(views[1].group.getObjectByName('vertical-mouse-shell'));
 assert.ok(boxes[1].getSize(new THREE.Vector3()).y<=GXT_144_REXX.height+.01);
 for(const view of views)view.dispose();
});
