export const COMBODESK_88 = Object.freeze({
 width:1.625,depth:0.716,height:0.876,
 worktop:Object.freeze({width:1.625,depth:0.675,thickness:0.018,top:0.773}),
 upperShelf:Object.freeze({width:1.625,depth:0.268,thickness:0.018,top:0.876}),
 keyboardTray:Object.freeze({width:1.560,depth:0.300,thickness:0.018}),
 rackBays:3,rackUnits:2
});

export function createDeskRecord(room){
 return {id:'desk-combodesk-88',type:'studio-desk',model:'thomann-combodesk-88-r-base-black',
  position:{x:room.width/2,y:0,z:COMBODESK_88.depth/2+0.16+0.27},yaw:0};
}
export function ensureDeskRecord(document){
 if(!document.objects.some(record=>record.id==='desk-combodesk-88'))document.objects.push(createDeskRecord(document.room));
 return document;
}
export function moveDefaultDeskWithRoom(document,nextRoom){
 const desk=document.objects.find(record=>record.id==='desk-combodesk-88');
 if(!desk||document.transforms?.[desk.id])return;
 const original=createDeskRecord(document.room);
 if(Math.abs(desk.position.x-original.position.x)>1e-8||Math.abs(desk.position.z-original.position.z)>1e-8)return;
 desk.position=createDeskRecord(nextRoom).position;
}
