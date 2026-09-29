import * as THREE from 'three';
import {transformMesh} from './mesh-model.js';
export function rotateSelection(mesh,indices,plane,degrees,pivot=null){
 if(!['xy','xz','yz'].includes(plane)||!Number.isFinite(degrees)||!indices.length)throw new Error('Nieprawidłowy obrót.');
 const center=indices.reduce((sum,i)=>sum.add(new THREE.Vector3(mesh.vertices[i].x,mesh.vertices[i].y,mesh.vertices[i].z)),new THREE.Vector3()).multiplyScalar(1/indices.length);
 const rotation={x:0,y:0,z:0};rotation[plane==='xy'?'z':plane==='xz'?'y':'x']=plane==='xz'?-degrees:degrees;
 if(pivot){if(!['x','y','z'].every(k=>Number.isFinite(pivot[k])))throw new Error('Nieprawidłowy środek obrotu.');const origin=new THREE.Vector3(pivot.x,pivot.y,pivot.z);center.sub(origin).applyEuler(new THREE.Euler(...['x','y','z'].map(k=>THREE.MathUtils.degToRad(rotation[k])),'XYZ')).add(origin);}return transformMesh(mesh,indices,center,rotation);
}
