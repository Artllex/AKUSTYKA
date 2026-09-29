import * as THREE from 'three';
import {createListenerRecord,normalizeListenerRecord,solveKnee,DEFAULT_LISTENER_SETTINGS} from './listener-model.js';
import {solveElbow} from './pose-kinematics.js';
export {createListenerRecord};
export const SEATED_POSE=Object.freeze({...DEFAULT_LISTENER_SETTINGS,headCenterHeight:1.185,earHeight:1.185,headTopHeight:1.305,leanDegrees:10});
export function createSeatedListener(input){
 const record=normalizeListenerRecord(input),s=record.stature/1.68,seat=record.seatHeight,hipY=seat+0.085*s;
 const group=new THREE.Group();group.name='seated-listener';
 const body=new THREE.MeshStandardMaterial({color:0xd5dcd8,roughness:0.65}),joints=new THREE.MeshStandardMaterial({color:0x657e84,roughness:0.75}),headMaterial=new THREE.MeshStandardMaterial({color:0xf1dac5,roughness:0.75}),chair=new THREE.MeshStandardMaterial({color:0x303e4b,roughness:0.78}),metal=new THREE.MeshStandardMaterial({color:0x8497a4,metalness:0.6,roughness:0.35}),earMaterial=new THREE.MeshStandardMaterial({color:0x80e0c5,roughness:0.5});
 function mesh(name,geometry,material,position,parent=group){const m=new THREE.Mesh(geometry,material);m.name=name;m.position.set(...position);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function ellipsoid(name,position,scale,material=body,parent=group){const m=mesh(name,new THREE.SphereGeometry(1,16,12),material,position,parent);m.scale.set(...scale);return m;}
 function box(name,position,size,material){return mesh(name,new THREE.BoxGeometry(...size),material,position);}
 function limb(name,a,b,r1,r2,material=body,parent=group){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),d=end.clone().sub(start);const m=mesh(name,new THREE.CylinderGeometry(r2,r1,d.length(),12),material,start.clone().add(end).multiplyScalar(0.5).toArray(),parent);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
 const scaled=values=>values.map(v=>v*s);
 box('chair-seat',[0,seat-0.0225,0],[0.45,0.045,0.42],chair);
 const back=box('chair-back',[0,seat+0.33,0.205],[0.42,0.49,0.055],chair);back.rotation.x=-0.08;
 limb('chair-column',[0,0.12,0],[0,seat-0.045,0],0.025,0.032,metal);
 for(let i=0;i<5;i++){const angle=i*Math.PI*2/5,x=Math.cos(angle)*0.32,z=Math.sin(angle)*0.32;limb('chair-spoke-'+i,[0,0.12,0],[x,0.072,z],0.018,0.018,metal);const wheel=mesh('caster-'+i,new THREE.CylinderGeometry(0.035,0.035,0.035,12),chair,[x,0.035,z]);wheel.rotation.z=Math.PI/2;wheel.rotation.y=-angle;}
 ellipsoid('pelvis',[0,hipY,0],scaled([0.16,0.085,0.13]));
 // Upper body has its own hip pivot; lower-body geometry does not use lean or head angles.
 const upper=new THREE.Group();upper.name='upper-body';upper.position.set(0,hipY,-0.025*s);upper.rotation.set(-THREE.MathUtils.degToRad(record.leanForward),0,-THREE.MathUtils.degToRad(record.leanSide),'YXZ');group.add(upper);
 ellipsoid('torso',scaled([0,0.29,0]),scaled([0.19,0.255,0.105]),body,upper);
 limb('neck',scaled([0,0.515,0]),scaled([0,0.575,0]),0.049*s,0.047*s,headMaterial,upper);
 const headPivot=new THREE.Group();headPivot.name='head-pivot';headPivot.position.set(0,0.56*s,0);
 const headOrientation=new THREE.Quaternion().setFromEuler(new THREE.Euler(-THREE.MathUtils.degToRad(record.headPitch),-THREE.MathUtils.degToRad(record.headYaw),-THREE.MathUtils.degToRad(record.headRoll),'YXZ'));
 // Cancel the torso's rotation: head angles remain relative to the listener's room heading.
 headPivot.quaternion.copy(upper.quaternion).invert().multiply(headOrientation);upper.add(headPivot);
 const headY=1.185-0.52-0.56*Math.cos(THREE.MathUtils.degToRad(10));
 ellipsoid('head',scaled([0,headY,0]),scaled([0.081,0.12,0.092]),headMaterial,headPivot);
 ellipsoid('nose',scaled([0,headY-0.002,-0.09]),scaled([0.015,0.022,0.022]),headMaterial,headPivot);
 ellipsoid('ear-left',scaled([-0.083,headY,0]),scaled([0.014,0.026,0.018]),earMaterial,headPivot);
 ellipsoid('ear-right',scaled([0.083,headY,0]),scaled([0.014,0.026,0.018]),earMaterial,headPivot);
 for(const side of [-1,1]){const tag=side<0?'left':'right',hip=[side*0.12*s,hipY,-0.025*s],ankle=scaled([side*0.12,0.095,-0.425]),knee=solveKnee(hip,ankle,0.393*s,0.38*s);
  limb('thigh-'+tag,hip,knee,0.078*s,0.06*s);ellipsoid('knee-'+tag,knee,scaled([0.061,0.061,0.061]),joints);limb('shin-'+tag,knee,ankle,0.05*s,0.034*s);ellipsoid('ankle-'+tag,ankle,scaled([0.035,0.04,0.035]),joints);box('foot-'+tag,scaled([side*0.12,0.0375,-0.493]),scaled([0.095,0.075,0.235]),joints);
  const baseline=new THREE.Quaternion().setFromEuler(new THREE.Euler(-THREE.MathUtils.degToRad(DEFAULT_LISTENER_SETTINGS.leanForward),0,0));
  const inBody=values=>new THREE.Vector3(...scaled(values)).applyQuaternion(upper.quaternion).add(upper.position).toArray();
  const fixed=values=>new THREE.Vector3(...scaled(values)).applyQuaternion(baseline).add(upper.position).toArray();
  const shoulder=inBody([side*0.178,0.48,0]),wrist=fixed([side*0.16,0.245,-0.30]),hand=fixed([side*0.16,0.238,-0.345]);
  const elbow=solveElbow(shoulder,wrist,inBody([side*0.35,0.26,0.02]),0.285*s,0.27*s);
  ellipsoid('shoulder-'+tag,shoulder,scaled([0.062,0.062,0.062]),body);
  limb('upper-arm-'+tag,shoulder,elbow,0.047*s,0.035*s,body);
  ellipsoid('elbow-'+tag,elbow,scaled([0.037,0.037,0.037]),joints);
  limb('forearm-'+tag,elbow,wrist,0.036*s,0.025*s,body);
  ellipsoid('wrist-'+tag,wrist,scaled([0.026,0.026,0.026]),joints);
  ellipsoid('hand-'+tag,hand,scaled([0.038,0.025,0.066]),headMaterial);
 }
 group.position.set(record.position.x,record.position.y,record.position.z);group.rotation.y=record.yaw;group.userData={id:record.id,type:record.type,stature:record.stature,seatHeight:seat};group.updateMatrixWorld(true);
 return {group,getEarHeight(){return (group.getObjectByName('ear-left').getWorldPosition(new THREE.Vector3()).y+group.getObjectByName('ear-right').getWorldPosition(new THREE.Vector3()).y)/2;},dispose(){group.traverse(o=>o.geometry?.dispose());for(const m of [body,joints,headMaterial,chair,metal,earMaterial])m.dispose();}};
}



