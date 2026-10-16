import * as THREE from 'three';
import {BILLY_BOOKCASE,createBillyRecord} from './billy-model.js';
import {defaultRoomFeatures} from './room-features.js';

export const BINARY_DIFFUSER=Object.freeze({width:.60,height:1.20,depth:.11,switchGap:.01});
const ID='rear-diffuser-binary';
const MODEL='asound-binary-120x60x11';

export function defaultRearDiffuser(room,features=defaultRoomFeatures(room),bookcase=createBillyRecord(room)){
 const doorRight=features.door.center+features.door.width/2;
 const yaw=bookcase.yaw,projectedHalfWidth=(BILLY_BOOKCASE.width*Math.abs(Math.cos(yaw))+BILLY_BOOKCASE.depth*Math.abs(Math.sin(yaw)))/2;
 const bookcaseLeft=bookcase.position.x-projectedHalfWidth;
 const centerX=features.switch.center;
 if(centerX-BINARY_DIFFUSER.width/2<=doorRight||centerX+BINARY_DIFFUSER.width/2>=bookcaseLeft)throw new Error('Dyfuzor nie mieści się nad włącznikiem między futryną a regałem.');
 return {id:ID,model:MODEL,width:BINARY_DIFFUSER.width,height:BINARY_DIFFUSER.height,depth:BINARY_DIFFUSER.depth,centerX,centerY:features.switch.bottom+features.switch.height+BINARY_DIFFUSER.switchGap+BINARY_DIFFUSER.height/2};
}

export function normalizeRearDiffuser(input,room,features=defaultRoomFeatures(room),bookcase=createBillyRecord(room)){
 const item=input===undefined||input?.id==='rear-diffuser-skyline-city'?defaultRearDiffuser(room,features,bookcase):input;
 if(item===null)return null;
 if(!item||item.id!==ID||item.model!==MODEL||item.width!==BINARY_DIFFUSER.width||item.height!==BINARY_DIFFUSER.height||item.depth!==BINARY_DIFFUSER.depth||!Number.isFinite(item.centerX)||!Number.isFinite(item.centerY)||item.centerX-item.width/2<0||item.centerX+item.width/2>room.width||item.centerY-item.height/2<0||item.centerY+item.height/2>room.height||item.depth>room.length)throw new Error('Nieprawidłowy dyfuzor tylnej ściany.');
 return {id:item.id,model:item.model,width:item.width,height:item.height,depth:item.depth,centerX:item.centerX,centerY:item.centerY};
}

export function createRearDiffuserView(record,room){
 const group=new THREE.Group();group.name=record.id;group.userData.recordId=record.id;
 const side=new THREE.MeshStandardMaterial({color:0x17181a,roughness:.86});
 const white=new THREE.MeshStandardMaterial({color:0xf6f5f1,roughness:.86});
 const dotMaterial=new THREE.MeshStandardMaterial({color:0x101113,roughness:1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 const proxyMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
 const bodyGeometry=new THREE.BoxGeometry(record.width,record.height,record.depth);
 const body=new THREE.Mesh(bodyGeometry,[side,side,side,side,side,white]);
 body.name='binary-case';body.position.set(record.centerX,record.centerY,room.length-record.depth/2);body.userData.collision=false;group.add(body);
 const rows=59,columns=29,pitchX=record.width/(columns+1),pitchY=record.height/(rows+1);
 const cells=[];
 for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
  const mirror=Math.min(column,columns-1-column);
  if((row*31+mirror*17+row*mirror*7)%13<5)cells.push([row,column]);
 }
 const dotGeometry=new THREE.CircleGeometry(Math.min(pitchX,pitchY)*.28,10);
 const dots=new THREE.InstancedMesh(dotGeometry,dotMaterial,cells.length);dots.name='binary-perforation';dots.userData.collision=false;
 const matrix=new THREE.Matrix4();
 cells.forEach(([row,column],index)=>{
  matrix.makeTranslation(record.centerX-record.width/2+(column+1)*pitchX,record.centerY-record.height/2+(row+1)*pitchY,room.length-record.depth);
  dots.setMatrixAt(index,matrix);
 });
 dots.instanceMatrix.needsUpdate=true;dots.computeBoundingBox();dots.computeBoundingSphere();group.add(dots);
 const proxyGeometry=new THREE.PlaneGeometry(record.width,record.height);
 const proxy=new THREE.Mesh(proxyGeometry,proxyMaterial);proxy.name='binary-acoustic-proxy';proxy.position.set(record.centerX,record.centerY,room.length-record.depth);group.add(proxy);
 group.updateMatrixWorld(true);
 return {group,dispose(){bodyGeometry.dispose();dotGeometry.dispose();proxyGeometry.dispose();side.dispose();white.dispose();dotMaterial.dispose();proxyMaterial.dispose();}};
}
