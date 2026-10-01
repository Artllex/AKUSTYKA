import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument,DEFAULT_ROOM} from './src/model.js';
import {parseRoomDocument} from './src/bench.js';
import {createRoom} from './src/room-view.js';
import {defaultRoomFeatures,normalizeRoomFeatures,createRoomFeatureViews} from './src/room-features.js';
import {surfaceProjection} from './src/projection.js';
import {RECTA_HANDLE} from './src/recta-handle.js';
test('Govee H60A6 has a 38 cm opaque collar and a 36 by 1.5 cm luminous collar',()=>{
 const views=createRoomFeatureViews(DEFAULT_ROOM,defaultRoomFeatures(DEFAULT_ROOM)),lamp=views.find(v=>v.group.name==='ceiling-light');assert.ok(lamp);
 const bounds=new THREE.Box3().setFromObject(lamp.group),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
 assert.ok(Math.abs(center.x-DEFAULT_ROOM.width/2)<1e-8);assert.ok(Math.abs(center.z-DEFAULT_ROOM.length/2)<1e-8);
 assert.ok(Math.abs(size.x-.38)<1e-8);assert.ok(Math.abs(size.z-.38)<1e-8);assert.ok(Math.abs(bounds.max.y-DEFAULT_ROOM.height)<1e-8);assert.ok(Math.abs(size.y-.06)<1e-8);
 const body=lamp.group.getObjectByName('govee-h60a6-body'),ring=lamp.group.getObjectByName('govee-h60a6-glow-ring'),plate=lamp.group.getObjectByName('govee-h60a6-diffuser');
 const bodyBounds=new THREE.Box3().setFromObject(body),ringBounds=new THREE.Box3().setFromObject(ring),plateBounds=new THREE.Box3().setFromObject(plate);
 const bodySize=bodyBounds.getSize(new THREE.Vector3()),ringSize=ringBounds.getSize(new THREE.Vector3());
 assert.ok(Math.abs(bodySize.x-.38)<1e-6&&Math.abs(bodySize.y-.045)<1e-6);
 assert.ok(Math.abs(ringSize.x-.36)<1e-6&&Math.abs(ringSize.y-.015)<1e-6);
 assert.ok(Math.abs(ringBounds.max.y-DEFAULT_ROOM.height)<1e-6,'the glowing collar touches the ceiling');
 assert.ok(Math.abs(ringBounds.min.y-bodyBounds.max.y)<1e-6,'the opaque collar sits below the glowing one');
 assert.ok(Math.abs(bodyBounds.min.y-plateBounds.min.y)<1e-6,'the flat glowing plate closes the underside');
 assert.equal(body.material.emissive.getHex(),0);assert.ok(ring.material.emissive.getHex()>0&&plate.material.emissive.getHex()>0);
 assert.ok(plateBounds.getSize(new THREE.Vector3()).y<=.002001);
 assert.equal(lamp.group.getObjectByName('govee-h60a6-glow-lip'),undefined);
 for(const view of views)view.dispose();
});
test('window and door are true wall openings and retain projection dimensions',()=>{
 const features=defaultRoomFeatures(DEFAULT_ROOM),room=createRoom(DEFAULT_ROOM,features);room.group.updateMatrixWorld(true);
 for(const [name,opening,z,direction] of [['wall-front',features.window,0,-1],['wall-back',features.door,DEFAULT_ROOM.length,1]]){
  const wall=room.surfaces.find(s=>s.name===name),ray=new THREE.Raycaster(new THREE.Vector3(opening.center,(opening.bottom??0)+opening.height/2,z-direction),new THREE.Vector3(0,0,direction));
  assert.equal(ray.intersectObject(wall).length,0);
  const solid=new THREE.Raycaster(new THREE.Vector3(DEFAULT_ROOM.width-0.05,DEFAULT_ROOM.height-0.05,z-direction),new THREE.Vector3(0,0,direction));assert.ok(solid.intersectObject(wall).length>0);
  assert.ok(surfaceProjection(wall,1.6).camera.isOrthographicCamera);
 }
 room.dispose();
});
test('niche holds an upper tilt pane and a wider fixed lower pane with measured clear openings',()=>{
 const features=defaultRoomFeatures(DEFAULT_ROOM),views=createRoomFeatureViews(DEFAULT_ROOM,features),recess=views.find(v=>v.group.name==='window').group;
 assert.ok(recess.getObjectByName('recess-back'));assert.equal(features.window.bottom,0);assert.equal(features.window.depth,0.151);assert.equal(features.window.stepDepth,0.065);assert.equal(features.window.stepHeight,0.08);assert.ok(Math.abs(features.window.height-2.22)<1e-9);assert.ok(recess.getObjectByName('niche-roof'));
 const step=recess.getObjectByName('niche-step'),sill=recess.getObjectByName('niche-sill');assert.ok(step&&sill);recess.updateMatrixWorld(true);
 const baseBox=new THREE.Box3().setFromObject(step),sillBox=new THREE.Box3().setFromObject(sill);
 assert.ok(Math.abs(baseBox.min.z+.151)<1e-7&&Math.abs(baseBox.max.z+.086)<1e-7&&Math.abs(baseBox.max.y-.065)<1e-7);
 assert.ok(Math.abs(sillBox.min.y-.065)<1e-7&&Math.abs(sillBox.max.y-.08)<1e-7&&Math.abs(sillBox.max.z+.071)<1e-7);
 const undersideHit=new THREE.Raycaster(new THREE.Vector3(features.window.center,.03,-.0785),new THREE.Vector3(0,1,0)).intersectObject(sill);
 assert.ok(undersideHit.length>0&&Math.abs(undersideHit[0].point.y-.065)<1e-7,'the sill has a solid underside');
 const room=createRoom(DEFAULT_ROOM,features);room.group.updateMatrixWorld(true);
 const front=room.surfaces.find(s=>s.name==='niche-step-front'),sillFront=room.surfaces.find(s=>s.name==='niche-sill-front'),top=room.surfaces.find(s=>s.name==='niche-step-top');
 assert.ok(front&&sillFront&&top);assert.ok(Math.abs(front.position.z+.086)<1e-8&&Math.abs(sillFront.position.z+.071)<1e-8);
 const frontBounds=new THREE.Box3().setFromObject(front),sillBounds=new THREE.Box3().setFromObject(sillFront),topBounds=new THREE.Box3().setFromObject(top);
 assert.ok(Math.abs(frontBounds.max.y-.065)<1e-7&&Math.abs(sillBounds.min.y-.065)<1e-7&&Math.abs(sillBounds.max.y-.08)<1e-7&&Math.abs(topBounds.max.z+.071)<1e-7);room.dispose();
 const upper=recess.getObjectByName('window-upper-tilt-glass'),lower=recess.getObjectByName('window-lower-fixed-glass');assert.ok(upper&&lower);assert.ok(recess.getObjectByName('window-upper-handle'));assert.equal(recess.getObjectByName('window-lower-handle'),undefined);
 recess.updateMatrixWorld(true);const upperSize=new THREE.Box3().setFromObject(upper).getSize(new THREE.Vector3()),lowerSize=new THREE.Box3().setFromObject(lower).getSize(new THREE.Vector3());
 assert.ok(Math.abs(upperSize.x-.831)<1e-7&&Math.abs(upperSize.y-.893)<1e-7);assert.ok(Math.abs(lowerSize.x-.923)<1e-7&&Math.abs(lowerSize.y-.835)<1e-7);
 const frameMesh=recess.getObjectByName('window-continuous-frame');assert.ok(frameMesh&&recess.getObjectByName('window-upper-tilt-sash'));
 assert.equal(recess.getObjectByName('window-outer-jamb'),undefined);
 const hitFrame=(x,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,.5),new THREE.Vector3(0,0,-1)).intersectObject(frameMesh).length>0;
 for(const [x,y] of [[features.window.center,2.11],[features.window.center-.45,1.6],[features.window.center+.48,.6],[features.window.center,1.09],[features.window.center,.08]])assert.ok(hitFrame(x,y),'continuous frame covers the outside and mullion');
 for(const [x,y] of [[features.window.center,1.6],[features.window.center,.6]])assert.equal(hitFrame(x,y),false,'the measured glazing remains open in the frame');
 for(const v of views)v.dispose();
});
test('front wall closes the niche above 222 cm while the lower opening stays clear',()=>{
 const features=defaultRoomFeatures(DEFAULT_ROOM),room=createRoom(DEFAULT_ROOM,features),wall=room.surfaces.find(s=>s.name==='wall-front');room.group.updateMatrixWorld(true);
 const hitAt=y=>new THREE.Raycaster(new THREE.Vector3(features.window.center,y,1),new THREE.Vector3(0,0,-1)).intersectObject(wall).length;
 assert.equal(hitAt(2),0);assert.ok(hitAt(2.4)>0);
 const ceiling=new THREE.Box3().setFromObject(room.surfaces.find(s=>s.name==='ceiling'));
 assert.ok(Math.abs(ceiling.min.z)<1e-6);
 room.dispose();
});
test('room features save and load, migrate legacy and reject missing or out-of-bounds values',()=>{
 const doc=createDocument();assert.deepEqual(parseRoomDocument(JSON.stringify(doc)).roomFeatures,doc.roomFeatures);
 delete doc.roomFeatures;assert.deepEqual(parseRoomDocument(JSON.stringify(doc)).roomFeatures,defaultRoomFeatures(doc.room));
 const invalid=defaultRoomFeatures(DEFAULT_ROOM);invalid.window.width=5;assert.throws(()=>normalizeRoomFeatures(invalid,DEFAULT_ROOM));delete invalid.window.width;assert.throws(()=>normalizeRoomFeatures(invalid,DEFAULT_ROOM));const badStep=defaultRoomFeatures(DEFAULT_ROOM);badStep.window.stepDepth=.2;assert.throws(()=>normalizeRoomFeatures(badStep,DEFAULT_ROOM));
});
import {distanceBetweenObjects} from './src/object-distance.js';
test('window exact left and right wall clearances are 55.3 and 88.6 cm',()=>{
 const features=defaultRoomFeatures(DEFAULT_ROOM),room=createRoom(DEFAULT_ROOM,features),views=createRoomFeatureViews(DEFAULT_ROOM,features),window=views.find(v=>v.group.name==='window').group;
 assert.ok(Math.abs(features.window.width-1.038)<1e-12);
 assert.ok(Math.abs(distanceBetweenObjects(window,room.surfaces.find(s=>s.name==='wall-left')).distance-0.553)<1e-6);
 assert.ok(Math.abs(distanceBetweenObjects(window,room.surfaces.find(s=>s.name==='wall-right')).distance-0.886)<1e-6);
 for(const v of views)v.dispose();room.dispose();
});
test('radiator dimensions, wall projection, right clearance and mounting brackets',()=>{
 const f=defaultRoomFeatures(DEFAULT_ROOM),r=f.radiator,views=createRoomFeatureViews(DEFAULT_ROOM,f),radiator=views.find(v=>v.group.name==='radiator').group;
 assert.ok(Math.abs(r.width-.603)<1e-9);assert.equal(r.height,.60);assert.equal(r.bottom,.147);assert.equal(r.depth,.10);assert.equal(r.standoff,.03);
 assert.ok(Math.abs(DEFAULT_ROOM.width-(r.center+r.width/2)-.144)<1e-9);
 const body=new THREE.Box3().setFromObject(radiator.getObjectByName('radiator-body'));
 for(const [actual,expected] of [[body.min.x,r.center-r.width/2],[body.max.x,r.center+r.width/2],[body.min.y,.147],[body.max.y,.747],[body.min.z,.03],[body.max.z,.125]])assert.ok(Math.abs(actual-expected)<1e-6);
 const envelope=new THREE.Box3().setFromObject(radiator);assert.ok(Math.abs(envelope.max.z-.13)<1e-6);
 assert.equal(radiator.children.filter(x=>x.name==='radiator-wall-plate').length,4);
 assert.equal(radiator.children.filter(x=>x.name==='radiator-bracket').length,4);
 for(const v of views)v.dispose();
});
test('door frame, leaf and light switch match measured back-wall positions',()=>{
 const f=defaultRoomFeatures(DEFAULT_ROOM),views=createRoomFeatureViews(DEFAULT_ROOM,f),door=views.find(v=>v.group.name==='door').group,lightSwitch=views.find(v=>v.group.name==='switch').group;
 const bounds=name=>new THREE.Box3().setFromObject(door.getObjectByName(name));
 const left=bounds('door-jamb-left'),right=bounds('door-jamb-right'),lintel=bounds('door-lintel'),leaf=bounds('door-leaf'),plate=new THREE.Box3().setFromObject(lightSwitch.getObjectByName('switch-plate'));
 for(const [actual,expected] of [[left.min.x,.028],[left.max.x,.089],[right.min.x,.910],[right.max.x,.971],[right.max.x-right.min.x,.061],[left.max.x-left.min.x,.061],[leaf.min.x,.0775],[leaf.max.x,.9215],[leaf.min.y,.012],[leaf.max.y,2.042],[leaf.min.z,DEFAULT_ROOM.length-.038],[DEFAULT_ROOM.width-right.max.x,1.506],[DEFAULT_ROOM.width-right.min.x,1.567],[lintel.max.y,DEFAULT_ROOM.height-.505],[left.min.z,DEFAULT_ROOM.length-.015],[plate.min.x,1.308],[plate.max.x,1.420],[plate.min.y,1.163],[plate.max.y,1.275]])assert.ok(Math.abs(actual-expected)<1e-6);
 assert.equal(door.getObjectByName('door-reveal-right'),undefined);
 assert.equal(door.children.filter(x=>x.name==='door-hinge').length,3);
 assert.equal(door.children.filter(x=>x.name==='door-hinge-outside').length,3);
 assert.equal(door.getObjectByName('door-leaf').material.color.getHex(),0xcdc3b9);
 assert.equal(door.children.filter(x=>x.name==='door-rail').length,12);
 assert.equal(door.children.filter(x=>x.name==='door-stile').length,4);
 assert.equal(door.children.filter(x=>x.name==='door-recessed-panel').length,14);
 assert.equal(door.children.filter(x=>x.name==='door-glass-band').length,0);
 assert.deepEqual(door.children.filter(x=>x.name==='door-rail').slice(0,6).map(x=>Number(x.getWorldPosition(new THREE.Vector3()).y.toFixed(3))),[1.902,1.572,1.222,.872,.522,.172]);
 assert.ok(door.getObjectByName('door-handle-outside'));
 assert.ok(door.getObjectByName('door-handle').position.x>door.getObjectByName('door-jamb-right').position.x-.3);
 assert.ok(door.children.every(x=>x.name!=='door-hinge'||x.position.x<door.getObjectByName('door-handle').position.x));
 assert.ok(Math.abs(plate.getCenter(new THREE.Vector3()).y-door.getObjectByName('door-handle').getWorldPosition(new THREE.Vector3()).y-.1)<1e-8);
 door.updateMatrixWorld(true);const center=f.door.center,railY=2.042-.47,cast=y=>new THREE.Raycaster(new THREE.Vector3(center,y,DEFAULT_ROOM.length-1),new THREE.Vector3(0,0,1)).intersectObject(door.getObjectByName('door-leaf')).length;
 assert.ok(cast(railY)>0);assert.ok(cast(railY+.08)>0);
 assert.ok(Math.abs(plate.getCenter(new THREE.Vector3()).y-1.219)<1e-6);
 for(const v of views)v.dispose();
});
test('RECTA hardware has measured matte rosettes, keyhole and shaped levers on both door faces',()=>{
 const views=createRoomFeatureViews(DEFAULT_ROOM,defaultRoomFeatures(DEFAULT_ROOM)),door=views.find(v=>v.group.name==='door').group;
 const bounds=name=>new THREE.Box3().setFromObject(door.getObjectByName(name));
 const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<.002,`${actual} versus ${expected}`);
 for(const suffix of ['', '-outside']){
  const plate=door.getObjectByName('door-handle-plate'+suffix),lock=door.getObjectByName('door-lock-plate'+suffix),lever=door.getObjectByName('door-handle'+suffix),opening=door.getObjectByName('door-lock-opening'+suffix);
  assert.ok(plate&&lock&&lever&&opening);
  const size=bounds(plate.name).getSize(new THREE.Vector3());close(size.x,RECTA_HANDLE.plateWidth);close(size.y,RECTA_HANDLE.plateHeight);close(size.z,RECTA_HANDLE.plateDepth);
  close(plate.position.y-lock.position.y,RECTA_HANDLE.lockDrop);
  close(bounds(lever.name).max.x-bounds(lever.name).min.x,RECTA_HANDLE.reach);
  const positions=lever.geometry.getAttribute('position'),tipY=[],tipZ=[];for(let i=0;i<positions.count;i++)if(positions.getX(i)<RECTA_HANDLE.pivotOffset-RECTA_HANDLE.reach+.001){tipY.push(positions.getY(i));tipZ.push(positions.getZ(i));}
  close(Math.max(...tipY)-Math.min(...tipY),RECTA_HANDLE.tipHeight);
  close(Math.max(...tipZ)-Math.min(...tipZ),RECTA_HANDLE.tipDepth);
  const section=distance=>{const depths=[];for(let i=0;i<positions.count;i++)if(Math.abs(positions.getX(i)-(RECTA_HANDLE.pivotOffset-distance))<1e-6)depths.push(Math.abs(positions.getZ(i)));return [Math.min(...depths),Math.max(...depths)];};
  const root=section(0),mount=section(.009),shoulder=section(.029),grip=section(.036);
  assert.ok(root[0]<=.007&&root[1]<=.009,'the outline must start at the rosette');
  assert.ok(mount[0]<.008&&mount[1]>.061,'the mounting must be filled to full projection within 9 mm');
  assert.ok(shoulder[0]<.008&&shoulder[1]>.061,'the full body must continue beneath the 29 mm shoulder');
  assert.ok(grip[0]>.037&&grip[1]>.061,'the shoulder must turn into the thin arm');
  const shaftZ=[];for(let i=0;i<positions.count;i++)if(Math.abs(positions.getX(i)-(RECTA_HANDLE.pivotOffset-.09))<.001)shaftZ.push(Math.abs(positions.getZ(i)));
  assert.ok(Math.min(...shaftZ)>.04,'the straight grip must remain thin and away from the rosette');
  assert.equal(lock.geometry.parameters.shapes.holes.length,1);
  assert.ok(lever.material.roughness>.7);
  const doorFace=suffix?DEFAULT_ROOM.length:bounds('door-leaf').min.z;
  close(suffix?bounds(lever.name).max.z-doorFace:doorFace-bounds(lever.name).min.z,RECTA_HANDLE.projection);
  close(RECTA_HANDLE.projection-RECTA_HANDLE.plateDepth,RECTA_HANDLE.projectionBeyondPlate);
 }
 views.forEach(view=>view.dispose());
});
test('legacy untouched door migrates without changing custom door dimensions',()=>{
 const old=createDocument(),d=old.roomFeatures.door;Object.assign(d,{center:old.room.width*.25,width:Math.min(.85,old.room.width*.4),height:Math.min(2.05,old.room.height*.85),depth:.12});delete d.jambLeft;delete d.jambRight;delete d.revealRight;delete d.lintel;delete old.roomFeatures.switch;
 const loaded=parseRoomDocument(JSON.stringify(old));assert.deepEqual(loaded.roomFeatures.door,defaultRoomFeatures(old.room).door);assert.deepEqual(loaded.roomFeatures.switch,defaultRoomFeatures(old.room).switch);
 d.width=.8;const custom=parseRoomDocument(JSON.stringify(old));assert.equal(custom.roomFeatures.door.width,.8);
});
test('saved default switch moves below its old position while custom heights remain unchanged',()=>{
 const old=createDocument();old.roomFeatures.switch.bottom=1.444;
 assert.ok(Math.abs(parseRoomDocument(JSON.stringify(old)).roomFeatures.switch.bottom-1.163)<1e-9);
 old.roomFeatures.switch.bottom=1.3;
 assert.equal(parseRoomDocument(JSON.stringify(old)).roomFeatures.switch.bottom,1.3);
});
test('saved mismatched frame widths migrate to 6.1 cm on both sides',()=>{
 const doc=createDocument();doc.roomFeatures.door.jambLeft=.028;doc.roomFeatures.door.jambRight=.061;
 let loaded=parseRoomDocument(JSON.stringify(doc));assert.equal(loaded.roomFeatures.door.jambLeft,.061);assert.equal(loaded.roomFeatures.door.jambRight,.061);
 doc.roomFeatures.door.jambRight=.028;doc.roomFeatures.door.revealRight=.033;
 loaded=parseRoomDocument(JSON.stringify(doc));assert.equal(loaded.roomFeatures.door.jambLeft,.061);assert.equal(loaded.roomFeatures.door.jambRight,.061);assert.equal(loaded.roomFeatures.door.revealRight,undefined);
});
test('niche extends the floor outline by 15.1 cm only within its width',()=>{
 const features=defaultRoomFeatures(DEFAULT_ROOM),room=createRoom(DEFAULT_ROOM,features);room.group.updateMatrixWorld(true);const floor=room.surfaces.find(s=>s.name==='floor'),ray=x=>new THREE.Raycaster(new THREE.Vector3(x,1,-0.07),new THREE.Vector3(0,-1,0)).intersectObject(floor);
 assert.ok(ray(features.window.center).length>0);assert.equal(ray(0.1).length,0);
 const bounds=new THREE.Box3().setFromObject(room.group.getObjectByName('floor-outline'));assert.ok(Math.abs(bounds.min.z+0.151)<1e-8);assert.ok(Math.abs(bounds.max.z-DEFAULT_ROOM.length)<1e-6);room.dispose();
});

