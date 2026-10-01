import * as THREE from 'three';
import {MM27} from './monitor-model.js';
import {distanceBetweenObjects} from './object-distance.js';
import {createDistanceLabel} from './distance-label.js';

// Barefoot MicroMain27 Gen2 owner's manual, Positioning (page 6/7).
export const MIN_LISTENING_DISTANCE=1;
export const MIN_WALL_CLEARANCE=0.127;

export function nearestEarDistance(tweeter,listener){
 if(!listener)return Infinity;
 listener.group.updateWorldMatrix(true,true);
 return Math.min(...['left','right'].map(side=>tweeter.distanceTo(listener.group.getObjectByName('ear-'+side).getWorldPosition(new THREE.Vector3()))));
}

function wallSurface(surface){return surface.name.startsWith('wall-')||/^niche-(back|left|right|step-front)/.test(surface.name);}
function boxGapSquared(a,b){let sum=0;for(const axis of ['x','y','z']){const gap=Math.max(0,a.min[axis]-b.max[axis],b.min[axis]-a.max[axis]);sum+=gap*gap;}return sum;}

// The published overall envelope includes handles and rear heatsink. Proxies
// keep hidden cutaway walls measurable without changing the live scene.
export function measureMonitorWallClearance(monitors,surfaces){
 const warnings=[],material=new THREE.MeshBasicMaterial();
 try{
  for(const monitor of monitors){
   monitor.group.updateWorldMatrix(true,false);
   const envelope=new THREE.Group();envelope.matrixAutoUpdate=false;envelope.matrix.copy(monitor.group.matrixWorld);
   const shape=new THREE.Mesh(new THREE.BoxGeometry(MM27.overall.width,MM27.overall.height,MM27.overall.depth),material);
   shape.position.set(0,MM27.overall.height/2,(0.197-0.245)/2);envelope.add(shape);
   const bounds=new THREE.Box3().setFromObject(envelope);
   for(const surface of surfaces.filter(wallSurface)){
    surface.updateWorldMatrix(true,false);
    const wall=new THREE.Mesh(surface.geometry,material);wall.matrixAutoUpdate=false;wall.matrix.copy(surface.matrixWorld);
    if(boxGapSquared(bounds,new THREE.Box3().setFromObject(wall))<MIN_WALL_CLEARANCE**2){
     const result=distanceBetweenObjects(monitor.group,wall);
     if(result&&result.distance<MIN_WALL_CLEARANCE-1e-7)warnings.push({...result,monitor:monitor.group.name,wall:surface.name});
    }
   }
   shape.geometry.dispose();
  }
 }finally{material.dispose();}
 return warnings;
}

export function createMonitorWallWarnings(monitors,surfaces){
 const group=new THREE.Group();group.name='monitor-wall-clearance';group.userData.helper=true;
 const warnings=measureMonitorWallClearance(monitors,surfaces),material=new THREE.MeshBasicMaterial({color:0xff303d,depthTest:false});
 for(const warning of warnings){
  const start=warning.start;
  const delta=warning.end.clone().sub(start),length=delta.length();if(length<1e-8)continue;
  const line=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,length,8),material);
  line.name=`wall-clearance-${warning.monitor}-${warning.wall}`;line.position.copy(start).add(warning.end).multiplyScalar(.5);
  line.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  line.userData={monitor:warning.monitor,wall:warning.wall,distance:warning.distance,start:start.clone(),end:warning.end.clone()};group.add(line);
  const label=createDistanceLabel(warning.distance,line.position,0xff777d);label.name=`wall-distance-${warning.monitor}-${warning.wall}`;line.userData.distanceLabel=label;group.add(label);
 }
 return {group,warnings,dispose(){group.traverse(o=>{o.geometry?.dispose();if(o.isSprite){o.material.map?.dispose();o.material.dispose();}});material.dispose();}};
}
