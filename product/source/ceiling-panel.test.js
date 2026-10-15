import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument} from './src/model.js';
import {createStudioMonitor} from './src/monitor-view.js';
import {createSeatedListener} from './src/listener-view.js';
import {createRoom} from './src/room-view.js';
import {computeFirstReflections} from './src/reflection-model.js';
import {CEILING_PANEL,ceilingPanelPlacement,createCeilingPanelView} from './src/ceiling-panel.js';
import {acousticSurfaceCategory,defaultAcousticSettings,pathAcoustics} from './src/acoustic-simulation.js';

test('100 × 50 × 11 cm panel spans the ceiling tweeter reflections across the room',()=>{
 const doc=createDocument(),room=createRoom(doc.room,doc.roomFeatures);
 const monitors=doc.objects.filter(record=>record.type==='studio-monitor').map(createStudioMonitor);
 const listener=createSeatedListener(doc.objects.find(record=>record.type==='seated-listener'));
 const settings={...doc.reflections,ears:'both',selected:['L:tweeter','R:tweeter']};
 const paths=computeFirstReflections(monitors,listener,doc.room,settings,room.surfaces);
 const placement=ceilingPanelPlacement(paths,doc.room),panel=createCeilingPanelView(placement);
 assert.ok(placement);
 assert.equal(placement.reflectionPoints.length,4);
 assert.ok(Math.abs(placement.yaw)<1e-6,'long 100 cm side follows left-right speaker spacing');
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

test('panel rotates its long side toward the line between left and right reflection clusters',()=>{
 const point=(x,z)=>new THREE.Vector3(x,2.6,z);
 const placement=ceilingPanelPlacement([
  {surface:'ceiling',driverId:'tweeter',channel:'L',point:point(1,1)},
  {surface:'ceiling',driverId:'tweeter',channel:'R',point:point(1,1.6)}
 ],{width:2.5,length:3,height:2.6});
 assert.ok(Math.abs(Math.abs(placement.yaw)-Math.PI/2)<1e-6);
 const frontPair=placement.corners.slice(0,2);
 assert.ok(Math.abs(frontPair[0].z-frontPair[1].z)>.99,'100 cm side now runs along Z');
});
