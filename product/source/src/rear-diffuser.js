import * as THREE from 'three';
import {BILLY_BOOKCASE,createBillyRecord} from './billy-model.js';
import {defaultRoomFeatures} from './room-features.js';

export const SKYLINE_CITY=Object.freeze({width:.44,height:.44,depth:.15,cells:11});

export function defaultRearDiffuser(room,features=defaultRoomFeatures(room),bookcase=createBillyRecord(room)){
 const doorRight=features.door.center+features.door.width/2;
 const yaw=bookcase.yaw,projectedHalfWidth=(BILLY_BOOKCASE.width*Math.abs(Math.cos(yaw))+BILLY_BOOKCASE.depth*Math.abs(Math.sin(yaw)))/2;
 const bookcaseLeft=bookcase.position.x-projectedHalfWidth;
 return {id:'rear-diffuser-skyline-city',model:'asound-skyline-city-44x44x15',width:SKYLINE_CITY.width,height:SKYLINE_CITY.height,depth:SKYLINE_CITY.depth,centerX:(doorRight+bookcaseLeft)/2,centerY:1.185};
}

export function normalizeRearDiffuser(input,room,features=defaultRoomFeatures(room),bookcase=createBillyRecord(room)){
 const item=input===undefined?defaultRearDiffuser(room,features,bookcase):input;
 if(item===null)return null;
 if(!item||item.id!=='rear-diffuser-skyline-city'||item.model!=='asound-skyline-city-44x44x15'||item.width!==SKYLINE_CITY.width||item.height!==SKYLINE_CITY.height||item.depth!==SKYLINE_CITY.depth||!Number.isFinite(item.centerX)||!Number.isFinite(item.centerY)||item.centerX-item.width/2<0||item.centerX+item.width/2>room.width||item.centerY-item.height/2<0||item.centerY+item.height/2>room.height||item.depth>room.length)throw new Error('Nieprawidłowy dyfuzor tylnej ściany.');
 return {id:item.id,model:item.model,width:item.width,height:item.height,depth:item.depth,centerX:item.centerX,centerY:item.centerY};
}

export function createRearDiffuserView(record,room){
 const group=new THREE.Group();group.name=record.id;group.userData.recordId=record.id;
 const wood=new THREE.MeshStandardMaterial({color:0x1d1e20,roughness:.78});
 const edge=new THREE.MeshStandardMaterial({color:0x111214,roughness:.85});
 const proxyMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
 const plateGeometry=new THREE.BoxGeometry(record.width,record.height,.012);
 const plate=new THREE.Mesh(plateGeometry,edge);plate.name='skyline-backing';plate.position.set(record.centerX,record.centerY,room.length-.006);plate.userData.collision=false;group.add(plate);
 const cell=record.width/SKYLINE_CITY.cells;
 const blockGeometry=new THREE.BoxGeometry(cell-.001,cell-.001,1);
 const blocks=new THREE.InstancedMesh(blockGeometry,wood,SKYLINE_CITY.cells**2);blocks.name='skyline-blocks';blocks.userData.collision=false;
 const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),scale=new THREE.Vector3(),rotation=new THREE.Quaternion();
 let index=0;
 for(let row=0;row<SKYLINE_CITY.cells;row++)for(let col=0;col<SKYLINE_CITY.cells;col++){
  const step=((col*col+row*row)%SKYLINE_CITY.cells)/10;
  const blockDepth=.012+step*(record.depth-.024);
  position.set(record.centerX-record.width/2+(col+.5)*cell,record.centerY-record.height/2+(row+.5)*cell,room.length-.012-blockDepth/2);
  scale.set(1,1,blockDepth);matrix.compose(position,rotation,scale);blocks.setMatrixAt(index++,matrix);
 }
 blocks.instanceMatrix.needsUpdate=true;blocks.computeBoundingBox();blocks.computeBoundingSphere();group.add(blocks);
 const proxyGeometry=new THREE.PlaneGeometry(record.width,record.height);
 const proxy=new THREE.Mesh(proxyGeometry,proxyMaterial);proxy.name='skyline-acoustic-proxy';proxy.rotation.y=Math.PI;proxy.position.set(record.centerX,record.centerY,room.length-record.depth);group.add(proxy);
 group.updateMatrixWorld(true);
 return {group,dispose(){plateGeometry.dispose();blockGeometry.dispose();proxyGeometry.dispose();wood.dispose();edge.dispose();proxyMaterial.dispose();}};
}
