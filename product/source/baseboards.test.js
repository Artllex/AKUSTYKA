import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument} from './src/model.js';
import {initialFootprint} from './src/surface-model.js';
import {createBaseboards,BASEBOARD_HEIGHT,BASEBOARD_DEPTH} from './src/baseboards.js';

test('4 by 1.5 cm skirting follows the entire floor contour except the outer door frame',()=>{
 const doc=createDocument(),points=initialFootprint(doc),skirting=createBaseboards(points,doc.room,doc.roomFeatures.door);
 const boards=skirting.group.children,perimeter=points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+Math.hypot(b.x-a.x,b.z-a.z);},0);
 const length=boards.reduce((sum,board)=>sum+board.geometry.parameters.width,0);
 assert.ok(Math.abs(length-(perimeter-doc.roomFeatures.door.width))<1e-8);
 assert.ok(boards.some(board=>new THREE.Box3().setFromObject(board).min.z<0));
 for(const board of boards){
  const size=board.geometry.parameters;assert.equal(size.height,BASEBOARD_HEIGHT);assert.equal(size.depth,BASEBOARD_DEPTH);
  const box=new THREE.Box3().setFromObject(board);assert.ok(box.min.y>=-1e-8&&Math.abs(box.max.y-.04)<1e-8);
  if(board.userData.edgeIndex===6){const {start,end}=board.userData;assert.ok(Math.max(start.x,end.x)<=doc.roomFeatures.door.center-doc.roomFeatures.door.width/2+1e-8||Math.min(start.x,end.x)>=doc.roomFeatures.door.center+doc.roomFeatures.door.width/2-1e-8);}
 }
 for(let i=0;i<points.length;i++){
  const p=points[i],incoming=boards.find(board=>board.userData.edgeIndex===(i+points.length-1)%points.length&&Math.hypot(board.userData.end.x-p.x,board.userData.end.z-p.z)<1e-8),outgoing=boards.find(board=>board.userData.edgeIndex===i&&Math.hypot(board.userData.start.x-p.x,board.userData.start.z-p.z)<1e-8);
  if(!incoming||!outgoing)continue;
  assert.ok(Math.hypot(incoming.userData.innerEnd.x-outgoing.userData.innerStart.x,incoming.userData.innerEnd.z-outgoing.userData.innerStart.z)<1e-8);
 }
 skirting.dispose();
});

test('skirting follows an edited angled edge and door position',()=>{
 const doc=createDocument(),points=initialFootprint(doc);points.splice(5,0,{x:doc.room.width-.3,z:doc.room.length-.25});
 const skirting=createBaseboards(points,doc.room,doc.roomFeatures.door,.1);
 assert.ok(skirting.group.children.some(board=>Math.abs(board.userData.end.x-board.userData.start.x)>.01&&Math.abs(board.userData.end.z-board.userData.start.z)>.01));
 const back=skirting.group.children.filter(board=>board.userData.edgeIndex===7);
 assert.ok(back.every(board=>Math.max(board.userData.start.x,board.userData.end.x)<=doc.roomFeatures.door.center-doc.roomFeatures.door.width/2+.1+1e-8||Math.min(board.userData.start.x,board.userData.end.x)>=doc.roomFeatures.door.center+doc.roomFeatures.door.width/2+.1-1e-8));
 skirting.dispose();
});
