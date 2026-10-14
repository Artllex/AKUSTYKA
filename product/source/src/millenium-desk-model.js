import {COMBODESK_88,createDeskRecord} from './desk-model.js';

// Millenium SD-180 B, in metres. The overall depth includes the floor base.
export const MILLENIUM_DESK_ID='desk-millenium-sd-180-b';
export const MILLENIUM_SD_180_B=Object.freeze({
 width:1.8,depth:1.02,height:.93,
 worktop:Object.freeze({width:1.8,depth:.8,thickness:.025,top:.785,frontZ:.4}),
 monitorShelf:Object.freeze({width:.6,depth:.24,thickness:.018,top:.93}),
 keyboardTray:Object.freeze({width:1,depth:.4,thickness:.018,drop:.14}),
 rackUnits:4
});

export function createMilleniumDeskRecord(room){
 const first=createDeskRecord(room);
 const firstFront=first.position.z+COMBODESK_88.depth/2;
 return {id:MILLENIUM_DESK_ID,type:'studio-desk',model:'millenium-sd-180-b-studiodesk',
  position:{x:first.position.x,y:0,z:firstFront-MILLENIUM_SD_180_B.worktop.frontZ},yaw:0};
}

export function moveDefaultMilleniumDeskWithRoom(document,nextRoom){
 const desk=document.objects.find(record=>record.id===MILLENIUM_DESK_ID);
 if(!desk||document.transforms?.[desk.id])return;
 const original=createMilleniumDeskRecord(document.room);
 if(Math.abs(desk.position.x-original.position.x)>1e-8||Math.abs(desk.position.z-original.position.z)>1e-8||Math.abs(desk.yaw-original.yaw)>1e-8)return;
 desk.position=createMilleniumDeskRecord(nextRoom).position;
}
