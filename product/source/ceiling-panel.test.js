import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument} from './src/model.js';
import {parseRoomDocument} from './src/bench.js';
import {createStudioMonitor} from './src/monitor-view.js';
import {createSeatedListener} from './src/listener-view.js';
import {createRoom} from './src/room-view.js';
import {computeFirstReflections} from './src/reflection-model.js';
import {CEILING_PANEL,ceilingPanelPlacement,createCeilingPanelView,normalizeCeilingPanelSettings} from './src/ceiling-panel.js';
import {acousticSurfaceCategory,defaultAcousticSettings,pathAcoustics} from './src/acoustic-simulation.js';

test('100 × 50 × 11 cm panel is centered over all ceiling reflections in both axes',()=>{
 const doc=createDocument(),room=createRoom(doc.room,doc.roomFeatures);
 const monitors=doc.objects.filter(record=>record.type==='studio-monitor').map(createStudioMonitor);
 const listener=createSeatedListener(doc.objects.find(record=>record.type==='seated-listener'));
 const settings={...doc.reflections,ears:'both'};
 const paths=computeFirstReflections(monitors,listener,doc.room,settings,room.surfaces);
 const placement=ceilingPanelPlacement(paths,doc.room),panel=createCeilingPanelView(placement);
 assert.ok(placement);
 assert.equal(placement.reflectionPoints.length,20);
 const bounds={minX:Math.min(...placement.reflectionPoints.map(point=>point.x)),maxX:Math.max(...placement.reflectionPoints.map(point=>point.x)),minZ:Math.min(...placement.reflectionPoints.map(point=>point.z)),maxZ:Math.max(...placement.reflectionPoints.map(point=>point.z))};
 assert.ok(Math.abs(placement.center.x-(bounds.minX+bounds.maxX)/2)<1e-9);
 assert.ok(Math.abs(placement.center.z-(bounds.minZ+bounds.maxZ)/2)<1e-9);
 assert.ok(Math.abs(placement.yaw)<1e-6,'long 100 cm side follows the wider reflection spread');
 const body=new THREE.Box3().setFromObject(panel.group.getObjectByName('absorber'));
 assert.ok(Math.abs(body.max.x-body.min.x-CEILING_PANEL.width)<1e-6);
 assert.ok(Math.abs(body.max.z-body.min.z-CEILING_PANEL.depth)<1e-6);
 assert.ok(Math.abs(body.max.y-doc.room.height)<1e-6,'panel top touches the ceiling');
 assert.ok(Math.abs(body.max.y-body.min.y-CEILING_PANEL.thickness)<1e-6);
 for(const point of placement.reflectionPoints)assert.ok(point.x>=body.min.x&&point.x<=body.max.x&&point.z>=body.min.z&&point.z<=body.max.z);
 for(const corner of placement.corners){assert.ok(Math.abs(corner.front-corner.z)<1e-9);assert.ok(Math.abs(corner.left-corner.x)<1e-9);assert.ok(Math.abs(corner.right-(doc.room.width-corner.x))<1e-9);assert.ok(panel.group.getObjectByName('corner-'+corner.index));}
 const treated=computeFirstReflections(monitors,listener,doc.room,settings,room.surfaces,[panel.group]);
 assert.ok(treated.some(path=>acousticSurfaceCategory(path.surface)==='panel'),'panel becomes a physical acoustic surface');
 const panelPath=treated.find(path=>acousticSurfaceCategory(path.surface)==='panel');
 assert.equal(pathAcoustics(panelPath,panelPath.source.distanceTo(panelPath.receiver),defaultAcousticSettings()).material,'absorber');
 panel.dispose();room.dispose();listener.dispose();for(const monitor of monitors)monitor.dispose();
});

