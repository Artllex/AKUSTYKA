import * as THREE from 'three';
import {createDistanceLabel} from './distance-label.js';

export function createMonitorSpan(monitors){
 const group=new THREE.Group();group.name='monitor-span';group.userData.helper=true;
 const centers=monitors.map(m=>m.getDriverCenters().find(d=>d.id==='tweeter')?.position).filter(Boolean);
 if(centers.length!==2)return {group,distance:null,dispose(){}};
 const [start,end]=centers.map(p=>p.clone()),axis=end.clone().sub(start),distance=axis.length();
 if(distance<1e-8)return {group,distance:0,dispose(){}};
 const material=new THREE.MeshBasicMaterial({color:0x58aaff,transparent:true,opacity:0.95,depthTest:false});
 const ray=new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.004,distance,8),material);
 ray.name='monitor-span-ray';ray.position.copy(start).add(end).multiplyScalar(0.5);
 ray.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize());
 ray.userData={origin:start,target:end,hoverOnly:true};ray.visible=false;group.add(ray);
 const label=createDistanceLabel(distance,ray.position,0x58aaff);
 label.name='distance-monitor-span';ray.userData.distanceLabel=label;group.add(label);
 return {group,distance,dispose(){ray.geometry.dispose();material.dispose();label.material.map?.dispose();label.material.dispose();}};
}
