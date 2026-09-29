import {normalizeMonitorRecord} from './monitor-model.js';
export const DEFAULT_MONITOR_LINKS=Object.freeze({angle:true,height:true,distance:true});
export function normalizeMonitorLinks(links,objects,room){
 if(links!==undefined){if(!links||['angle','height','distance'].some(key=>typeof links[key]!=='boolean'))throw new Error('Nieprawidłowe spięcie monitorów.');return {...links};}
 // Preserve asymmetric placements in older files, linking only matching values.
 const left=objects.find(o=>o.type==='studio-monitor'&&o.channel==='L'),right=objects.find(o=>o.type==='studio-monitor'&&o.channel==='R');
 if(!left||!right)return {...DEFAULT_MONITOR_LINKS};
 const close=(a,b)=>Math.abs(a-b)<1e-6;
 return {angle:close(left.yaw,-right.yaw),height:close(left.position.y,right.position.y),distance:close(left.position.x+right.position.x,room.width)&&close(left.position.z,right.position.z)};
}
// One atomic document edit. X mirrors about room center; Z matches. Height
// matches Y, while toe-in yaw uses opposite signs for the two speakers.
export function updateLinkedMonitor(document,id,patch={},links=document.monitorLinks,force=[]){
 const source=document.objects.find(o=>o.id===id&&o.type==='studio-monitor');if(!source)return document;
 const settings=normalizeMonitorLinks(links,document.objects,document.room),next=normalizeMonitorRecord({...source,...patch,position:{...source.position,...patch.position}});
 const peer=document.objects.find(o=>o.type==='studio-monitor'&&o.model===source.model&&o.channel!==source.channel);
 let other=peer?{...peer,position:{...peer.position}}:null;
 if(other){
  if(settings.angle&&(next.yaw!==source.yaw||force.includes('angle')))other.yaw=-next.yaw;
  if(settings.height&&(next.position.y!==source.position.y||force.includes('height')))other.position.y=next.position.y;
  if(settings.distance){if(next.position.x!==source.position.x||force.includes('distance'))other.position.x=document.room.width-next.position.x;if(next.position.z!==source.position.z||force.includes('distance'))other.position.z=next.position.z;}
  other=normalizeMonitorRecord(other);
 }
 return {...document,monitorLinks:settings,objects:document.objects.map(o=>o.id===source.id?next:other&&o.id===other.id?other:o)};
}
