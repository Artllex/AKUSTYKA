import {createListenerRecord,defaultEarOffsetZ} from './listener-model.js';
// Barefoot MM27 Gen2, SI units. Published cabinet/overall dimensions are exact
// to the manufacturer's millimeter rounding. Undimensioned driver offsets are
// estimated from the orthographic drawing, not measured acoustic centers.
export const MM27 = Object.freeze({
 model:'barefoot-mm27-gen2', name:'Barefoot MicroMain27 2nd Gen',
 cabinet:Object.freeze({width:0.241,height:0.521,depth:0.394}),
 overall:Object.freeze({width:0.267,height:0.521,depth:0.442}),
 source:'https://barefootsound.com/manuals/MicroMain27_Owners_Manual.pdf'
});
// Local origin: bottom center of cabinet. Front faces +Z, Y points upward.
export const DEFAULT_MONITOR_EAR_DISTANCE=0.869;
export const DRIVER_COLORS=Object.freeze({'midbass-top':0x47c8ff,tweeter:0xffdc32,'midbass-bottom':0xbba0ff,'sub-left':0x6be68b,'sub-right':0xf57ddd});
export const MM27_DRIVERS = Object.freeze([
 {id:'midbass-top',label:'Górny midbass · 5,25″',diameter:0.13335,center:[0,0.3812,0.197],normal:[0,0,1]},
 {id:'tweeter',label:'Tweeter · 1″',diameter:0.0254,center:[0,0.2605,0.197],normal:[0,0,1]},
 {id:'midbass-bottom',label:'Dolny midbass · 5,25″',diameter:0.13335,center:[0,0.1398,0.197],normal:[0,0,1]},
 {id:'sub-left',label:'Lewy subwoofer · 10″',diameter:0.254,center:[-0.1335,0.2605,-0.01],normal:[-1,0,0]},
 {id:'sub-right',label:'Prawy subwoofer · 10″',diameter:0.254,center:[0.1335,0.2605,-0.01],normal:[1,0,0]}
].map(d=>Object.freeze({...d,color:DRIVER_COLORS[d.id],center:Object.freeze(d.center),normal:Object.freeze(d.normal)})));
export function normalizeMonitorRecord(record){
 if(record.model!==MM27.model||typeof record.id!=='string'||!record.id||!['L','R'].includes(record.channel)||!record.position||![record.position.x,record.position.y,record.position.z,record.yaw].every(Number.isFinite)||record.position.y<0||Math.max(...Object.values(record.position).map(Math.abs))>100||Math.abs(record.yaw)>Math.PI*2)throw new Error('Nieprawidłowe ustawienie monitora studyjnego.');
 return {...record,type:'studio-monitor',centersVisible:record.centersVisible!==false,position:{x:record.position.x,y:record.position.y,z:record.position.z}};
}
export function createMonitorPair(room,listener=createListenerRecord(room)){
 const earZ=listener.position.z+defaultEarOffsetZ(listener),earHalfWidth=.083*listener.stature/1.68;
 // The tweeters are the front vertices. Each rearward side passes through an ear;
 // its intersection is the third vertex, just behind the head.
 const halfSpacing=Math.min(earHalfWidth+DEFAULT_MONITOR_EAR_DISTANCE/2,room.width*.22),yawAngle=Math.PI/6,tweeterFront=MM27_DRIVERS.find(d=>d.id==='tweeter').center[2];
 const tweeterZ=earZ-Math.sqrt(3)*(halfSpacing-earHalfWidth);
 return ['L','R'].map((channel,i)=>{
  const side=i===0?-1:1,yaw=-side*yawAngle;
  const x=listener.position.x+side*halfSpacing-tweeterFront*Math.sin(yaw);
  const z=tweeterZ-tweeterFront*Math.cos(yaw);
  return normalizeMonitorRecord({id:'monitor-'+channel,type:'studio-monitor',model:MM27.model,channel,position:{x,y:0.9245,z},yaw,centersVisible:true});
 });
}
