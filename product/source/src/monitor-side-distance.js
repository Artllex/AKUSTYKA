import * as THREE from 'three';
import {createSeatedListener} from './listener-view.js';
import {createStudioMonitor} from './monitor-view.js';
import {applyObjectTransform} from './object-transform.js';

function sideGeometry(document,monitor){
 const listenerRecord=document.objects.find(o=>o.type==='seated-listener');
 if(!listenerRecord)throw new Error('Brak manekina dla pomiaru odległości.');
 const listener=createSeatedListener(listenerRecord),speaker=createStudioMonitor(monitor);
 try{
  applyObjectTransform(listener.group,document.transforms);applyObjectTransform(speaker.group,document.transforms);
  const ear=listener.group.getObjectByName(monitor.channel==='L'?'ear-left':'ear-right').getWorldPosition(new THREE.Vector3());
  const tweeter=speaker.getDriverCenters().find(driver=>driver.id==='tweeter');
  const fromEar=tweeter.position.clone().sub(ear);fromEar.y=0;
  const distance=fromEar.length();
  const direction=distance>1e-9?fromEar.divideScalar(distance):tweeter.normal.clone().setY(0).negate().normalize();
  return {distance,direction};
 }finally{listener.dispose();speaker.dispose();}
}

export function monitorSideDistance(document,id){const monitor=document.objects.find(o=>o.id===id&&o.type==='studio-monitor');return monitor?sideGeometry(document,monitor).distance:null;}

export function moveMonitorAlongSide(document,id,targetDistance){
 if(!Number.isFinite(targetDistance)||targetDistance<0||targetDistance>20)throw new Error('Odległość monitora musi wynosić od 0 do 2000 cm.');
 const source=document.objects.find(o=>o.id===id&&o.type==='studio-monitor');if(!source)throw new Error('Nie znaleziono monitora.');
 const selected=document.monitorLinks?.distance?document.objects.filter(o=>o.type==='studio-monitor'&&['L','R'].includes(o.channel)): [source];
 const positions=new Map(selected.map(monitor=>{const {distance,direction}=sideGeometry(document,monitor),delta=(targetDistance-distance);return [monitor.id,{...monitor.position,x:monitor.position.x+direction.x*delta,z:monitor.position.z+direction.z*delta}];}));
 return {...document,objects:document.objects.map(record=>positions.has(record.id)?{...record,position:positions.get(record.id)}:record)};
}
