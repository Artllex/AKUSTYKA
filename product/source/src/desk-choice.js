import {COMBODESK_88,createDeskRecord} from './desk-model.js';
import {MODUL_DESK_ID,MODUL_STUDIO_DESK,createModulDeskRecord} from './modul-desk-model.js';

export const THOMANN_DESK_ID='desk-combodesk-88';
export function selectedDeskId(document){return document.objects.find(o=>o.type==='studio-desk')?.id??null;}
export function chooseDesk(document,id){
 if(id!==THOMANN_DESK_ID&&id!==MODUL_DESK_ID)throw new Error('Nieznany model biurka.');
 const current=document.objects.find(o=>o.type==='studio-desk');
 if(current?.id===id&&document.objects.filter(o=>o.type==='studio-desk').length===1)return document;
 const record=id===THOMANN_DESK_ID?createDeskRecord(document.room):createModulDeskRecord(document.room);
 const index=document.objects.findIndex(o=>o.type==='studio-desk');
 document.objects=document.objects.filter(o=>o.type!=='studio-desk');
 document.objects.splice(index<0?document.objects.length:index,0,record);
 const transform=current&&document.transforms?.[current.id];
 if(document.transforms){delete document.transforms[THOMANN_DESK_ID];delete document.transforms[MODUL_DESK_ID];if(transform)document.transforms[id]=structuredClone(transform);}
 return document;
}
// v0.95 saved both desks; keep A on load. A saved B-only desk moves from the rear
// to the A-aligned position if it was still at its old default.
export function migrateDeskChoice(document){
 const desks=document.objects.filter(o=>o.type==='studio-desk');
 if(desks.length>1){const keep=desks.find(o=>o.id===THOMANN_DESK_ID)??desks[0];document.objects=document.objects.filter(o=>o.type!=='studio-desk'||o===keep);if(document.transforms)for(const desk of desks)if(desk!==keep)delete document.transforms[desk.id];}
 const desk=document.objects.find(o=>o.id===MODUL_DESK_ID);
 if(desk&&desk.yaw===Math.PI){const {width,length}=document.room;const oldX=width-.04-.72,oldZ=length-.365-.35;if(Math.abs(desk.position.x-oldX)<1e-8&&Math.abs(desk.position.z-oldZ)<1e-8)Object.assign(desk,createModulDeskRecord(document.room));}
 else if(desk&&!document.transforms?.[MODUL_DESK_ID]&&desk.yaw===0){const first=createDeskRecord(document.room),oldZ=first.position.z+COMBODESK_88.depth/2-MODUL_STUDIO_DESK.depth/2;if(Math.abs(desk.position.x-first.position.x)<1e-8&&Math.abs(desk.position.z-oldZ)<1e-8)desk.position=createModulDeskRecord(document.room).position;}
 return document;
}
