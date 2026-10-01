import * as THREE from 'three';
import {COMBODESK_88 as D} from './desk-model.js';

// Origin at the floor centre. The rear shelf faces -Z and the keyboard tray faces +Z.
export function createDeskView(record){
 const group=new THREE.Group();group.name=record.id;group.userData.recordId=record.id;
 const board=new THREE.MeshStandardMaterial({color:0x242426,roughness:0.8});
 const edge=new THREE.MeshStandardMaterial({color:0x111214,roughness:0.7});
 const metal=new THREE.MeshStandardMaterial({color:0x55595e,metalness:0.8,roughness:0.45});
 const dark=new THREE.MeshStandardMaterial({color:0x08090a,roughness:0.92});
 const geometries=[];
 function mesh(name,geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.name=name;m.position.set(x,y,z);group.add(m);geometries.push(geometry);return m;}
 function box(name,w,h,d,x,y,z,material=board){return mesh(name,new THREE.BoxGeometry(w,h,d),material,x,y,z);}
 const topY=D.worktop.top-D.worktop.thickness/2;
 const workZ=(D.depth-D.worktop.depth)/2;
 box('worktop',D.worktop.width,D.worktop.thickness,D.worktop.depth,0,topY,workZ);
 box('upper-shelf',D.upperShelf.width,D.upperShelf.thickness,D.upperShelf.depth,0,D.upperShelf.top-D.upperShelf.thickness/2,-(D.depth-D.upperShelf.depth)/2);
 // Four 2U bays under the raised shelf: outer walls and two partitions.
 const rackHeight=D.upperShelf.top-D.upperShelf.thickness-D.worktop.top;
 for(let i=0;i<4;i++){
  const x=-D.width/2+0.030+i*(D.width-0.060)/3;
  box('rack-divider',0.018,rackHeight,D.upperShelf.depth-0.030,x,D.worktop.top+rackHeight/2,-(D.depth-D.upperShelf.depth)/2);
  if(i<3){for(let row=0;row<6;row++){
   const hole=box('rack-mount-hole',0.004,0.004,0.001,x+0.012,D.worktop.top+0.011+row*0.011,-0.246,dark);
   hole.userData.collision=false;
  }}
 }
 // The two full-height side panels have the curved front edge seen in the references.
 for(const sign of [-1,1]){
  const shape=new THREE.Shape();
  shape.moveTo(-D.depth/2,0);shape.lineTo(D.depth/2,0);
  shape.lineTo(D.depth/2,0.30);
  shape.bezierCurveTo(D.depth/2-0.08,0.44,D.depth/2-0.12,0.59,D.depth/2-0.10,D.worktop.top-D.worktop.thickness);
  shape.lineTo(-D.depth/2,D.worktop.top-D.worktop.thickness);shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:0.018,bevelEnabled:false,curveSegments:12});
  g.rotateY(-Math.PI/2);
  mesh('shaped-side-panel',g,board,sign*(D.width/2-0.018),0,0);
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
 mesh('rear-panel-three-cable-holes',backGeometry,board,0,0,-D.depth/2+0.025);
 box('cable-trough',1.51,0.012,0.095,0,0.48,-0.286);
 box('rear-lower-crossbar',1.50,0.12,0.018,0,0.44,-0.332);
 // Small hardware marks preserve the visible construction without dominating the model.
 for(const x of [-0.775,0.775])for(const y of [0.52,0.69]){
  const screw=mesh('side-screw',new THREE.CylinderGeometry(0.0035,0.0035,0.001,12),metal,x,y,0.12);
  screw.rotation.z=Math.PI/2;screw.userData.collision=false;
 }
 group.position.set(record.position.x,record.position.y,record.position.z);group.rotation.y=record.yaw;group.updateMatrixWorld(true);
 return {group,dispose(){for(const geometry of geometries)geometry.dispose();for(const material of [board,edge,metal,dark])material.dispose();}};
}

