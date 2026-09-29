export function bindRepeatButton(button,action,{delay=350,interval=90,schedule=setTimeout,unschedule=clearTimeout,windowTarget=window,documentTarget=document}={}){
 let pointer=null,timer=null;
 function stop(){if(timer!==null)unschedule(timer);timer=null;const id=pointer;pointer=null;if(id!==null&&button.hasPointerCapture?.(id))button.releasePointerCapture(id);}
 function repeat(){if(pointer===null||button.disabled){stop();return;}action();timer=schedule(repeat,interval);}
 button.addEventListener('pointerdown',event=>{if(event.button!==0||button.disabled||pointer!==null)return;event.preventDefault();button.focus();pointer=event.pointerId;button.setPointerCapture?.(pointer);action();timer=schedule(repeat,delay);});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>{if(event.pointerId===pointer)stop();});
 button.addEventListener('click',event=>{if(event.detail===0&&!button.disabled)action();});
 windowTarget.addEventListener('blur',stop);documentTarget.addEventListener('visibilitychange',()=>{if(documentTarget.hidden)stop();});return {stop};
}
