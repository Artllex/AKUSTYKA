import * as THREE from 'three';
import {MODUL_STUDIO_DESK as D} from './modul-desk-model.js';

// Local +Z is the keyboard side; the record turns that side toward the listener.
export function createModulDeskView(record){
 const group=new THREE.Group();group.name=record.id;group.userData.recordId=record.id;
 const board=new THREE.MeshStandardMaterial({color:0x202124,roughness:.78});
 const edge=new THREE.MeshStandardMaterial({color:0x101113,roughness:.72});
 const metal=new THREE.MeshStandardMaterial({color:0x43464a,metalness:.7,roughness:.46});
 const geometries=[];
 function mesh(name,geometry,material,x=0,y=0,z=0){const item=new THREE.Mesh(geometry,material);item.name=name;item.position.set(x,y,z);group.add(item);geometries.push(geometry);return item;}
 function box(name,w,h,d,x,y,z,material=board){return mesh(name,new THREE.BoxGeometry(w,h,d),material,x,y,z);}
 // Top has the real cable opening near its rear edge.
 const top=new THREE.Shape(),front=-D.top.frontZ,rear=front+D.top.depth;top.moveTo(-D.top.width/2,front);top.lineTo(D.top.width/2,front);top.lineTo(D.top.width/2,rear);top.lineTo(-D.top.width/2,rear);top.closePath();
 const hole=new THREE.Path();hole.absarc(0,.17,.028,0,Math.PI*2,true);top.holes.push(hole);
 const topGeometry=new THREE.ExtrudeGeometry(top,{depth:D.top.thickness,bevelEnabled:false,curveSegments:24});topGeometry.rotateX(-Math.PI/2);
 mesh('main-top-with-cable-hole',topGeometry,board,0,D.height-D.top.thickness,0);
 const grommet=mesh('cable-grommet-ring',new THREE.RingGeometry(.028,.034,32),metal,0,D.height+.0006,-.17);grommet.rotation.x=-Math.PI/2;grommet.userData.collision=false;
 // Two outward-slanting side panels have the shallow curved arch visible at floor level.
 for(const sign of [-1,1]){
  const side=new THREE.Shape();side.moveTo(-.35,0);side.quadraticCurveTo(-.10,.115,.12,.055);side.quadraticCurveTo(.23,.02,.35,0);side.lineTo(.25,D.height-D.top.thickness);side.lineTo(-.35,D.height-D.top.thickness);side.closePath();
  const geometry=new THREE.ExtrudeGeometry(side,{depth:D.sideThickness,bevelEnabled:false,curveSegments:24});geometry.rotateY(-Math.PI/2);
  mesh('curved-side-panel',geometry,board,sign*(D.width/2-D.sideThickness/2)+D.sideThickness/2,0,0);
  box('tray-runner',.008,.015,.34,sign*(D.tray.width/2+.008),D.height-D.tray.drop-.01,.08,metal);
 }
 // Closed sliding tray and its front lip; its 100 mm drop matches the dimension drawing.
 const trayY=D.height-D.tray.drop-D.tray.thickness/2;
 box('pull-out-keyboard-tray',D.tray.width,D.tray.thickness,D.tray.depth,0,trayY,.08);
 box('tray-front-lip',D.tray.width,.025,.014,0,trayY-.01,.257,edge);
 // Rear modesty panel, shallow cable shelf, and the narrow central floor support.
 box('rear-modesty-panel',D.width-.05,.19,.018,0,.61,-.322);
 box('cable-shelf',D.width-.08,.014,.125,0,.59,-.249);
 box('centre-support',.018,.575,.22,0,.2875,-.22);
 group.position.set(record.position.x,record.position.y,record.position.z);group.rotation.y=record.yaw;group.updateMatrixWorld(true);
 return {group,dispose(){for(const geometry of geometries)geometry.dispose();for(const material of [board,edge,metal])material.dispose();}};
}
