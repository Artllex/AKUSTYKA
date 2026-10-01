import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument} from './src/model.js';
import {createSeatedListener} from './src/listener-view.js';
import {createStudioMonitor} from './src/monitor-view.js';
import {monitorSideDistance,moveMonitorAlongSide} from './src/monitor-side-distance.js';
import {createDocumentHistory} from './src/history.js';

function sidePoints(document,channel){
 const listener=createSeatedListener(document.objects.find(o=>o.type==='seated-listener'));
 const monitor=createStudioMonitor(document.objects.find(o=>o.type==='studio-monitor'&&o.channel===channel));
 const ear=listener.group.getObjectByName(channel==='L'?'ear-left':'ear-right').getWorldPosition(new THREE.Vector3());
 const tweeter=monitor.getDriverCenters().find(o=>o.id==='tweeter').position;
 listener.dispose();monitor.dispose();return {ear,tweeter};
}

test('linked distance moves both tweeters outward along their existing triangle sides',()=>{
 const doc=createDocument(),ids=['monitor-L','monitor-R'],before=ids.map(id=>monitorSideDistance(doc,id)),points=['L','R'].map(channel=>sidePoints(doc,channel));
 assert.ok(Math.abs(before[0]-before[1])<1e-9);
 const target=before[0]+.05,next=moveMonitorAlongSide(doc,ids[0],target);
 for(let i=0;i<2;i++){
  const channel=i===0?'L':'R',after=sidePoints(next,channel),a=points[i].tweeter.clone().sub(points[i].ear),b=after.tweeter.clone().sub(after.ear);
  assert.ok(Math.abs(monitorSideDistance(next,ids[i])-target)<1e-9);
  assert.ok(Math.abs(a.x*b.z-a.z*b.x)<1e-9);
  assert.equal(next.objects[i+1].yaw,doc.objects[i+1].yaw);
  assert.equal(next.objects[i+1].position.y,doc.objects[i+1].position.y);
 }
 const history=createDocumentHistory(doc);history.push(next);assert.deepEqual(history.undo(),doc);assert.deepEqual(history.redo(),next);
});

test('unlinked distance moves only the chosen monitor and rejects invalid values',()=>{
 const doc=createDocument(),left=monitorSideDistance(doc,'monitor-L'),right=monitorSideDistance(doc,'monitor-R');doc.monitorLinks.distance=false;
 const next=moveMonitorAlongSide(doc,'monitor-R',right+.03);
 assert.ok(Math.abs(monitorSideDistance(next,'monitor-R')-right-.03)<1e-9);
 assert.ok(Math.abs(monitorSideDistance(next,'monitor-L')-left)<1e-9);
 assert.deepEqual(next.objects[1],doc.objects[1]);
 assert.throws(()=>moveMonitorAlongSide(doc,'monitor-L',-1));assert.throws(()=>moveMonitorAlongSide(doc,'monitor-L',NaN));
});
