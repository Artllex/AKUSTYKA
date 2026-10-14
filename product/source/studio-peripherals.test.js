import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDeskRecord,COMBODESK_88} from './src/desk-model.js';
import {createModulDeskRecord,MODUL_STUDIO_DESK} from './src/modul-desk-model.js';
import {createModul1520DeskRecord,MODUL_1520_DESK} from './src/modul-1520-desk-model.js';
import {createRackRecord,RACK_15U} from './src/rack-model.js';
import {createAlienwareDisplay} from './src/alienware-display.js';
import {createMotu24Ai,createMoniconXL,createProArtP16,createStreamDeckXL,createGxt144Rexx,createBehringerModelD,createBehringerKobolExpander,MOTU_24AI,MONICON_XL,PROART_P16,STREAM_DECK_XL,GXT_144_REXX,MODEL_D,KOBOL_EXPANDER} from './src/studio-peripherals.js';

const room={width:2.477,length:3.715,height:2.605};
function renderCost(group){
 let triangles=0,draws=0;
 group.traverse(object=>{
  if(!object.isMesh)return;
  draws++;
  const geometry=object.geometry,faces=geometry.index?geometry.index.count/3:geometry.getAttribute('position').count/3;
  triangles+=faces*(object.isInstancedMesh?object.count:1);
 });
 return {triangles,draws};
}

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

test('Model D has the sloped instrument body, wooden sides and rear output pair',()=>{
 const view=createBehringerModelD();
 const group=view.group,body=group.getObjectByName('model-d-formed-chassis');
 const vertices=body.geometry.getAttribute('position');
 let frontTop=-Infinity,rearTop=-Infinity;
 for(let i=0;i<vertices.count;i++){
  if(Math.abs(vertices.getZ(i)+MODEL_D.depth/2)<.0001)frontTop=Math.max(frontTop,vertices.getY(i));
  if(Math.abs(vertices.getZ(i)-(.068-.011))<.0001)rearTop=Math.max(rearTop,vertices.getY(i));
 }
 assert.ok(rearTop-frontTop>.04,'instrument must rise toward its rear');
 assert.ok(group.getObjectByName('model-d-sloped-control-panel').rotation.x<0);
 assert.equal(group.getObjectsByProperty('name','model-d-wood-side').length,2);
 const cheek=group.getObjectByName('model-d-wood-side').geometry.getAttribute('position');
 const base=[];for(let i=0;i<cheek.count;i++)if(cheek.getY(i)<-.043)base.push(cheek.getZ(i));
 assert.ok(Math.min(...base)>-.06&&Math.max(...base)<.06,'the flat base must be inset from the upper ends');
 assert.equal(group.getObjectByName('model-d-side-screws').count,8);
 assert.equal(group.getObjectsByProperty('name','model-d-rear-output-rim').length,2);
 assert.equal(group.getObjectByName('model-d-knobs').count,27);
 assert.equal(group.getObjectByName('model-d-output-knobs').count,2);
 const ear=new THREE.Box3().setFromObject(group.getObjectByName('3u-rack-ear'));
 assert.ok(ear.getSize(new THREE.Vector3()).y<.025,'mounting tabs must stay below the instrument face');
 assert.ok(group.getObjectByName('model-d-rack-crossbar'),'mounting tabs need a continuous support');
 assert.ok(renderCost(group).draws<60,'repeated controls should share draw calls');
 view.dispose();
});

for(const [name,record,halfWidth,rear,front,top] of [
 ['A',createDeskRecord(room),COMBODESK_88.worktop.width/2,-COMBODESK_88.worktop.depth+(COMBODESK_88.depth-COMBODESK_88.worktop.depth)/2+COMBODESK_88.worktop.depth/2,(COMBODESK_88.depth-COMBODESK_88.worktop.depth)/2+COMBODESK_88.worktop.depth/2,COMBODESK_88.worktop.top],
 ['B',createModulDeskRecord(room),MODUL_STUDIO_DESK.top.width/2,MODUL_STUDIO_DESK.top.frontZ-MODUL_STUDIO_DESK.top.depth,MODUL_STUDIO_DESK.top.frontZ,MODUL_STUDIO_DESK.height],
 ['C',createModul1520DeskRecord(room),MODUL_1520_DESK.worktop.width/2,-MODUL_1520_DESK.worktop.depth/2,MODUL_1520_DESK.worktop.frontZ,MODUL_1520_DESK.worktopHeight]
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
 assert.equal(laptop.group.getObjectByName('keyboard-keys').count,96);
 const oled=laptop.group.getObjectByName('display-wallpaper').geometry.parameters;
 assert.ok(Math.abs(oled.width/oled.height-1.6)<.001,'ProArt panel follows the 16:10 display ratio');
 palmer.dispose();laptop.dispose();display.dispose();
});

