import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument} from './src/model.js';
import {parseRoomDocument} from './src/bench.js';
import {createStudioMonitor} from './src/monitor-view.js';
import {applyObjectTransform,updateObjectTransform,EMPTY_TRANSFORM,normalizeTransforms} from './src/object-transform.js';
import {createRoomFeatureViews} from './src/room-features.js';
test('object translation and rotation move driver centers and normals in world space',()=>{
 const doc=createDocument(),monitor=createStudioMonitor(doc.objects.find(o=>o.id==='monitor-R')),before=monitor.getDriverCenters()[1],transform={...EMPTY_TRANSFORM,y:0.1,rx:15,ry:20,rz:5};applyObjectTransform(monitor.group,{'monitor-R':transform});const after=monitor.getDriverCenters()[1];assert.ok(before.position.distanceTo(after.position)>0.05);assert.ok(before.normal.distanceTo(after.normal)>0.1);assert.ok(Math.abs(after.normal.length()-1)<1e-12);monitor.dispose();
});
test('selection transform respects monitor pair links and survives save/load',()=>{
 const doc=createDocument(),t={...EMPTY_TRANSFORM,x:0.1,y:0.2,z:0.3,ry:25};doc.transforms=updateObjectTransform(doc,'monitor-R',t);assert.deepEqual(doc.transforms['monitor-L'],{...EMPTY_TRANSFORM,x:-0.1,y:0.2,z:0.3,ry:-25});assert.deepEqual(parseRoomDocument(JSON.stringify(doc)).transforms,doc.transforms);doc.monitorLinks={angle:false,height:false,distance:false};const before=structuredClone(doc.transforms['monitor-L']);doc.transforms=updateObjectTransform(doc,'monitor-R',{...t,x:0.4,y:0.5,ry:50});assert.deepEqual(doc.transforms['monitor-L'],before);assert.throws(()=>normalizeTransforms({a:{x:NaN}}));
});
test('window assembly is removed while architectural recess stays visible',()=>{
 const doc=createDocument(),views=createRoomFeatureViews(doc.room,doc.roomFeatures),window=views.find(v=>v.group.name==='window').group;assert.equal(window.getObjectByName('window-upper-glass'),undefined);assert.equal(window.getObjectByName('window-lower-glass'),undefined);assert.equal(window.getObjectByName('window-frame-horizontal'),undefined);assert.equal(window.getObjectByName('window-reveal-side').visible,true);for(const v of views)v.dispose();
});