test('panel rotates its long side toward the larger reflection spread',()=>{
 const point=(x,z)=>new THREE.Vector3(x,2.6,z);
 const placement=ceilingPanelPlacement([
  {surface:'ceiling',driverId:'tweeter',channel:'L',point:point(1,1)},
  {surface:'ceiling',driverId:'tweeter',channel:'R',point:point(1,1.6)}
 ],{width:2.5,length:3,height:2.6});
 assert.ok(Math.abs(Math.abs(placement.yaw)-Math.PI/2)<1e-6);
 const frontPair=placement.corners.slice(0,2);
 assert.ok(Math.abs(frontPair[0].z-frontPair[1].z)>.99,'100 cm side now runs along Z');
});

test('panel centers on extremes rather than the mean when reflections are unevenly distributed',()=>{
 const point=(x,z)=>new THREE.Vector3(x,2.6,z);
 const placement=ceilingPanelPlacement([
  {surface:'ceiling',driverId:'tweeter',point:point(.8,.5)},
  {surface:'ceiling',driverId:'midbass-top',point:point(1,.6)},
  {surface:'ceiling',driverId:'midbass-bottom',point:point(1,.6)},
  {surface:'ceiling',driverId:'sub-left',point:point(1.6,1.1)},
  {surface:'front',driverId:'sub-right',point:point(2,2)}
 ],{width:2.5,length:3,height:2.6});
 assert.equal(placement.reflectionPoints.length,4);
 assert.ok(Math.abs(placement.center.x-1.2)<1e-9);
 assert.ok(Math.abs(placement.center.z-.8)<1e-9);
});

test('ceiling gap and longitudinal offset move the actual panel and all corner markers',()=>{
 const room={width:2.5,length:3,height:2.6},paths=[{surface:'ceiling',point:new THREE.Vector3(1,2.6,1)},{surface:'ceiling',point:new THREE.Vector3(1.5,2.6,1.1)}];
 const initial=ceilingPanelPlacement(paths,room);
 const moved=ceilingPanelPlacement(paths,room,{drop:.15,zOffset:-.12});
 const panel=createCeilingPanelView(moved),body=new THREE.Box3().setFromObject(panel.group.getObjectByName('absorber'));
 assert.ok(Math.abs(moved.center.y-(initial.center.y-.15))<1e-9);
 assert.ok(Math.abs(moved.center.z-(initial.center.z-.12))<1e-9);
 assert.ok(Math.abs(body.max.y-(room.height-.15))<1e-9);
 for(let i=0;i<4;i++){
  assert.ok(Math.abs(moved.corners[i].z-(initial.corners[i].z-.12))<1e-9);
  assert.ok(Math.abs(panel.group.getObjectByName('corner-'+(i+1)).position.y-(room.height-.15-CEILING_PANEL.thickness-.012))<1e-9);
 }
 assert.deepEqual(moved.settings,{drop:.15,zOffset:-.12});
 panel.dispose();
});

test('panel settings validate, default old documents, and limit travel to the room',()=>{
 const room={width:2.5,length:3,height:2.6};
 assert.deepEqual(normalizeCeilingPanelSettings(undefined,room),{drop:0,zOffset:0});
 assert.throws(()=>normalizeCeilingPanelSettings({drop:-.01,zOffset:0},room));
 assert.throws(()=>normalizeCeilingPanelSettings({drop:2.6,zOffset:0},room));
 assert.throws(()=>normalizeCeilingPanelSettings({drop:0,zOffset:Infinity},room));
 const paths=[{surface:'ceiling',point:new THREE.Vector3(1,2.6,1)}];
 const far=ceilingPanelPlacement(paths,room,{drop:0,zOffset:3});
 assert.ok(Math.abs(far.corners[2].z-room.length)<1e-9);
 assert.ok(far.settings.zOffset<3);
 const document=createDocument();document.ceilingPanel={drop:.15,zOffset:-.12};
 assert.deepEqual(parseRoomDocument(JSON.stringify(document)).ceilingPanel,document.ceilingPanel);
 delete document.ceilingPanel;
 assert.deepEqual(parseRoomDocument(JSON.stringify(document)).ceilingPanel,{drop:0,zOffset:0});
});