for(const [name,record,halfWidth,rear,front,top] of [
 ['A',createDeskRecord(room),COMBODESK_88.worktop.width/2,-COMBODESK_88.worktop.depth+(COMBODESK_88.depth-COMBODESK_88.worktop.depth)/2+COMBODESK_88.worktop.depth/2,(COMBODESK_88.depth-COMBODESK_88.worktop.depth)/2+COMBODESK_88.worktop.depth/2,COMBODESK_88.worktop.top],
 ['B',createModulDeskRecord(room),MODUL_STUDIO_DESK.top.width/2,MODUL_STUDIO_DESK.top.frontZ-MODUL_STUDIO_DESK.top.depth,MODUL_STUDIO_DESK.top.frontZ,MODUL_STUDIO_DESK.height],
 ['C',createModul1520DeskRecord(room),MODUL_1520_DESK.worktop.width/2,-MODUL_1520_DESK.worktop.depth/2,MODUL_1520_DESK.worktop.frontZ,MODUL_1520_DESK.worktopHeight]
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
 assert.equal(views[0].group.getObjectByName('stream-deck-lcd-keys').count,STREAM_DECK_XL.keys);
 assert.equal(views[0].group.getObjectByName('stream-deck-key-icons').count,STREAM_DECK_XL.keys);
 assert.ok(views[0].group.getObjectByName('stream-deck-stand'));
 assert.ok(views[1].group.getObjectByName('vertical-mouse-shell'));
 assert.ok(boxes[1].getSize(new THREE.Vector3()).y<=GXT_144_REXX.height+.01);
 const rexx=views[1].group;
 for(const part of ['mouse-sole','thumb-lip-seam','left-click','right-click','button-seam','scroll-wheel','red-wheel-light','braided-cable'])assert.ok(rexx.getObjectByName(part),part);
 assert.ok(rexx.getObjectByName('vertical-mouse-shell').geometry.getAttribute('color'),'the thumb recess is shaded on the continuous shell');
 assert.equal(rexx.getObjectsByProperty('name','thumb-button').length,2);
 assert.ok(rexx.getObjectByName('mouse-sole').geometry.type==='ExtrudeGeometry','the foot follows an organic outline');
 assert.ok(renderCost(rexx).triangles<8000&&renderCost(rexx).draws<20);
 assert.ok(renderCost(views[0].group).triangles<9000);
 assert.ok(renderCost(views[0].group).draws<10);
 for(const view of views)view.dispose();
});

test('repeated laptop keys use one compact draw call',()=>{
 const laptop=createProArtP16(createDeskRecord(room));
 const keys=laptop.group.getObjectByName('keyboard-keys');
 assert.ok(keys.isInstancedMesh);
 assert.equal(keys.count,96);
 assert.ok(renderCost(laptop.group).triangles<13000);
 assert.ok(renderCost(laptop.group).draws<45);
 laptop.dispose();
});

test('Monicon XL follows the photographed wedge profile and control layout',()=>{
 const view=createMoniconXL(createDeskRecord(room));
 const group=view.group;
 const caps=group.getObjectsByProperty('name','textured-side-cap');
 assert.equal(caps.length,2);
 assert.equal(group.getObjectsByProperty('name','orange-side-seam').length,2);
 assert.equal(group.getObjectsByProperty('name','front-headphone-rim').length,2);
 assert.equal(group.getObjectsByProperty('name','balanced-rear-jack-rim').length,14);
 assert.ok(!group.getObjectByName('wood-side-cheek'));
 const upper=group.getObjectByName('upper-control-panel');
 const lower=group.getObjectByName('lower-control-panel');
 assert.ok(group.getObjectByName('rear-top-shelf'),'branding needs its own horizontal rear shelf');
 assert.ok(upper.position.z<lower.position.z&&upper.position.y>lower.position.y);
 assert.ok(upper.rotation.x>0&&lower.rotation.x>0);
 const body=group.getObjectByName('formed-metal-chassis');
 body.geometry.computeBoundingBox();
 const vertices=body.geometry.getAttribute('position');
 const topAt=z=>{
  let top=0;
  for(let i=0;i<vertices.count;i++)if(Math.abs(vertices.getZ(i)-z)<.0001)top=Math.max(top,vertices.getY(i));
  return top;
 };
 const rearTop=topAt(-MONICON_XL.depth/2),shelfEnd=topAt(-.078),ridge=topAt(-.012),frontTop=topAt(MONICON_XL.depth/2);
 assert.ok(Math.abs(rearTop-shelfEnd)<1e-6,'rear shelf must be level across its depth');
 assert.ok(shelfEnd>ridge+.02&&ridge>frontTop+.02,'two distinct slopes must follow the shelf');
 const knob=group.getObjectByName('main-volume-knob');
 assert.ok(knob.geometry.parameters.radiusTop<.02,'main knob should not dominate the panel');
 view.dispose();
});
