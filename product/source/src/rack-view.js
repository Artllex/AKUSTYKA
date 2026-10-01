import * as THREE from 'three';
import {RACK_15U} from './rack-model.js';

export function createRackView(record){
 const group=new THREE.Group();group.name=record.id;group.userData.recordId=record.id;
 const steel=new THREE.MeshStandardMaterial({color:0x202328,metalness:0.64,roughness:0.43});
 const edge=new THREE.MeshStandardMaterial({color:0x373b40,metalness:0.6,roughness:0.48});
 const slot=new THREE.MeshStandardMaterial({color:0x080a0d,roughness:0.95});
 const {width,depth,height,mountingHeight}=RACK_15U;
 function bar(name,w,h,d,x,y,z,material=steel){const part=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);part.name=name;part.position.set(x,y,z);group.add(part);return part;}
 // The mounting posts and two transverse bars form the open rear frame.
 for(const sign of [-1,1]){
  const x=sign*(width/2-0.019);
  bar('mounting-post',0.038,height,0.035,x,height/2,depth/2-0.018);
  bar('side-foot',0.024,0.044,depth,x,0.022,0,edge);
  bar('side-gusset',0.026,0.10,0.065,x,0.082,-depth/2+0.032);
  for(let unit=0;unit<15;unit++)for(let hole=0;hole<3;hole++){
   const y=0.032+(unit+(hole+0.5)/3)*(mountingHeight/15);
   const mark=bar('rack-mount-hole',0.008,0.009,0.001,x-sign*0.009,y,depth/2+0.0005,slot);
   mark.userData.collision=false;
  }
  for(let n=0;n<6;n++){
   const mark=bar('side-slot',0.001,0.027,0.006,sign*(width/2+0.001),0.10+n*0.105,depth/2-0.02,slot);
   mark.userData.collision=false;
  }
 }
 bar('top-brace',width,0.022,0.030,0,height-0.011,depth/2-0.018,edge);
 bar('bottom-brace',width,0.075,0.033,0,0.038,depth/2-0.018,edge);
 group.position.set(record.position.x,record.position.y,record.position.z);group.rotation.y=record.yaw;group.updateMatrixWorld(true);
 return {group,dispose(){group.traverse(part=>part.geometry?.dispose());steel.dispose();edge.dispose();slot.dispose();}};
}
