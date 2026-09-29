import * as THREE from 'three';
import {transformMesh} from './mesh-model.js';
export function moveAlongAxis(mesh,indices,axis,centimeters){if(!['x','y','z'].includes(axis)||!Number.isFinite(centimeters))throw new Error('Nieprawidłowe przesunięcie.');const center=indices.reduce((v,i)=>v.add(new THREE.Vector3(mesh.vertices[i].x,mesh.vertices[i].y,mesh.vertices[i].z)),new THREE.Vector3()).multiplyScalar(1/indices.length);center[axis]+=centimeters/100;return transformMesh(mesh,indices,center,{x:0,y:0,z:0});}
export function axisDragDistance(start,current,direction){const length=Math.hypot(direction.x,direction.y);if(length<.01)return start.y-current.y;return ((current.x-start.x)*direction.x+(current.y-start.y)*direction.y)/length;}
export function parseDisplacement(value){const text=value.trim().replace(',','.');if(!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text))return null;const n=Number(text);return Number.isFinite(n)?n:null;}
