import * as THREE from 'three';
import {roomRayEnd,headIntersection} from './aim-ray.js';
export function createTweeterRays(monitors,listener,room,visible=true,roomSurfaces=null){
 const group=new THREE.Group();group.name='tweeter-rays';group.visible=visible;
 const beam=new THREE.MeshBasicMaterial({color:0xff6157,transparent:true,opacity:0.95}),spot=new THREE.MeshBasicMaterial({color:0xff342e});let hitCount=0;
 for(const monitor of monitors){
  const tweeter=monitor.getDriverCenters().find(d=>d.id==='tweeter');if(!tweeter)continue;
  const {position:origin,normal:direction}=tweeter,wall=roomSurfaces?(roomSurfaces.forEach(s=>s.updateMatrixWorld(true)),new THREE.Raycaster(origin,direction,0.00001,200).intersectObjects(roomSurfaces,false)[0]?.point??origin.clone().addScaledVector(direction,60)):roomRayEnd(origin,direction,room),hit=headIntersection(origin,direction,listener);
  const target=hit&&hit.distanceTo(origin)<=wall.distanceTo(origin)+1e-8?hit:wall;
  const length=target.distanceTo(origin);if(length<1e-8)continue;
  const ray=new THREE.Mesh(new THREE.CylinderGeometry(0.003,0.003,length,6),beam);ray.name='ray-'+monitor.group.name;ray.position.copy(origin).add(target).multiplyScalar(0.5);ray.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);group.add(ray);
  ray.userData={origin:origin.clone(),direction:direction.clone(),target:target.clone(),headHit:target===hit};
  if(target===hit){hitCount++;const dot=new THREE.Mesh(new THREE.SphereGeometry(0.006,12,8),spot);dot.name='head-hit-'+monitor.group.name;dot.position.copy(hit).addScaledVector(direction,-0.002);group.add(dot);}
 }
 return {group,hitCount,rayCount:group.children.filter(o=>o.name.startsWith('ray-')).length,dispose(){group.traverse(o=>o.geometry?.dispose());beam.dispose();spot.dispose();}};
}

