import * as THREE from 'three';

const MIN_REFLECTING_TRIANGLE_AREA=0.003;
const EPS=1e-5;

// Read real, transformed triangles from solid scene objects. Tiny fittings and
// nonphysical helper meshes cannot produce meaningful specular markers.
export function objectReflectingFaces(groups){
 const faces=[],occluders=[];
 for(const group of groups){
  group.updateMatrixWorld(true);
  const objectId=group.userData.recordId??group.userData.id??group.name;
  let partIndex=0;
  group.traverse(mesh=>{
   if(!mesh.isMesh||mesh.userData.collision===false||!mesh.geometry?.attributes.position)return;
   const partId=`object:${objectId}:${mesh.name||'part'}:${partIndex++}`;
   const positions=mesh.geometry.attributes.position,index=mesh.geometry.index,count=index?index.count:positions.count;
   let physical=false;
   for(let i=0;i+2<count;i+=3){
    const a=new THREE.Vector3().fromBufferAttribute(positions,index?index.getX(i):i).applyMatrix4(mesh.matrixWorld);
    const b=new THREE.Vector3().fromBufferAttribute(positions,index?index.getX(i+1):i+1).applyMatrix4(mesh.matrixWorld);
    const c=new THREE.Vector3().fromBufferAttribute(positions,index?index.getX(i+2):i+2).applyMatrix4(mesh.matrixWorld);
    const normal=b.clone().sub(a).cross(c.clone().sub(a)),area=normal.length()/2;
    if(area<MIN_REFLECTING_TRIANGLE_AREA)continue;
    physical=true;normal.normalize();
    faces.push({id:`${partId}:${i/3}`,objectId,mesh,triangle:new THREE.Triangle(a,b,c),normal});
   }
   if(physical)occluders.push(mesh);
  });
 }
 return {faces,occluders};
}

export function segmentIsClear(from,to,occluders){
 const direction=to.clone().sub(from),distance=direction.length();
 if(distance<EPS)return false;
 const ray=new THREE.Raycaster(from,direction.normalize(),EPS,distance-EPS);
 return !ray.intersectObjects(occluders,false).length;
}

export function firstObjectReflection(source,receiver,face,occluders=[]){
 const {triangle,normal}=face,sourceSide=normal.dot(source.clone().sub(triangle.a)),receiverSide=normal.dot(receiver.clone().sub(triangle.a));
 if(Math.abs(sourceSide)<EPS||Math.abs(receiverSide)<EPS||sourceSide*receiverSide<=0)return null;
 const image=receiver.clone().addScaledVector(normal,-2*receiverSide);
 const t=sourceSide/(sourceSide+receiverSide);
 if(t<=EPS||t>=1-EPS)return null;
 const point=source.clone().lerp(image,t);
 if(!triangle.containsPoint(point))return null;
 if(!segmentIsClear(source,point,occluders)||!segmentIsClear(receiver,point,occluders))return null;
 return {point,length:source.distanceTo(point)+point.distanceTo(receiver),normal:normal.clone().multiplyScalar(Math.sign(sourceSide))};
}
