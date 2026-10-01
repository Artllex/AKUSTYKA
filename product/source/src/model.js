import {defaultRoomFeatures} from './room-features.js';
import {createListenerRecord} from './listener-model.js';
import {createMonitorPair} from './monitor-model.js';
import {defaultReflectionSettings} from './reflection-model.js';
import {DEFAULT_MONITOR_LINKS} from './monitor-links.js';
import {createRackRecord} from './rack-model.js';
import {createDeskRecord} from './desk-model.js';
export const DEFAULT_ROOM = Object.freeze({width:2.477,length:3.715,height:2.605});
export function roomFromCentimeters(width,length,height){
 const values=[width,length,height].map(Number);
 if(values.some(v=>!Number.isFinite(v)||v<50||v>2000)) throw new RangeError('Wymiary muszą wynosić od 50 do 2000 cm.');
 return {width:values[0]/100,length:values[1]/100,height:values[2]/100};
}
export function roomMetrics({width,length,height}){return {area:width*length,volume:width*length*height};}
// Persistent document boundary for future objects and simulation adapters.
export function createDocument(room={...DEFAULT_ROOM}){const listener=createListenerRecord(room);return {schemaVersion:1,units:'m',room,roomShape:null,roomMesh:null,roomFeatures:defaultRoomFeatures(room),transforms:{},showTweeterRays:true,reflections:defaultReflectionSettings(),monitorLinks:{...DEFAULT_MONITOR_LINKS},objects:[listener,...createMonitorPair(room,listener),createRackRecord(room),createDeskRecord(room)]};}
export function usesDefaultListeningLayout(document){
 const expected=createDocument(document.room).objects.filter(o=>o.type!=='studio-desk'),close=(a,b)=>Math.abs(a-b)<1e-8;
 return expected.every(reference=>{const actual=document.objects.find(o=>o.id===reference.id);if(!actual||document.transforms?.[reference.id])return false;return ['x','y','z'].every(k=>close(actual.position[k],reference.position[k]))&&close(actual.yaw,reference.yaw)&&(reference.type!=='seated-listener'||['stature','seatHeight','leanForward','leanSide','headYaw','headPitch','headRoll'].every(k=>close(actual[k],reference[k])));});
}
export function placeDefaultListeningLayout(document){const defaults=createDocument(document.room).objects;document.objects=document.objects.map(record=>{if(record.type==='studio-desk')return record;const next=defaults.find(o=>o.id===record.id);return next?{...record,position:next.position,yaw:next.yaw}:record;});}
