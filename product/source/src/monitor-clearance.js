import * as THREE from 'three';
import {MM27} from './monitor-model.js';
import {distanceBetweenObjects} from './object-distance.js';
import {createDistanceLabel} from './distance-label.js';
import {measureRearWallClearance} from './rear-wall-clearance.js';

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
 const warnings=measureMonitorWallClearance(monitors,surfaces),rearClearances=measureRearWallClearance(monitors,surfaces);
 const materials=new Map();
 function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshBasicMaterial({color,depthTest:false}));return materials.get(color);}
 function addLine(name,labelName,monitor,wall,measurement,title,color,radius){
  const {start,end,distance}=measurement,delta=end.clone().sub(start);if(delta.length()<1e-8)return;
  const line=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,distance,8),material(color));
  line.name=name;line.position.copy(start).add(end).multiplyScalar(.5);
  line.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  line.userData={monitor,wall,distance,start:start.clone(),end:end.clone(),measurement:title};group.add(line);
  const label=createDistanceLabel(distance,line.position,color,title);label.name=labelName;line.userData.distanceLabel=label;group.add(label);
 }
 const rearKeys=new Set(rearClearances.map(r=>r.monitor+':'+r.wall));
 for(const warning of warnings){
  if(rearKeys.has(warning.monitor+':'+warning.wall))continue;
  addLine(`wall-clearance-${warning.monitor}-${warning.wall}`,`wall-distance-${warning.monitor}-${warning.wall}`,warning.monitor,warning.wall,warning,'Najbliższy punkt',0xff303d,0.006);
 }
 for(const item of rearClearances){
  const nearestColor=item.nearest.distance<MIN_WALL_CLEARANCE-1e-7?0xff303d:0x55e69a;
  const centerColor=item.center.distance<MIN_WALL_CLEARANCE-1e-7?0xff303d:0x55e69a;
  addLine(`wall-clearance-${item.monitor}-${item.wall}`,`wall-distance-${item.monitor}-${item.wall}`,item.monitor,item.wall,item.nearest,'Najbliższy punkt',nearestColor,0.006);
  addLine(`rear-center-clearance-${item.monitor}-${item.wall}`,`rear-center-distance-${item.monitor}-${item.wall}`,item.monitor,item.wall,item.center,'Środek tyłu',centerColor,0.004);
 }
 return {group,warnings,rearClearances,dispose(){group.traverse(o=>{o.geometry?.dispose();if(o.isSprite){o.material.map?.dispose();o.material.dispose();}});for(const m of materials.values())m.dispose();}};
}