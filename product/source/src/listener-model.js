export const DEFAULT_LISTENER_SETTINGS=Object.freeze({stature:1.68,seatHeight:0.435,leanForward:10,leanSide:0,headYaw:0,headPitch:0,headRoll:0});
export const LISTENER_LIMITS=Object.freeze({stature:[1.4,2],seatHeight:[0.32,0.60],leanForward:[-10,35],leanSide:[-20,20],headYaw:[-80,80],headPitch:[-25,40],headRoll:[-25,25]});
export function maxSeatHeight(stature){const s=stature/1.68;return Math.floor(Math.min(0.60,s*(0.01+Math.sqrt((0.773*0.97)**2-0.4**2)))*1000)/1000;}
export function constrainLean(forward,side){const radius=Math.hypot(side/20,forward/(forward>=0?35:10));return radius>1?{leanForward:forward/radius,leanSide:side/radius}:{leanForward:forward,leanSide:side};}
export function normalizeListenerRecord(record){
 const normalized={...record};for(const [key,value] of Object.entries(DEFAULT_LISTENER_SETTINGS)){const actual=record[key]??value;const [min,max]=LISTENER_LIMITS[key];if(!Number.isFinite(actual)||actual<min-1e-8||actual>max+1e-8)throw new Error('Nieprawidłowy parametr manekina: '+key);normalized[key]=actual;}
 if(normalized.seatHeight>maxSeatHeight(normalized.stature)+1e-8)throw new Error('Krzesło jest zbyt wysokie dla tego wzrostu i podparcia stóp.');
 const lean=constrainLean(normalized.leanForward,normalized.leanSide);if(Math.abs(lean.leanForward-normalized.leanForward)>1e-6||Math.abs(lean.leanSide-normalized.leanSide)>1e-6)throw new Error('Wychylenie przekracza zakres modelu.');
 if(!record.position||![record.position.x,record.position.y,record.position.z,record.yaw].every(Number.isFinite)||record.position.y!==0)throw new Error('Nieprawidłowa pozycja manekina.');return normalized;
}
export function patchListener(record,patch){const next={...record,...patch};next.seatHeight=Math.min(next.seatHeight,maxSeatHeight(next.stature));Object.assign(next,constrainLean(next.leanForward,next.leanSide));return normalizeListenerRecord(next);}
// Two-segment leg solution in the sagittal plane, knee stays in front.
export function solveKnee(hip,ankle,thighLength,shinLength){const dz=ankle[2]-hip[2],dy=ankle[1]-hip[1],distance=Math.hypot(dz,dy);if(distance>thighLength+shinLength+1e-9||distance<Math.abs(thighLength-shinLength))throw new Error('Nieosiągalna pozycja nóg.');const along=(thighLength**2-shinLength**2+distance**2)/(2*distance),offset=Math.sqrt(Math.max(0,thighLength**2-along**2));return [hip[0],hip[1]+dy/distance*along-dz/distance*offset,hip[2]+dz/distance*along+dy/distance*offset];}
export function defaultEarOffsetZ(record=DEFAULT_LISTENER_SETTINGS){const scale=record.stature/1.68;return (-0.025-0.56*Math.sin(record.leanForward*Math.PI/180))*scale;}
export function createListenerRecord(room){return {id:'listener-1',type:'seated-listener',...DEFAULT_LISTENER_SETTINGS,position:{x:room.width/2,y:0,z:room.length*0.34-defaultEarOffsetZ()},yaw:0};}

