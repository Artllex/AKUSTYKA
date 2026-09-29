import {LISTENER_LIMITS,maxSeatHeight} from './listener-model.js';
export function constrainedLeanPoint(anchor,point,axis){
 const fixed=axis==='horizontal'?anchor.y:anchor.x;
 const limit=Math.sqrt(Math.max(0,1-fixed*fixed));
 const clamp=v=>Math.max(-limit,Math.min(limit,v));
 return axis==='horizontal'?{x:clamp(point.x),y:anchor.y}:{x:anchor.x,y:clamp(point.y)};
}
export function setupListenerPanel({read,preview,commit,cancel}){
 const $=id=>document.getElementById(id),pad=$('lean-pad');let drag=null,lastEarHeight;
 const fields={stature:['listener-stature',100],seatHeight:['listener-seat',100],headYaw:['head-yaw',1],headPitch:['head-pitch',1],headRoll:['head-roll',1]};
 function sync(earHeight=lastEarHeight){lastEarHeight=earHeight;const record=read();if(!record)return;for(const [key,[id,factor]] of Object.entries(fields)){$(id).value=(record[key]*factor).toFixed(key==='stature'||key==='seatHeight'?1:0);const out=$(id+'-value');if(out)out.textContent=Math.round(record[key])+'°';}const max=maxSeatHeight(record.stature)*100;$('listener-seat').max=(Math.floor(max*10)/10).toFixed(1);const x=110+record.leanSide/20*82,y=110-record.leanForward/(record.leanForward>=0?35:10)*82;$('lean-dot').setAttribute('cx',x);$('lean-dot').setAttribute('cy',y);$('lean-vector').setAttribute('x2',x);$('lean-vector').setAttribute('y2',y);$('lean-values').textContent=`Przód/tył: ${record.leanForward.toFixed(1)}° · Bok: ${record.leanSide.toFixed(1)}°`;$('ear-height').textContent=earHeight===undefined?'':`Wysokość uszu: ${(earHeight*100).toFixed(1).replace('.',',')} cm`;}
 for(const [key,[id,factor]] of Object.entries(fields)){const input=$(id);input.addEventListener('input',()=>{if(input.type==='range')preview({[key]:Number(input.value)/factor});});input.addEventListener('change',()=>{if(input.validity.valid&&input.value!==''){preview({[key]:Number(input.value)/factor});commit();}else sync();});}
 function coordinates(event){const rect=pad.getBoundingClientRect();return {x:((event.clientX-rect.left)/rect.width*220-110)/82,y:(110-(event.clientY-rect.top)/rect.height*220)/82};}
 function recordPoint(){const r=read();return {x:r.leanSide/20,y:r.leanForward/(r.leanForward>=0?35:10)};}
 function point(event){
  const pointer=coordinates(event);let next=pointer;
  if(event.ctrlKey){
   if(!drag.lock)drag.lock={anchor:recordPoint(),pointer:drag.previous??pointer,axis:null};
   const lock=drag.lock,dx=pointer.x-lock.pointer.x,dy=pointer.y-lock.pointer.y;
   if(!lock.axis&&Math.hypot(dx,dy)>0.02)lock.axis=Math.abs(dx)>=Math.abs(dy)?'horizontal':'vertical';
   next=lock.axis?constrainedLeanPoint(lock.anchor,{x:lock.anchor.x+dx,y:lock.anchor.y+dy},lock.axis):lock.anchor;
  }else drag.lock=null;
  drag.previous=pointer;
  const nx=Math.max(-1,Math.min(1,next.x)),ny=Math.max(-1,Math.min(1,next.y));
  preview({leanSide:nx*20,leanForward:ny*(ny>=0?35:10)});
 }
 pad.addEventListener('pointerdown',e=>{if(e.button!==0||drag)return;drag={id:e.pointerId,start:structuredClone(read()),previous:coordinates(e)};pad.setPointerCapture(e.pointerId);pad.focus();point(e);});
 pad.addEventListener('pointermove',e=>{if(drag?.id===e.pointerId)point(e);});
 pad.addEventListener('pointerup',e=>{if(drag?.id!==e.pointerId)return;point(e);drag=null;if(pad.hasPointerCapture(e.pointerId))pad.releasePointerCapture(e.pointerId);commit();});
 function abort(){if(!drag)return;const {start,id}=drag;drag=null;if(pad.hasPointerCapture(id))pad.releasePointerCapture(id);cancel(start);}
 pad.addEventListener('pointercancel',abort);pad.addEventListener('lostpointercapture',abort);
 pad.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();abort();return;}const step=e.shiftKey?5:1,r=read();let patch;if(e.key==='ArrowUp')patch={leanForward:Math.min(35,r.leanForward+step)};if(e.key==='ArrowDown')patch={leanForward:Math.max(-10,r.leanForward-step)};if(e.key==='ArrowLeft')patch={leanSide:Math.max(-20,r.leanSide-step)};if(e.key==='ArrowRight')patch={leanSide:Math.min(20,r.leanSide+step)};if(e.key==='Home')patch={leanForward:0,leanSide:0};if(patch){e.preventDefault();preview(patch);commit();}});
 $('pose-neutral').onclick=()=>{preview({leanForward:0,leanSide:0,headYaw:0,headPitch:0,headRoll:0});commit();};
 return {sync,abort};
}


