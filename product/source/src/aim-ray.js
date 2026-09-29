import * as THREE from 'three';
// Visual geometric ray only: no sound propagation, diffraction or reflection.
export function headFrame(listener){
 const head=listener.group.getObjectByName('head');
 listener.group.updateMatrixWorld(true);
 return {origin:head.getWorldPosition(new THREE.Vector3()),direction:new THREE.Vector3(0,0,-1).applyQuaternion(head.getWorldQuaternion(new THREE.Quaternion())).normalize()};
}
export function headIntersection(origin,direction,listener){
 if(!listener)return null;
 const head=listener.group.getObjectByName('head');listener.group.updateMatrixWorld(true);
 const inverse=head.matrixWorld.clone().invert();
 const local=new THREE.Ray(origin.clone(),direction.clone().normalize()).applyMatrix4(inverse);
 const point=local.intersectSphere(new THREE.Sphere(new THREE.Vector3(),1),new THREE.Vector3());
 return point?point.applyMatrix4(head.matrixWorld):null;
}
export function roomRayEnd(origin,direction,room){
 const box=new THREE.Box3(new THREE.Vector3(0,0,0),new THREE.Vector3(room.width,room.height,room.length)),ray=new THREE.Ray(origin.clone(),direction.clone().normalize());
 if(!box.containsPoint(origin))return ray.intersectBox(box,new THREE.Vector3())??origin.clone().addScaledVector(ray.direction,1);
 let distance=Infinity;
 for(const [axis,max] of [['x',room.width],['y',room.height],['z',room.length]])if(Math.abs(ray.direction[axis])>1e-10){const t=((ray.direction[axis]>0?max:0)-origin[axis])/ray.direction[axis];if(t>=0)distance=Math.min(distance,t);}
 return origin.clone().addScaledVector(ray.direction,Number.isFinite(distance)?distance:1);
}

