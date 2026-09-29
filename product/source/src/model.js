import {defaultRoomFeatures} from './room-features.js';
import {createListenerRecord} from './listener-model.js';
import {createMonitorPair} from './monitor-model.js';
import {defaultReflectionSettings} from './reflection-model.js';
import {DEFAULT_MONITOR_LINKS} from './monitor-links.js';
export const DEFAULT_ROOM = Object.freeze({width:2.477,length:3.715,height:2.605});
export function roomFromCentimeters(width,length,height){
 const values=[width,length,height].map(Number);
 if(values.some(v=>!Number.isFinite(v)||v<50||v>2000)) throw new RangeError('Wymiary muszą wynosić od 50 do 2000 cm.');
 return {width:values[0]/100,length:values[1]/100,height:values[2]/100};
}
export function roomMetrics({width,length,height}){return {area:width*length,volume:width*length*height};}
// Persistent document boundary for future objects and simulation adapters.
export function createDocument(room={...DEFAULT_ROOM}){return {schemaVersion:1,units:'m',room,roomShape:null,roomMesh:null,roomFeatures:defaultRoomFeatures(room),transforms:{},showTweeterRays:true,reflections:defaultReflectionSettings(),monitorLinks:{...DEFAULT_MONITOR_LINKS},objects:[createListenerRecord(room),...createMonitorPair(room)]};}

