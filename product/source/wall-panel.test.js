import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument} from './src/model.js';
import {createStudioMonitor} from './src/monitor-view.js';
import {createSeatedListener} from './src/listener-view.js';
import {createRoom} from './src/room-view.js';
import {computeFirstReflections} from './src/reflection-model.js';
import {WALL_PANEL,wallPanelPlacement,createWallPanelView} from './src/wall-panel.js';
import {acousticSurfaceCategory,defaultAcousticSettings,pathAcoustics} from './src/acoustic-simulation.js';

test('a 100 × 50 × 11 cm absorber is centered over the separate left and right wall reflection footprints',()=>{
 const doc=createDocument(),room=createRoom(doc.room,doc.roomFeatures);
 const monitors=doc.objects.filter(record=>record.type==='studio-monitor').map(createStudioMonitor);
 const listener=createSeatedListener(doc.objects.find(record=>record.type==='seated-listener'));
 const paths=computeFirstReflections(monitors,listener,doc.room,{...doc.reflections,ears:'both'},room.surfaces);
 const panels=[];
 for(const side of ['left','right']){
  const placement=wallPanelPlacement(paths,doc.room,side),view=createWallPanelView(placement);
  panels.push(view);
  assert.equal(placement.reflectionPoints.length,20);
  assert.equal(placement.orientation,'horizontal');
  const ys=placement.reflectionPoints.map(point=>point.y),zs=placement.reflectionPoints.map(point=>point.z);
  assert.ok(Math.abs(placement.center.y-(Math.min(...ys)+Math.max(...ys))/2)<1e-9);
  assert.ok(Math.abs(placement.center.z-(Math.min(...zs)+Math.max(...zs))/2)<1e-9);
  const body=new THREE.Box3().setFromObject(view.group.getObjectByName('absorber'));
  assert.ok(Math.abs(body.max.y-body.min.y-WALL_PANEL.depth)<1e-9);
  assert.ok(Math.abs(body.max.z-body.min.z-WALL_PANEL.width)<1e-9);
  assert.ok(Math.abs(body.max.x-body.min.x-WALL_PANEL.thickness)<1e-9);
  assert.ok(Math.abs((side==='left'?body.min.x:body.max.x)-(side==='left'?0:doc.room.width))<1e-9);
  for(const point of placement.reflectionPoints)assert.ok(point.y>=body.min.y&&point.y<=body.max.y&&point.z>=body.min.z&&point.z<=body.max.z);
 }
 const treated=computeFirstReflections(monitors,listener,doc.room,{...doc.reflections,ears:'both'},room.surfaces,panels.map(view=>view.group));
 for(const side of ['left','right']){
  const path=treated.find(path=>path.surface.startsWith(`object:wall-panel-${side}:`));
  assert.ok(path,`${side} absorber receives a physical reflection path`);
  assert.equal(acousticSurfaceCategory(path.surface),'panel');
  assert.equal(pathAcoustics(path,path.source.distanceTo(path.receiver),defaultAcousticSettings()).material,'absorber');
 }
 for(const view of panels)view.dispose();room.dispose();listener.dispose();for(const monitor of monitors)monitor.dispose();
});

test('wall panel chooses the vertical orientation when the reflection spread is taller',()=>{
 const point=(y,z)=>new THREE.Vector3(0,y,z);
 const placement=wallPanelPlacement([
  {surface:'wall-left',point:point(.8,.6)},
  {surface:'wall-left',point:point(1.6,.7)},
  {surface:'wall-left',point:point(1.5,.7)},
  {surface:'wall-right',point:new THREE.Vector3(2.5,2,2)}
 ],{width:2.5,length:3,height:2.6},'left');
 assert.equal(placement.orientation,'vertical');
 assert.equal(placement.height,1);
 assert.equal(placement.length,.5);
 assert.ok(Math.abs(placement.center.y-1.2)<1e-9);
 assert.ok(Math.abs(placement.center.z-.65)<1e-9);
 assert.equal(placement.reflectionPoints.length,3);
});
