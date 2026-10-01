import {normalizeRoomMesh} from './mesh-model.js';
import {normalizeFootprint} from './surface-model.js';
import {normalizeTransforms} from './object-transform.js';
import {normalizeRoomFeatures} from './room-features.js';
import {normalizeListenerRecord,createListenerRecord,DEFAULT_LISTENER_SETTINGS} from './listener-model.js';
import {normalizeMonitorRecord,createMonitorPair,MM27} from './monitor-model.js';
import {normalizeMonitorLinks} from './monitor-links.js';
import {normalizeReflectionSettings} from './reflection-model.js';
import {DEFAULT_ROOM,roomFromCentimeters} from './model.js';
import {COMBODESK_88,createDeskRecord} from './desk-model.js';
import {ensureModulDeskRecord} from './modul-desk-model.js';
function migrateLegacyListeningLayout(data,room){
 const listener=data.objects.find(o=>o.type==='seated-listener'),pair=['L','R'].map(channel=>data.objects.find(o=>o.type==='studio-monitor'&&o.channel===channel));
 const close=(a,b)=>Math.abs(a-b)<1e-8;
 if(!listener||pair.some(o=>!o)||['listener-1','monitor-L','monitor-R'].some(id=>data.transforms?.[id])||!Object.entries(DEFAULT_LISTENER_SETTINGS).every(([key,value])=>close(listener[key],value)))return;
 if(!close(listener.position.x,room.width/2)||!close(listener.position.z,room.length*.45)||!close(listener.yaw,0))return;
 const spacing=Math.min(1.2,room.width*.48),z=Math.min(.65,room.length*.22);
 if(!pair.every((monitor,i)=>{const x=room.width/2+(i===0?-1:1)*spacing/2;return monitor.model===MM27.model&&close(monitor.position.x,x)&&close(monitor.position.y,.9245)&&close(monitor.position.z,z)&&close(monitor.yaw,Math.atan2(room.width/2-x,room.length*.45-z));}))return;
 const nextListener=createListenerRecord(room),nextPair=createMonitorPair(room,nextListener);listener.position=nextListener.position;
 for(let i=0;i<2;i++){pair[i].position=nextPair[i].position;pair[i].yaw=nextPair[i].yaw;}
}
export function parseRoomDocument(text){const data=JSON.parse(text);if(data.schemaVersion!==1||data.units!=='m'||!Array.isArray(data.objects))throw new Error('Nieobsługiwany format dokumentu AKUSTYKA.');for(const object of data.objects){if(!object||typeof object!=='object'||typeof object.type!=='string')throw new Error('Nieprawidłowy obiekt sceny.');if(object.type==='seated-listener')Object.assign(object,normalizeListenerRecord(object));if(object.type==='studio-monitor')Object.assign(object,normalizeMonitorRecord(object));}const {width,length,height}=data.room??{};const room=roomFromCentimeters(width*100,length*100,height*100);if(data.showTweeterRays!==undefined&&typeof data.showTweeterRays!=='boolean')throw new Error('Nieprawidłowa widoczność promieni.');migrateLegacyListeningLayout(data,room);const desk=data.objects.find(o=>o.id==='desk-combodesk-88'&&o.type==='studio-desk');if(desk&&!data.transforms?.[desk.id]&&desk.position&&Math.abs(desk.position.x-room.width/2)<1e-8&&Math.abs(desk.position.z-(COMBODESK_88.depth/2+0.16))<1e-8&&Math.abs(desk.position.y)<1e-8&&Math.abs(desk.yaw)<1e-8)desk.position=createDeskRecord(room).position;if(desk)ensureModulDeskRecord({objects:data.objects,room});return {...data,room,roomShape:normalizeFootprint(data.roomShape),roomMesh:normalizeRoomMesh(data.roomMesh),transforms:normalizeTransforms(data.transforms),roomFeatures:normalizeRoomFeatures(data.roomFeatures,room,{migrateDefaultNiche:!data.roomMesh&&!data.roomShape}),showTweeterRays:data.showTweeterRays??true,reflections:normalizeReflectionSettings(data.reflections),monitorLinks:normalizeMonitorLinks(data.monitorLinks,data.objects,room)};}
export function createRoomHistory(initial=DEFAULT_ROOM){let entries=[{...initial}],index=0;return {push(room){if(JSON.stringify(room)===JSON.stringify(entries[index]))return;entries=entries.slice(0,index+1);entries.push({...room});index++;},undo(){if(index>0)index--;return {...entries[index]};},redo(){if(index<entries.length-1)index++;return {...entries[index]};},reset(room){entries=[{...room}];index=0;},get canUndo(){return index>0;},get canRedo(){return index<entries.length-1;}};}
export function setupBench(actions){
 const $=id=>document.getElementById(id);
 for(const details of document.querySelectorAll('.bench-menu'))details.addEventListener('toggle',()=>{if(details.open)for(const other of document.querySelectorAll('.bench-menu'))if(other!==details)other.open=false;});
 const close=()=>document.querySelectorAll('.bench-menu').forEach(d=>d.open=false);
 document.addEventListener('click',e=>{if(!e.target.closest('.bench-menu'))close();});
 function panel(kind='dimensions'){const main=document.querySelector('main'),target=$(kind+'-panel');const show=target.hidden||main.classList.contains('panel-hidden');main.classList.toggle('panel-hidden',!show);for(const key of ['dimensions','listener','monitors','reflections','features','object','surface']){$(key+'-panel').hidden=key!==kind||!show;$('toggle-'+key).setAttribute('aria-expanded',String(key===kind&&show));$('toggle-'+key).classList.toggle('active',key===kind&&show);}}
 for(const key of ['dimensions','listener','monitors','reflections','features','object','surface'])$('toggle-'+key).onclick=()=>panel(key);$('view-panel').onclick=()=>{panel();close();};
 $('view-fullscreen').onclick=()=>{window.desktop?.toggleFullscreen();close();};
 for(const [id,action] of Object.entries({'file-new':actions.new,'file-open':actions.open,'file-save':actions.save,'file-exit':actions.exit,'edit-undo':actions.undo,'edit-redo':actions.redo,'view-3d':actions.three,'view-top':actions.top}))$(id).onclick=()=>{close();action();};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();return;}if(!(e.ctrlKey||e.metaKey)||e.altKey)return;const key=e.key.toLowerCase();const action=key==='o'?actions.open:key==='s'?actions.save:key==='n'?actions.new:key==='z'?(e.shiftKey?actions.redo:actions.undo):key==='y'?actions.redo:null;if(action){e.preventDefault();action();}});
 $('file-exit').disabled=!window.desktop;
 return {showPanel(kind){$(kind+'-panel').hidden=true;panel(kind);},refresh(history){$('edit-undo').disabled=!history.canUndo;$('edit-redo').disabled=!history.canRedo;}};
}


