import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// The three OREA positions were agreed for the MM27 cabinet. Front is +Z.
export const OREA_BORDEAUX=Object.freeze({diameter:0.067,height:0.036,capacityKg:14.5,
 positions:Object.freeze([Object.freeze([-0.075,-0.060]),Object.freeze([0.075,-0.060]),Object.freeze([0,0.150])])});
export const KM_26795=Object.freeze({baseWidth:0.480,baseDepth:0.480,minHeight:0.794,maxHeight:1.344,
 plateWidth:0.420,plateDepth:0.380,plateThickness:0.005});

export function createMonitorSupport(cabinetBottomHeight){
 const group=new THREE.Group();group.name='km-26795-support';
 const black=new THREE.MeshStandardMaterial({color:0x17191b,metalness:0.36,roughness:0.67});
 const edge=new THREE.MeshStandardMaterial({color:0x282b2d,metalness:0.48,roughness:0.58});
 const rubber=new THREE.MeshStandardMaterial({color:0x0d0e10,roughness:0.88});
 const steel=new THREE.MeshStandardMaterial({color:0x8f9293,metalness:0.82,roughness:0.34});
 const bordeaux=new THREE.MeshStandardMaterial({color:0x7a263d,metalness:0.50,roughness:0.38});
 function add(name,geometry,material,x,y,z){const part=new THREE.Mesh(geometry,material);part.name=name;part.userData.collision=false;part.position.set(x,y,z);group.add(part);return part;}
 const plateTop=-OREA_BORDEAUX.height,plateBottom=plateTop-KM_26795.plateThickness;
 const floor=-cabinetBottomHeight;
 const baseTop=floor+0.018;
 add('km-26795-cast-base',new RoundedBoxGeometry(KM_26795.baseWidth,0.018,KM_26795.baseDepth,4,0.018),black,0,floor+0.009,0);
 add('km-26795-base-ridge',new RoundedBoxGeometry(0.17,0.010,0.17,3,0.009),edge,0,baseTop+0.003,0);
 const stemHeight=Math.max(0.05,plateBottom-baseTop);
 const lowerHeight=Math.min(0.66,stemHeight*0.79);
 const upperHeight=stemHeight-lowerHeight;
 add('km-26795-lower-tube',new RoundedBoxGeometry(0.104,lowerHeight,0.104,3,0.008),black,0,baseTop+lowerHeight/2,0);
 add('km-26795-upper-tube',new RoundedBoxGeometry(0.078,upperHeight+0.012,0.078,3,0.005),edge,0,baseTop+lowerHeight+upperHeight/2,0);
 add('km-26795-lock-collar',new THREE.CylinderGeometry(0.064,0.064,0.030,32),black,0,baseTop+lowerHeight,0);
 const knob=add('km-26795-clamping-knob',new THREE.CylinderGeometry(0.019,0.019,0.012,24),black,0,baseTop+lowerHeight,0.070);knob.rotation.x=Math.PI/2;
 add('km-26792-bearing-plate',new RoundedBoxGeometry(KM_26795.plateWidth,KM_26795.plateThickness,KM_26795.plateDepth,2,0.002),black,0,plateBottom+KM_26795.plateThickness/2,0);
 // Black elastomer flanges touch the speaker and the bearing plate. The
 // stainless housing carries the Bordeaux identifier ring near its base.
 for(const [i,[x,z]] of OREA_BORDEAUX.positions.entries()){
  const base=plateTop;
  const puck=new THREE.Group();puck.name=`orea-bordeaux-${i+1}`;puck.position.set(x,base,z);group.add(puck);
  function disc(name,topRadius,bottomRadius,height,y,material){const part=new THREE.Mesh(new THREE.CylinderGeometry(topRadius,bottomRadius,height,48),material);part.name=name;part.userData.collision=false;part.position.y=y;puck.add(part);return part;}
  disc('lower-rubber-flange',0.032,0.0335,0.005,0.0025,rubber);
  disc('bordeaux-identification-ring',0.0335,0.0335,0.002,0.006,bordeaux);
  disc('machined-steel-housing',0.0325,0.0335,0.023,0.0185,steel);
  disc('upper-rubber-flange',0.0325,0.0325,0.006,0.033,rubber);
  disc('upper-contact-pad',0.029,0.029,0.001,0.0355,rubber);
  const groove=new THREE.Mesh(new THREE.TorusGeometry(0.028,0.0008,6,48),edge);groove.name='upper-contact-groove';groove.userData.collision=false;groove.rotation.x=Math.PI/2;groove.position.y=0.0359;puck.add(groove);
 }
 return group;
}
