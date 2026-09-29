import * as THREE from 'three';
import {OBB} from 'three/addons/math/OBB.js';
import {MM27} from './monitor-model.js';
const EPS=1e-6;
const localVolume=new THREE.Box3(new THREE.Vector3(-MM27.overall.width/2,0,-0.245),new THREE.Vector3(MM27.overall.width/2,MM27.overall.height,0.197));
function physicalMesh(o){return o.isMesh&&o.userData.collision!==false&&!o.name.startsWith('center-')&&o.name!=='brand'&&o.name!=='power-led';}
function triangles(geometry,visit){const positions=geometry.attributes.position,index=geometry.index;if(!positions)return false;const count=index?index.count:positions.count;const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();for(let i=0;i+2<count;i+=3){a.fromBufferAttribute(positions,index?index.getX(i):i);b.fromBufferAttribute(positions,index?index.getX(i+1):i+1);c.fromBufferAttribute(positions,index?index.getX(i+2):i+2);if(visit(a,b,c))return true;}return false;}
function pointInsideMesh(point,mesh){
 const inverse=mesh.matrixWorld.clone().invert(),local=point.clone().applyMatrix4(inverse);if(!mesh.geometry.boundingBox.containsPoint(local))return false;
 const ray=new THREE.Ray(local,new THREE.Vector3(1,0.371,0.129).normalize()),hit=new THREE.Vector3(),distances=[];
 triangles(mesh.geometry,(a,b,c)=>{if(ray.intersectTriangle(a,b,c,false,hit)){const distance=hit.distanceTo(local);if(distance>EPS&&!distances.some(d=>Math.abs(d-distance)<EPS))distances.push(distance);}return false;});
 return distances.length%2===1;
}
function intersectsMesh(volume,mesh){
 mesh.geometry.computeBoundingBox();const broad=new OBB().fromBox3(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld);if(!volume.obb.intersectsOBB(broad,1e-10))return false;
 const transform=new THREE.Matrix4().multiplyMatrices(volume.inverse,mesh.matrixWorld),triangle=new THREE.Triangle();
 if(triangles(mesh.geometry,(a,b,c)=>{triangle.set(a.clone().applyMatrix4(transform),b.clone().applyMatrix4(transform),c.clone().applyMatrix4(transform));return volume.box.intersectsTriangle(triangle);}))return true;
 // Handles a monitor entirely enclosed in a large object without surface contact.
 return pointInsideMesh(volume.obb.center,mesh);
}
function monitorVolume(monitor){monitor.group.updateMatrixWorld(true);const box=localVolume.clone().expandByScalar(-EPS);return {box,inverse:monitor.group.matrixWorld.clone().invert(),obb:new OBB().fromBox3(box).applyMatrix4(monitor.group.matrixWorld),bounds:localVolume.clone().applyMatrix4(monitor.group.matrixWorld)};}
export function findMonitorCollisions(monitors,objects,room,roomSurfaces=null){
 const surfaces=new Set(),targets=new Set(),volumes=monitors.map(m=>monitorVolume(m));
 for(let i=0;i<monitors.length;i++){
  const source=monitors[i],volume=volumes[i],b=volume.bounds;
  if(roomSurfaces){for(const surface of roomSurfaces){surface.updateMatrixWorld(true);if(intersectsMesh(volume,surface))surfaces.add(surface.name);}}else for(const [name,condition] of [['wall-left',b.min.x<-EPS],['wall-right',b.max.x>room.width+EPS],['wall-front',b.min.z<-EPS],['wall-back',b.max.z>room.length+EPS],['floor',b.min.y<-EPS],['ceiling',b.max.y>room.height+EPS]])if(condition)surfaces.add(name);
  for(const target of objects){if(target===source.group)continue;target.updateMatrixWorld(true);const monitorIndex=monitors.findIndex(m=>m.group===target);
   if(monitorIndex>=0){if(volume.obb.intersectsOBB(volumes[monitorIndex].obb,1e-10)){targets.add(source.group);targets.add(target);}continue;}
   let hit=false;target.traverse(o=>{if(!hit&&physicalMesh(o))hit=intersectsMesh(volume,o);});if(hit)targets.add(target);
  }
 }
 return {surfaces,targets};
}
// Restore original material state every time, so collision colors never leak
// into save data, undo history, selection colors or a later non-colliding pose.
const originals=new WeakMap();
export function tintCollision(object,active){
 object.userData.monitorCollision=active;
 const materials=new Set();object.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
 for(const material of materials){if(!material.color)continue;let base=originals.get(material);if(!base){base={color:material.color.clone(),emissive:material.emissive?.clone(),opacity:material.opacity,transparent:material.transparent};originals.set(material,base);}material.color.copy(active?new THREE.Color(0xff303d):base.color);if(material.emissive)material.emissive.copy(active?new THREE.Color(0x650812):base.emissive);material.opacity=active&&object.isMesh?0.55:base.opacity;material.transparent=active&&object.isMesh?true:base.transparent;}
}