test('old default niche depth migrates to corrected dimensions',()=>{const doc=createDocument();doc.roomFeatures.window.depth=.086;delete doc.roomFeatures.window.stepDepth;delete doc.roomFeatures.window.stepHeight;const loaded=parseRoomDocument(JSON.stringify(doc));assert.equal(loaded.roomFeatures.window.depth,.151);assert.equal(loaded.roomFeatures.window.stepDepth,.065);assert.equal(loaded.roomFeatures.window.stepHeight,.08);assert.ok(Math.abs(loaded.roomFeatures.window.height-2.22)<1e-9);});

test('older edited mesh keeps its own depth during migration',()=>{const doc=createDocument();doc.roomFeatures.window.depth=.086;delete doc.roomFeatures.window.stepDepth;delete doc.roomFeatures.window.stepHeight;doc.roomMesh={vertices:[{x:0,y:0,z:0},{x:1,y:0,z:0},{x:0,y:1,z:0},{x:0,y:0,z:1}],faces:[{id:'a',indices:[0,2,1]},{id:'b',indices:[0,1,3]},{id:'c',indices:[0,3,2]},{id:'d',indices:[1,2,3]}]};const loaded=parseRoomDocument(JSON.stringify(doc));assert.equal(loaded.roomFeatures.window.depth,.086);assert.equal(loaded.roomFeatures.window.stepDepth,.065);});
