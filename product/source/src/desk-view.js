import * as THREE from 'three';
import {COMBODESK_88 as D} from './desk-model.js';

// Origin at the floor centre. The rear shelf faces -Z and the keyboard tray faces +Z.
export function createDeskView(record){
 const group=new THREE.Group();group.name=record.id;group.userData.recordId=record.id;
 const board=new THREE.MeshStandardMaterial({color:0x242426,roughness:0.8});
 const edge=new THREE.MeshStandardMaterial({color:0x111214,roughness:0.7});
 const metal=new THREE.MeshStandardMaterial({color:0x55595e,metalness:0.8,roughness:0.45});
 const geometries=[];
 function mesh(name,geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.name=name;m.position.set(x,y,z);group.add(m);geometries.push(geometry);return m;}
 function box(name,w,h,d,x,y,z,material=board){return mesh(name,new THREE.BoxGeometry(w,h,d),material,x,y,z);}
 const sideRear=-0.290;
 const topY=D.worktop.top-D.worktop.thickness/2;
 const workZ=(D.depth-D.worktop.depth)/2;
 box('worktop',D.worktop.width,D.worktop.thickness,D.worktop.depth,0,topY,workZ);
 // The side is inset beneath the tabletop. Its front edge bows deeply inward
 // at knee height, then returns forward to form the broad foot at floor level.
 for(const sign of [-1,1]){
  const shape=new THREE.Shape();
  shape.moveTo(sideRear,0);
  shape.lineTo(0.250,0);
  shape.lineTo(0.250,0.018);
  shape.bezierCurveTo(0.125,0.135,0.095,0.260,0.125,0.335);
  shape.bezierCurveTo(0.145,0.455,0.315,0.500,0.315,0.610);
  shape.lineTo(0.315,D.worktop.top-D.worktop.thickness);
  shape.lineTo(sideRear,D.worktop.top-D.worktop.thickness);
  shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:0.018,bevelEnabled:false,curveSegments:24});
  g.rotateY(-Math.PI/2);
  mesh('shaped-side-panel',g,board,sign*(D.width/2-0.027)+0.009,0,0);
  box('keyboard-runner',0.010,0.016,0.33,sign*0.779,0.635,0.13,metal);
 }
 // Sliding tray is modelled closed, with its metal runners visible from the sides.
 box('keyboard-tray',D.keyboardTray.width,D.keyboardTray.thickness,D.keyboardTray.depth,0,0.622,0.155);
 box('keyboard-tray-front',D.keyboardTray.width,0.045,0.018,0,0.616,0.314,edge);
 // Rear cable channel and a back panel with three actual circular pass-throughs.
 const back=new THREE.Shape();back.moveTo(-0.768,0.415);back.lineTo(0.768,0.415);back.lineTo(0.768,0.755);back.lineTo(-0.768,0.755);back.closePath();
 for(const x of [-0.46,0,0.46]){
  const hole=new THREE.Path();hole.absarc(x,0.706,0.025,0,Math.PI*2,true);back.holes.push(hole);
 }
 const backGeometry=new THREE.ExtrudeGeometry(back,{depth:0.012,bevelEnabled:false,curveSegments:20});
 mesh('rear-panel-three-cable-holes',backGeometry,board,0,0,sideRear);
 box('cable-trough',1.51,0.012,0.095,0,0.48,sideRear+0.095/2);
 box('rear-lower-crossbar',1.50,0.12,0.018,0,0.44,sideRear+0.018/2);
 // Fasteners on the outer face follow the pattern visible in the side photo.
 for(const sign of [-1,1])for(const [z,y] of [[-0.060,0.690],[-0.060,0.505],[-0.205,0.430],[-0.085,0.430],[-0.235,0.335]]){
  const screw=mesh('side-screw',new THREE.CylinderGeometry(0.0035,0.0035,0.001,12),metal,sign*(D.width/2-0.0175),y,z);
  screw.rotation.z=Math.PI/2;screw.userData.collision=false;
 }
 group.position.set(record.position.x,record.position.y,record.position.z);group.rotation.y=record.yaw;group.updateMatrixWorld(true);
 return {group,dispose(){for(const geometry of geometries)geometry.dispose();for(const material of [board,edge,metal])material.dispose();}};
}

