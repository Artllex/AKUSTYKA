import * as THREE from 'three';
import {roomRayEnd,headIntersection} from './aim-ray.js';
import {MIN_LISTENING_DISTANCE,nearestEarDistance} from './monitor-clearance.js';
import {createDistanceLabel} from './distance-label.js';
export function createTweeterRays(monitors,listener,room,visible=true,roomSurfaces=null){
 const group=new THREE.Group();group.name='tweeter-rays';group.visible=visible;
 const colors={close:0xff303d,clear:0x55e69a},materials={};let hitCount=0,tooCloseCount=0;
 for(const monitor of monitors){
  const tweeter=monitor.getDriverCenters().find(d=>d.id==='tweeter');if(!tweeter)continue;
  const {position:origin,normal:direction}=tweeter,wall=roomSurfaces?(roomSurfaces.forEach(s=>s.updateMatrixWorld(true)),new THREE.Raycaster(origin,direction,0.00001,200).intersectObjects(roomSurfaces,false)[0]?.point??origin.clone().addScaledVector(direction,60)):roomRayEnd(origin,direction,room),hit=headIntersection(origin,direction,listener);
  const target=hit&&hit.distanceTo(origin)<=wall.distanceTo(origin)+1e-8?hit:wall;
  const length=target.distanceTo(origin);if(length<1e-8)continue;
  const listeningDistance=nearestEarDistance(origin,listener),tooClose=listeningDistance<MIN_LISTENING_DISTANCE-1e-7;if(tooClose)tooCloseCount++;
  const color=tooClose?'close':'clear';materials[color]??=new THREE.MeshBasicMaterial({color:colors[color],transparent:true,opacity:0.95});
  const ray=new THREE.Mesh(new THREE.CylinderGeometry(0.003,0.003,length,6),materials[color]);ray.name='ray-'+monitor.group.name;ray.position.copy(origin).add(target).multiplyScalar(0.5);ray.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);group.add(ray);
  ray.userData={origin:origin.clone(),direction:direction.clone(),target:target.clone(),headHit:target===hit,listeningDistance,tooClose};
  const label=createDistanceLabel(length,ray.position.clone().add(new THREE.Vector3(0,.05,0)),colors[color]);label.name='distance-ray-'+monitor.group.name;group.add(label);
  if(target===hit){hitCount++;const dot=new THREE.Mesh(new THREE.SphereGeometry(0.006,12,8),materials[color]);dot.name='head-hit-'+monitor.group.name;dot.position.copy(hit).addScaledVector(direction,-0.002);group.add(dot);}
 }
 return {group,hitCount,tooCloseCount,rayCount:group.children.filter(o=>o.name.startsWith('ray-')).length,dispose(){group.traverse(o=>{o.geometry?.dispose();if(o.isSprite){o.material.map?.dispose();o.material.dispose();}});Object.values(materials).forEach(m=>m.dispose());}};
}

