import * as THREE from 'three';
import {BILLY_BOOKCASE} from './billy-model.js';

export function createBillyView(record){
 const group=new THREE.Group();group.name=record.id;group.userData.recordId=record.id;
 const board=new THREE.MeshStandardMaterial({color:0xf3f1eb,roughness:0.78});
 const edge=new THREE.MeshStandardMaterial({color:0xe5e3dc,roughness:0.82});
 const back=new THREE.MeshStandardMaterial({color:0xe9e8e2,roughness:0.88,side:THREE.DoubleSide});
 const geometries=[];
 function panel(name,w,h,d,x,y,z,material=board){
  const geometry=new THREE.BoxGeometry(w,h,d),mesh=new THREE.Mesh(geometry,material);
  mesh.name=name;mesh.position.set(x,y,z);group.add(mesh);geometries.push(geometry);return mesh;
 }
 const {width,depth,height,shelves}=BILLY_BOOKCASE;
 const side=0.019,top=0.019,shelf=0.018,backThickness=0.003;
 for(const sign of [-1,1])panel('billy-side',side,height,depth,sign*(width-side)/2,height/2,0);
 panel('billy-top',width-2*side,top,depth,0,height-top/2,0);
 panel('billy-bottom',width-2*side,shelf,depth-backThickness,0,0.105, -backThickness/2);
 // Five visible shelves divide the open bookcase into six bays. The thin
 // rear sheet is separate from the structural boards, like the real unit.
 for(let index=1;index<=shelves;index++){
  const y=0.105+(height-top-0.105)*index/(shelves+1);
  panel('billy-shelf-'+index,width-2*side,shelf,depth-backThickness,0,y,-backThickness/2);
  panel('billy-shelf-front-'+index,width-2*side,0.002,0.002,0,y,-depth/2+0.001,edge).userData.collision=false;
 }
 panel('billy-back',width-2*side,height-0.105-top,backThickness,0,(height+0.105-top)/2,depth/2-backThickness/2,back);
 panel('billy-plinth',width-2*side,0.088,0.016,0,0.044,-depth/2+0.031,edge);
 group.position.set(record.position.x,record.position.y,record.position.z);
 group.rotation.y=record.yaw;group.updateMatrixWorld(true);
 return {group,dispose(){for(const geometry of geometries)geometry.dispose();board.dispose();edge.dispose();back.dispose();}};
}
