import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocument} from './src/model.js';
import {updateLinkedMonitor} from './src/monitor-links.js';
import {parseRoomDocument} from './src/bench.js';
import {createDocumentHistory} from './src/history.js';
const pair=doc=>doc.objects.filter(o=>o.type==='studio-monitor');
test('linked pair mirrors angle and distance while matching height, editing either side',()=>{
 for(const channel of ['L','R']){const doc=createDocument(),source=pair(doc).find(o=>o.channel===channel),next=updateLinkedMonitor(doc,source.id,{yaw:0.4,position:{x:0.8,y:1.1,z:0.9}}),[left,right]=pair(next),selected=pair(next).find(o=>o.id===source.id),peer=pair(next).find(o=>o.id!==source.id);
 assert.equal(selected.yaw,0.4);assert.equal(peer.yaw,-0.4);assert.equal(left.position.y,right.position.y);assert.equal(left.position.z,right.position.z);assert.equal(left.position.x+right.position.x,doc.room.width);assert.equal(peer.position.y,1.1);assert.deepEqual(doc.monitorLinks,{angle:true,height:true,distance:true});assert.notEqual(pair(doc)[0].position.y,1.1);}
});
test('each link can be disabled without affecting other linked parameters',()=>{
 for(const disabled of ['angle','height','distance']){const doc=createDocument(),[left,right]=pair(doc),links={...doc.monitorLinks,[disabled]:false},next=updateLinkedMonitor(doc,left.id,{yaw:0.2,position:{x:0.9,y:1.2,z:0.8}},links),peer=pair(next)[1];
 assert.equal(peer.yaw,disabled==='angle'?right.yaw:-0.2);assert.equal(peer.position.y,disabled==='height'?right.position.y:1.2);assert.equal(peer.position.x,disabled==='distance'?right.position.x:doc.room.width-0.9);assert.equal(peer.position.z,disabled==='distance'?right.position.z:0.8);}
});
test('relink uses selected speaker as authority and can be undone with placement and flags',()=>{
 let doc=createDocument();const id=pair(doc)[1].id;doc=updateLinkedMonitor(doc,id,{yaw:-0.6,position:{x:1.8,y:1.3,z:0.9}},{angle:false,height:false,distance:false});const history=createDocumentHistory(doc);
 const linked=updateLinkedMonitor(doc,id,{}, {angle:true,height:true,distance:true},['angle','height','distance']);history.push(linked);assert.deepEqual(parseRoomDocument(JSON.stringify(linked)),linked);const [left,right]=pair(linked);assert.equal(left.yaw,-right.yaw);assert.equal(left.position.y,right.position.y);assert.equal(left.position.z,right.position.z);assert.equal(left.position.x+right.position.x,linked.room.width);assert.deepEqual(history.undo(),doc);assert.deepEqual(history.redo(),linked);
 assert.throws(()=>updateLinkedMonitor(doc,id,{position:{y:-1}}));assert.equal(pair(doc)[1].position.y,1.3);
});
test('older asymmetric placements migrate without moving speakers or claiming links',()=>{
 const doc=createDocument();delete doc.monitorLinks;const [left,right]=pair(doc);left.yaw=0.7;left.position.y=0.8;left.position.x+=0.1;const migrated=parseRoomDocument(JSON.stringify(doc));assert.deepEqual(migrated.objects,doc.objects);assert.deepEqual(migrated.monitorLinks,{angle:false,height:false,distance:false});assert.throws(()=>parseRoomDocument(JSON.stringify({...doc,monitorLinks:{angle:'true',height:true,distance:true}})));
});
