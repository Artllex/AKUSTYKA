export function setupMonitorPanel({read,readLinks,change,add,showError}){
 const $=id=>document.getElementById(id);let selected;
 function sync(){const records=read();selected=records.find(r=>r.id===selected)?.id??records[0]?.id;const select=$('monitor-select');select.replaceChildren(...records.map(r=>{const option=document.createElement('option');option.value=r.id;option.textContent=r.channel==='L'?'Lewy · L':'Prawy · R';return option;}));select.value=selected??'';
  $('monitor-fields').hidden=!records.length;$('add-monitors').hidden=!!records.length;
  const record=records.find(r=>r.id===selected);if(!record)return;
  for(const key of ['angle','height','distance']){$('link-'+key).checked=readLinks()[key];$('link-'+key).disabled=records.length<2;}
  for(const axis of ['x','y','z'])$('monitor-'+axis).value=(record.position[axis]*100).toFixed(1);
  $('monitor-yaw').value=(record.yaw*180/Math.PI).toFixed(1);$('monitor-centers').checked=record.centersVisible;
 }
 $('monitor-select').onchange=()=>{selected=$('monitor-select').value;sync();};
 $('monitor-placement').onsubmit=e=>{e.preventDefault();try{const record=read().find(r=>r.id===selected),position={},patch={};for(const axis of ['x','y','z'])if(Number($('monitor-'+axis).value)!==Number((record.position[axis]*100).toFixed(1)))position[axis]=Number($('monitor-'+axis).value)/100;if(Object.keys(position).length)patch.position=position;if(Number($('monitor-yaw').value)!==Number((record.yaw*180/Math.PI).toFixed(1)))patch.yaw=Number($('monitor-yaw').value)*Math.PI/180;change(selected,patch);}catch(error){showError(error);sync();}};
 $('monitor-centers').onchange=()=>change(selected,{centersVisible:$('monitor-centers').checked});
 for(const key of ['angle','height','distance'])$('link-'+key).onchange=()=>{try{const enabled=$('link-'+key).checked;change(selected,{}, {...readLinks(),[key]:enabled},enabled?[key]:[]);}catch(error){showError(error);sync();}};
 $('add-monitors').onclick=()=>add();
 return {sync};
}
