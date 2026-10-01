// Overall envelope follows the supplied 2025 dimension drawing (metres).
export const MODUL_STUDIO_DESK = Object.freeze({
 width:1.44,depth:.70,height:.76,
 top:Object.freeze({width:1.435,depth:.60,thickness:.018}),
 tray:Object.freeze({width:1.37,depth:.34,thickness:.018,drop:.10}),
 sideThickness:.018
});
export const MODUL_DESK_ID='desk-modul-2025';

export function createModulDeskRecord(room){
 const desk=MODUL_STUDIO_DESK;
 // The rear wall has a door on the left and the RIVECO rack in the right corner.
 // Keep the desk to the right of the door, ahead of the rack, facing the listener.
 return {id:MODUL_DESK_ID,type:'studio-desk',model:'modul-studio-desk-2025',
  position:{x:room.width-.04-desk.width/2,y:0,z:room.length-.365-desk.depth/2},yaw:Math.PI};
}
export function ensureModulDeskRecord(document){
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
