import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocument} from './src/model.js';
import {initialRoomMesh,meshEdges,normalizeRoomMesh,splitMeshEdge} from './src/mesh-model.js';
import {edgeFraction,nearestAdjacentEdge} from './src/edge-insertion.js';

test('centimeters and percentages place the same vertex along a shared edge',()=>{
 const mesh=initialRoomMesh(createDocument()),pair=[0,1],length=Math.hypot(...['x','y','z'].map(k=>mesh.vertices[1][k]-mesh.vertices[0][k]));
 const half=edgeFraction('50%',length),centimeters=edgeFraction(String(length*50)+' cm',length);
 assert.equal(half,.5);assert.ok(Math.abs(centimeters-.5)<1e-10);
 const split=splitMeshEdge(mesh,pair,half),newId=mesh.vertices.length;
 assert.equal(split.vertices.length,newId+1);
 assert.equal(split.faces.filter(f=>f.indices.includes(newId)).length,2);
 assert.equal(split.vertices[newId].x,(mesh.vertices[0].x+mesh.vertices[1].x)/2);
 assert.deepEqual(normalizeRoomMesh(split),split);
});

test('placement is measured from chosen endpoint and rejects invalid or tiny fragments',()=>{
 const mesh=initialRoomMesh(createDocument()),pair=[0,1],length=Math.hypot(mesh.vertices[1].x-mesh.vertices[0].x,mesh.vertices[1].z-mesh.vertices[0].z);
 const t=edgeFraction('25%',length),fromEnd=splitMeshEdge(mesh,pair,1-t).vertices.at(-1);
 assert.ok(Math.abs(fromEnd.x-(mesh.vertices[1].x+(mesh.vertices[0].x-mesh.vertices[1].x)*t))<1e-10);
 for(const value of ['0%','100%','0 cm','9999 cm','abc','-3 cm','0.1 cm'])assert.equal(edgeFraction(value,length),null);
 assert.throws(()=>splitMeshEdge(mesh,pair,0));assert.throws(()=>splitMeshEdge(mesh,pair,.00001));
});

test('pointer preview snaps only to incident edges',()=>{
 const mesh=initialRoomMesh(createDocument()),edges=meshEdges(mesh),projected=mesh.vertices.map((_,i)=>({x:i*100,y:i*10,visible:true}));
 const hit=nearestAdjacentEdge({...mesh,edges},0,projected,{x:50,y:5});
 assert.deepEqual(hit.pair,[0,1]);assert.ok(Math.abs(hit.fraction-.5)<.001);
 assert.equal(nearestAdjacentEdge({...mesh,edges},0,projected,{x:600,y:500}),null);
});
