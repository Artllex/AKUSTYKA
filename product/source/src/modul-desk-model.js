import {COMBODESK_88,createDeskRecord} from './desk-model.js';

// Overall envelope follows the supplied 2025 dimension drawing (metres).
export const MODUL_STUDIO_DESK = Object.freeze({
 width:1.44,depth:.70,height:.76,
 top:Object.freeze({width:1.435,depth:.60,thickness:.018,frontZ:.25}),
 tray:Object.freeze({width:1.37,depth:.34,thickness:.018,drop:.10}),
 sideThickness:.018
});
export const MODUL_DESK_ID='desk-modul-2025';

export function createModulDeskRecord(room){
 const desk=MODUL_STUDIO_DESK;
 // Match the forward edge of the Thomann worktop facing the listener.
 const first=createDeskRecord(room);
 const firstFront=first.position.z+(COMBODESK_88.depth-COMBODESK_88.worktop.depth)/2+COMBODESK_88.worktop.depth/2;
 return {id:MODUL_DESK_ID,type:'studio-desk',model:'modul-studio-desk-2025',
  position:{x:first.position.x,y:0,z:firstFront-desk.top.frontZ},yaw:0};
}
export function ensureModulDeskRecord(document){
 document.objects=document.objects.filter(record=>record.type!=='studio-desk'||record.id===MODUL_DESK_ID);
 if(!document.objects.some(record=>record.id===MODUL_DESK_ID))document.objects.push(createModulDeskRecord(document.room));
 return document;
}
export function moveDefaultModulDeskWithRoom(document,nextRoom){
 const desk=document.objects.find(record=>record.id===MODUL_DESK_ID);
 if(!desk||document.transforms?.[desk.id])return;
 const original=createModulDeskRecord(document.room);
 if(Math.abs(desk.position.x-original.position.x)>1e-8||Math.abs(desk.position.z-original.position.z)>1e-8||Math.abs(desk.yaw-original.yaw)>1e-8)return;
 desk.position=createModulDeskRecord(nextRoom).position;
}
