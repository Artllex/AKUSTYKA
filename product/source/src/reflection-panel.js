import {MM27_DRIVERS} from './monitor-model.js';
export function setupReflectionPanel({read,change}){
 const $=id=>document.getElementById(id),list=$('reflection-list');
 for(const driver of MM27_DRIVERS){const row=document.createElement('div');row.className='reflection-row';const name=document.createElement('span');name.className='reflection-name';name.textContent=driver.label;name.style.setProperty('--driver-color','#'+driver.color.toString(16).padStart(6,'0'));row.append(name);
  for(const channel of ['L','R']){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.id='reflect-'+channel+'-'+driver.id;input.dataset.key=channel+':'+driver.id;input.setAttribute('aria-label',driver.label+' · '+channel);label.append(input,document.createTextNode(channel));row.append(label);input.onchange=()=>change({...read(),selected:[...list.querySelectorAll('input:checked')].map(o=>o.dataset.key)});}
  list.append(row);
 }
 function sync(count){const settings=read();$('reflections-visible').checked=settings.visible;$('reflection-paths').checked=settings.paths;$('reflection-ears').value=settings.ears;for(const input of list.querySelectorAll('input'))input.checked=settings.selected.includes(input.dataset.key);if(count!==undefined)$('reflection-count').textContent='Punkty odbić: '+count;}
 $('reflections-visible').onchange=()=>change({...read(),visible:$('reflections-visible').checked});$('reflection-paths').onchange=()=>change({...read(),paths:$('reflection-paths').checked});$('reflection-ears').onchange=()=>change({...read(),ears:$('reflection-ears').value});
 $('reflection-all').onclick=()=>change({...read(),selected:[...list.querySelectorAll('input')].map(o=>o.dataset.key)});$('reflection-tweeter').onclick=()=>change({...read(),selected:['L:tweeter','R:tweeter']});$('reflection-none').onclick=()=>change({...read(),selected:[]});
 return {sync};
}
