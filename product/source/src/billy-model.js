import {defaultRoomFeatures} from './room-features.js';

export const BILLY_BOOKCASE_ID='bookcase-billy-60x28x202';
export const BILLY_BOOKCASE=Object.freeze({width:0.6,depth:0.28,height:2.02,shelves:5});
const LEGACY_BILLY_BOOKCASE_ID='bookcase-billy-80x28x202';
const WALL_GAP=0.02;
const BILLY_YAW=Math.PI/4;

function previousBillyPosition(room,door){
 const doorRight=door.center+door.width/2;
 const freeWidth=room.width-doorRight;
 const x=freeWidth>=BILLY_BOOKCASE.width+0.04
  ?doorRight+freeWidth/2
  :Math.max(BILLY_BOOKCASE.width/2,room.width-BILLY_BOOKCASE.width/2-0.02);
 return {x,y:0,z:room.length-BILLY_BOOKCASE.depth/2-0.015};
}

export function createBillyRecord(room,door=defaultRoomFeatures(room).door){
 const cornerOffset=(BILLY_BOOKCASE.width+BILLY_BOOKCASE.depth)/(2*Math.SQRT2)+WALL_GAP;
 return {id:BILLY_BOOKCASE_ID,type:'bookcase',model:'ikea-billy-60x28x202',position:{x:room.width-cornerOffset,y:0,z:room.length-cornerOffset},yaw:BILLY_YAW};
}

export function migrateBillyOrientation(document){
 const record=document.objects.find(item=>item.id===BILLY_BOOKCASE_ID);
 if(!record||document.transforms?.[record.id])return document;
 const previous=previousBillyPosition(document.room,document.roomFeatures?.door??defaultRoomFeatures(document.room).door);
 if(Math.abs(record.position.x-previous.x)<1e-8&&Math.abs(record.position.z-previous.z)<1e-8&&Math.abs(record.yaw)<1e-8){
  const updated=createBillyRecord(document.room);
  record.position=updated.position;
  record.yaw=updated.yaw;
 }
 return document;
}

export function migrateBilly60(document){
 const legacy=document.objects.find(record=>record.id===LEGACY_BILLY_BOOKCASE_ID&&record.type==='bookcase');
 if(!legacy)return document;
 if(document.objects.some(record=>record.id===BILLY_BOOKCASE_ID)){
  document.objects=document.objects.filter(record=>record!==legacy);
  if(document.transforms)delete document.transforms[LEGACY_BILLY_BOOKCASE_ID];
  return document;
 }
 legacy.id=BILLY_BOOKCASE_ID;
 legacy.model='ikea-billy-60x28x202';
 if(document.transforms?.[LEGACY_BILLY_BOOKCASE_ID]){
  document.transforms[BILLY_BOOKCASE_ID]=document.transforms[LEGACY_BILLY_BOOKCASE_ID];
  delete document.transforms[LEGACY_BILLY_BOOKCASE_ID];
 }
 return document;
}

export function ensureBillyRecord(document){
 if(!document.objects.some(record=>record.id===BILLY_BOOKCASE_ID))document.objects.push(createBillyRecord(document.room,document.roomFeatures?.door));
 return document;
}

export function moveDefaultBillyWithRoom(document,nextRoom){
 const record=document.objects.find(item=>item.id===BILLY_BOOKCASE_ID);
 if(!record||document.transforms?.[record.id])return;
 const original=createBillyRecord(document.room,document.roomFeatures?.door);
 if(Math.abs(record.position.x-original.position.x)>1e-8||Math.abs(record.position.z-original.position.z)>1e-8||Math.abs(record.yaw-original.yaw)>1e-8)return;
 const updated=createBillyRecord(nextRoom,defaultRoomFeatures(nextRoom).door);
 record.position=updated.position;
 record.yaw=updated.yaw;
}
