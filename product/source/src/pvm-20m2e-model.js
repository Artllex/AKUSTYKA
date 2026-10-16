import {defaultRoomFeatures} from './room-features.js';

export const PVM_20M2E_ID='television-sony-pvm-20m2e';
export const PVM_20M2E=Object.freeze({width:.450,height:.458,depth:.503,wallBracket:.018,switchGap:.010});

export function createPvm20m2eRecord(room,features=defaultRoomFeatures(room)){
 const {switch:lightSwitch}=features;
 return {id:PVM_20M2E_ID,type:'crt-television',model:'sony-pvm-20m2e',position:{
  x:lightSwitch.center,
  y:lightSwitch.bottom-PVM_20M2E.switchGap-PVM_20M2E.height,
  z:room.length-PVM_20M2E.wallBracket-PVM_20M2E.depth/2
 },yaw:0};
}

export function ensurePvm20m2eRecord(document){
 if(!document.objects.some(item=>item.id===PVM_20M2E_ID))document.objects.push(createPvm20m2eRecord(document.room,document.roomFeatures));
 return document;
}

function matchesDefault(record,document){
 if(!record||document.transforms?.[record.id])return false;
 const expected=createPvm20m2eRecord(document.room,document.roomFeatures),close=(a,b)=>Math.abs(a-b)<1e-8;
 return record.yaw===expected.yaw&&['x','y','z'].every(axis=>close(record.position[axis],expected.position[axis]));
}

export function moveDefaultPvm20m2eWithRoom(document,room){
 const record=document.objects.find(item=>item.id===PVM_20M2E_ID);
 if(matchesDefault(record,document))record.position=createPvm20m2eRecord(room,document.roomFeatures).position;
}

export function moveDefaultPvm20m2eWithFeatures(document,features){
 const record=document.objects.find(item=>item.id===PVM_20M2E_ID);
 if(matchesDefault(record,document))record.position=createPvm20m2eRecord(document.room,features).position;
}

export function pvm20m2eClearances(record,room,features){
 const left=record.position.x-PVM_20M2E.width/2,right=record.position.x+PVM_20M2E.width/2;
 const bottom=record.position.y,top=bottom+PVM_20M2E.height;
 const doorRight=features.door.center+features.door.width/2;
 return {left,right,bottom,top,doorGap:left-doorRight,switchGap:features.switch.bottom-top,wallGap:room.length-(record.position.z+PVM_20M2E.depth/2)};
}
