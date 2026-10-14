import {COMBODESK_88,createDeskRecord} from './desk-model.js';

// Dimensions from the supplied Modul drawing, in metres. +Z faces the listener.
export const MODUL_1520_DESK=Object.freeze({
 width:1.52,depth:.79,height:.96,worktopHeight:.74,
 worktop:Object.freeze({width:1.36,depth:.55,thickness:.018,frontZ:.275}),
 upperShelf:Object.freeze({width:1.52,depth:.24,thickness:.018,clearance:.185}),
 tray:Object.freeze({width:1.31,depth:.24,thickness:.018,drop:.08}),
 rack:Object.freeze({leftWidth:.49,centerWidth:.257,rightWidth:.49}),
 sideThickness:.018
});
export const MODUL_1520_DESK_ID='desk-modul-1520';

export function createModul1520DeskRecord(room){
 const first=createDeskRecord(room);
 const firstFront=first.position.z+(COMBODESK_88.depth-COMBODESK_88.worktop.depth)/2+COMBODESK_88.worktop.depth/2;
 return {id:MODUL_1520_DESK_ID,type:'studio-desk',model:'modul-studio-desk-1520',
  position:{x:first.position.x,y:0,z:firstFront-MODUL_1520_DESK.worktop.frontZ},yaw:0};
}

export function moveDefaultModul1520DeskWithRoom(document,nextRoom){
 const desk=document.objects.find(record=>record.id===MODUL_1520_DESK_ID);
 if(!desk||document.transforms?.[desk.id])return;
 const original=createModul1520DeskRecord(document.room);
 if(Math.abs(desk.position.x-original.position.x)>1e-8||Math.abs(desk.position.z-original.position.z)>1e-8||Math.abs(desk.yaw-original.yaw)>1e-8)return;
 desk.position=createModul1520DeskRecord(nextRoom).position;
}
