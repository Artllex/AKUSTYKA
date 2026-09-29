import * as THREE from 'three';
import {MM27_DRIVERS} from './monitor-model.js';
export const REFLECTION_KEYS=MM27_DRIVERS.flatMap(d=>['L','R'].map(channel=>channel+':'+d.id));
export function defaultReflectionSettings(){return {visible:true,paths:false,ears:'both',selected:['L:tweeter','R:tweeter']};}
export function normalizeReflectionSettings(input){if(input===undefined)return defaultReflectionSettings();if(!input||typeof input.visible!=='boolean'||typeof input.paths!=='boolean'||!['both','left','right'].includes(input.ears)||!Array.isArray(input.selected)||input.selected.some(key=>!REFLECTION_KEYS.includes(key))||new Set(input.selected).size!==input.selected.length)throw new Error('Nieprawidłowe ustawienia pierwszych odbić.');return {...input,selected:[...input.selected]};}
export function roomReflectionSurfaces(room){return [
 {id:'wall-left',axis:'x',plane:0,normal:new THREE.Vector3(1,0,0)},
 {id:'wall-right',axis:'x',plane:room.width,normal:new THREE.Vector3(-1,0,0)},
 {id:'wall-front',axis:'z',plane:0,normal:new THREE.Vector3(0,0,1)},
 {id:'wall-back',axis:'z',plane:room.length,normal:new THREE.Vector3(0,0,-1)},
 {id:'floor',axis:'y',plane:0,normal:new THREE.Vector3(0,1,0)},
 {id:'ceiling',axis:'y',plane:room.height,normal:new THREE.Vector3(0,-1,0)}
];}
// Specular first-order image-source construction. Uses ear position, not an
// outgoing tweeter laser. No material response, diffraction or occlusion.
export function firstReflection(source,receiver,surface,room){
 const bounds=new THREE.Box3(new THREE.Vector3(),new THREE.Vector3(room.width,room.height,room.length));if(!bounds.containsPoint(source)||!bounds.containsPoint(receiver))return null;
 const image=receiver.clone();image[surface.axis]=2*surface.plane-receiver[surface.axis];
 const denominator=image[surface.axis]-source[surface.axis];if(Math.abs(denominator)<1e-12)return null;
 const t=(surface.plane-source[surface.axis])/denominator;if(t<=1e-9||t>=1-1e-9)return null;
 const point=source.clone().lerp(image,t);point[surface.axis]=surface.plane;
 if(!bounds.clone().expandByScalar(1e-9).containsPoint(point))return null;
 return {point,length:source.distanceTo(point)+point.distanceTo(receiver)};
}
export function computeFirstReflections(monitors,listener,room,input,meshes=null){
 const meshSurfaces=meshes?.map(mesh=>{mesh.updateMatrixWorld(true);return {id:mesh.name,normal:mesh.userData.outward.clone().negate(),mesh};});
 const settings=normalizeReflectionSettings(input),paths=[];if(!listener)return paths;
 listener.group.updateMatrixWorld(true);
 const ears=(settings.ears==='both'?['left','right']:[settings.ears]).map(ear=>({ear,position:listener.group.getObjectByName('ear-'+ear).getWorldPosition(new THREE.Vector3())}));
 for(const monitor of monitors)for(const driver of monitor.getDriverCenters()){
  const channel=monitor.group.userData.channel;if(!settings.selected.includes(channel+':'+driver.id))continue;
  for(const {ear,position} of ears)for(const surface of meshSurfaces??roomReflectionSurfaces(room)){
   const result=meshes?meshReflection(driver.position,position,surface,meshes):firstReflection(driver.position,position,surface,room);if(result)paths.push({...result,source:driver.position.clone(),receiver:position.clone(),surface:surface.id,normal:surface.normal.clone(),driverId:driver.id,channel,ear,color:driver.color});
  }
 }
 return paths;
}

// Bounded polygon image construction for edited surfaces; room mesh occludes invalid paths.
function meshReflection(source,receiver,surface,meshes){const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(surface.normal,surface.mesh.position),image=receiver.clone().addScaledVector(plane.normal,-2*plane.distanceToPoint(receiver));const delta=image.clone().sub(source),denominator=plane.normal.dot(delta);if(Math.abs(denominator)<1e-12)return null;const t=-plane.distanceToPoint(source)/denominator;if(t<=1e-9||t>=1-1e-9)return null;const point=source.clone().addScaledVector(delta,t),local=point.clone().applyMatrix4(surface.mesh.matrixWorld.clone().invert()),g=surface.mesh.geometry,positions=g.attributes.position,index=g.index,triangle=new THREE.Triangle();let inside=false;for(let i=0;i<(index?index.count:positions.count);i+=3){triangle.a.fromBufferAttribute(positions,index?index.getX(i):i);triangle.b.fromBufferAttribute(positions,index?index.getX(i+1):i+1);triangle.c.fromBufferAttribute(positions,index?index.getX(i+2):i+2);if(triangle.containsPoint(local)){inside=true;break;}}if(!inside)return null;const ray=new THREE.Raycaster();for(const origin of [source,receiver]){const direction=point.clone().sub(origin),distance=direction.length();ray.set(origin,direction.normalize());ray.near=1e-5;ray.far=distance-1e-5;if(ray.intersectObjects(meshes,false).length)return null;}return {point,length:source.distanceTo(point)+point.distanceTo(receiver)};}
