import {defaultRoomFeatures} from './room-features.js';

export const BILLY_BOOKCASE_ID='bookcase-billy-80x28x202';
export const BILLY_BOOKCASE=Object.freeze({width:0.8,depth:0.28,height:2.02,shelves:5});

export function createBillyRecord(room,door=defaultRoomFeatures(room).door){
 const doorRight=door.center+door.width/2;
 const freeWidth=room.width-doorRight;
 const x=freeWidth>=BILLY_BOOKCASE.width+0.04
  ?doorRight+freeWidth/2
  :Math.max(BILLY_BOOKCASE.width/2,room.width-BILLY_BOOKCASE.width/2-0.02);
 return {id:BILLY_BOOKCASE_ID,type:'bookcase',model:'ikea-billy-80x28x202',position:{x,y:0,z:room.length-BILLY_BOOKCASE.depth/2-0.015},yaw:0};
}

export function ensureBillyRecord(document){
 if(!document.objects.some(record=>record.id===BILLY_BOOKCASE_ID))document.objects.push(createBillyRecord(document.room,document.roomFeatures?.door));
 return document;
}

export function moveDefaultBillyWithRoom(document,nextRoom){
 const record=document.objects.find(item=>item.id===BILLY_BOOKCASE_ID);
 if(!record||document.transforms?.[record.id])return;
 const original=createBillyRecord(document.room,document.roomFeatures?.door);
 if(Math.abs(record.position.x-original.position.x)>1e-8||Math.abs(record.position.z-original.position.z)>1e-8||Math.abs(record.yaw)>1e-8)return;
 record.position=createBillyRecord(nextRoom,defaultRoomFeatures(nextRoom).door).position;
}
