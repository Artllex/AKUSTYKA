export function setupMonitorPanel({read,readLinks,readSideDistance,change,changeSideDistance,add,showError}){
 const $=id=>document.getElementById(id);let selected,editingInput=null;
 const setField=(id,value)=>{const input=$(id);if(editingInput!==input)input.value=value;};
 function sync(){const records=read();selected=records.find(r=>r.id===selected)?.id??records[0]?.id;const select=$('monitor-select');select.replaceChildren(...records.map(r=>{const option=document.createElement('option');option.value=r.id;option.textContent=r.channel==='L'?'Lewy · L':'Prawy · R';return option;}));select.value=selected??'';
  $('monitor-fields').hidden=!records.length;$('add-monitors').hidden=!!records.length;
  const record=records.find(r=>r.id===selected);if(!record)return;
  for(const key of ['angle','height','distance']){$('link-'+key).checked=readLinks()[key];$('link-'+key).disabled=records.length<2;}
  for(const axis of ['x','y','z'])setField('monitor-'+axis,(record.position[axis]*100).toFixed(1));
  setField('monitor-yaw',(record.yaw*180/Math.PI).toFixed(1));setField('monitor-ear-distance',(readSideDistance(record.id)*100).toFixed(1));$('monitor-centers').checked=record.centersVisible;
 }
 $('monitor-select').onchange=()=>{selected=$('monitor-select').value;sync();};
 for(const form of ['monitor-placement','monitor-side-distance'])$(form).onsubmit=e=>e.preventDefault();
 for(const key of ['x','y','z','yaw'])$('monitor-'+key).addEventListener('input',event=>{
  const input=event.target;if(input.value===''||!input.validity.valid)return;
  try{
   const record=read().find(r=>r.id===selected);if(!record)return;
   const value=Number(input.value),current=key==='yaw'?record.yaw*180/Math.PI:record.position[key]*100;
   if(value===Number(current.toFixed(1)))return;
   editingInput=input;change(selected,key==='yaw'?{yaw:value*Math.PI/180}:{position:{[key]:value/100}});
  }catch(error){editingInput=null;showError(error);sync();}finally{editingInput=null;}
 });
 $('monitor-ear-distance').addEventListener('input',event=>{
  const input=event.target;if(input.value===''||!input.validity.valid)return;
  try{
   const value=Number(input.value);
   if(value!==Number((readSideDistance(selected)*100).toFixed(1))){editingInput=input;changeSideDistance(selected,value/100);}
  }catch(error){editingInput=null;showError(error);sync();}finally{editingInput=null;}
 });
 $('monitor-centers').onchange=()=>change(selected,{centersVisible:$('monitor-centers').checked});
 for(const key of ['angle','height','distance'])$('link-'+key).onchange=()=>{try{const enabled=$('link-'+key).checked;change(selected,{}, {...readLinks(),[key]:enabled},enabled?[key]:[]);}catch(error){showError(error);sync();}};
 $('add-monitors').onclick=()=>add();
 return {sync};
}
