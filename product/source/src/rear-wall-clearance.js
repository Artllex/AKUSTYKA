import * as THREE from 'three';
import {distanceBetweenObjects,distanceFromPointToObject} from './object-distance.js';

const isWall=surface=>surface.name.startsWith('wall-')||/^niche-(back|left|right|step-front)/.test(surface.name);

// Select the first physical wall in the direction behind the speaker. The
// point-to-surface distance is then taken to that same wall, including openings.
export function measureRearWallClearance(monitors,surfaces){
 const walls=surfaces.filter(isWall),raycaster=new THREE.Raycaster(),results=[];
 for(const wall of walls)wall.updateWorldMatrix(true,false);
 for(const monitor of monitors){
  monitor.group.updateWorldMatrix(true,true);
  const center=monitor.getRearFaceCenter();
  const backward=new THREE.Vector3(0,0,-1).transformDirection(monitor.group.matrixWorld);
  raycaster.set(center.clone().addScaledVector(backward,0.0001),backward);
  const hit=raycaster.intersectObjects(walls,false)[0];
  const wall=hit?.object??walls.map(surface=>({surface,gap:distanceFromPointToObject(center,surface)})).filter(x=>x.gap).sort((a,b)=>a.gap.distance-b.gap.distance)[0]?.surface;
  if(!wall)continue;
  const centerGap=distanceFromPointToObject(center,wall),nearestGap=distanceBetweenObjects(monitor.group,wall);
  if(centerGap&&nearestGap)results.push({monitor:monitor.group.name,wall:wall.name,center:centerGap,nearest:nearestGap});
 }
 return results;
}
