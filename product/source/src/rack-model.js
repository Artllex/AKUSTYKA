// RIVECO JAZZ 15U: external dimensions from the supplied dimension drawing.
// The narrow steel profiles and foot shapes follow the supplied product photo.
export const RACK_15U=Object.freeze({width:0.50,depth:0.30,height:0.73,leanDegrees:5,mountingHeight:15*0.04445});

export function createRackRecord(room){
 return {id:'rack-15u',type:'studio-rack',model:'riveco-open-15u',position:{x:room.width-0.03-RACK_15U.width/2,y:0,z:room.length-0.03-RACK_15U.depth/2},yaw:0};
}

export function ensureRackRecord(document){
 if(!document.objects.some(record=>record.id==='rack-15u'))document.objects.push(createRackRecord(document.room));
 return document;
}

export function moveDefaultRackWithRoom(document,nextRoom){
 const rack=document.objects.find(record=>record.id==='rack-15u');
 if(!rack||document.transforms?.[rack.id])return;
 const original=createRackRecord(document.room);
 if(Math.abs(rack.position.x-original.position.x)>1e-8||Math.abs(rack.position.z-original.position.z)>1e-8)return;
 rack.position=createRackRecord(nextRoom).position;
}
