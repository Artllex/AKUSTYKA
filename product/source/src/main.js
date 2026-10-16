import {setupFieldHistory} from './field-history.js';
import {setupNumericFields} from './numeric-field.js';
import {edgeOnly} from './selection-policy.js';
import {createMeshRoom} from './mesh-view.js';
import {createBaseboards} from './baseboards.js';
import {createRightWallSockets} from './right-wall-sockets.js';

import {initialRoomMesh,normalizeRoomMesh} from './mesh-model.js';

import {setupViewportEditor} from './viewport-editor.js';

import {createFootprintRoom} from './surface-view.js';

import {initialFootprint,normalizeFootprint,footprintArea} from './surface-model.js';

import {setupSurfacePanel} from './surface-panel.js';

import {bindRepeatButton} from './repeat-button.js';

import {distanceAdjustment} from './distance-adjustment.js';

import {distanceBetweenObjects} from './object-distance.js';

import {applyObjectTransform,updateObjectTransform} from './object-transform.js';

import {setupObjectPanel} from './object-panel.js';

import {createRoomFeatureViews,normalizeRoomFeatures,defaultRoomFeatures} from './room-features.js';

import {setupFeaturesPanel} from './features-panel.js';

import * as THREE from 'three';

import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

import {createDocument,DEFAULT_ROOM,roomFromCentimeters,roomMetrics,usesDefaultListeningLayout,placeDefaultListeningLayout} from './model.js';

import {createRoom,addNicheStepToMeshRoom} from './room-view.js';

import {surfaceProjection} from './projection.js';
import {objectOnProjectionSide} from './projection-objects.js';

import {createOrientation} from './orientation.js';

import {parseRoomDocument,setupBench} from './bench.js';

import {createListenerRecord,createSeatedListener} from './listener-view.js';
import {createListenerPov,BINOCULAR_FIELD} from './listener-pov.js';
import {createMotu24Ai,createMoniconXL,createProArtP16,createStreamDeckXL,createGxt144Rexx,createBehringerModelD,createBehringerKobolExpander} from './studio-peripherals.js';

import {createDocumentHistory} from './history.js';

import {patchListener} from './listener-model.js';

import {setupListenerPanel} from './listener-panel.js';

import {createMonitorPair,normalizeMonitorRecord} from './monitor-model.js';

import {createStudioMonitor} from './monitor-view.js';

import {setupMonitorPanel} from './monitor-panel.js';
import {monitorSideDistance,moveMonitorAlongSide} from './monitor-side-distance.js';
import {createRackView} from './rack-view.js';
import {ensureRackRecord,moveDefaultRackWithRoom} from './rack-model.js';
import {BILLY_BOOKCASE_ID,ensureBillyRecord,moveDefaultBillyWithRoom} from './billy-model.js';
import {createBillyView} from './billy-view.js';
import {PVM_20M2E_ID,ensurePvm20m2eRecord,moveDefaultPvm20m2eWithRoom,moveDefaultPvm20m2eWithFeatures} from './pvm-20m2e-model.js';
import {createPvm20m2eView} from './pvm-20m2e-view.js';
import {createDeskView} from './desk-view.js';
import {createModulDeskView} from './modul-desk-view.js';
import {createModul1520DeskView} from './modul-1520-desk-view.js';
import {createAlienwareDisplay} from './alienware-display.js';
import {moveDefaultDeskWithRoom} from './desk-model.js';
import {MODUL_DESK_ID,moveDefaultModulDeskWithRoom} from './modul-desk-model.js';
import {MODUL_1520_DESK_ID,moveDefaultModul1520DeskWithRoom} from './modul-1520-desk-model.js';
import {THOMANN_DESK_ID,chooseDesk,selectedDeskId} from './desk-choice.js';

import {updateLinkedMonitor,DEFAULT_MONITOR_LINKS} from './monitor-links.js';

import {createTweeterRays} from './tweeter-rays.js';
import {createMonitorWallWarnings} from './monitor-clearance.js';
import {updateDistanceLabels,hoverDistanceLabel} from './distance-label.js';
import {createMonitorSpan} from './monitor-span.js';

import {findMonitorCollisions,tintCollision} from './monitor-collisions.js';

import {createReflectionView} from './reflection-view.js';
import {updateReflectionVisibility} from './reflection-visibility.js';

import {computeFirstReflections,normalizeReflectionSettings,REFLECTION_KEYS} from './reflection-model.js';
import {ceilingPanelPlacement,createCeilingPanelView,normalizeCeilingPanelSettings,CEILING_PANEL} from './ceiling-panel.js';
import {wallPanelPlacement,createWallPanelView} from './wall-panel.js';
import {createBassTrapView} from './bass-trap-view.js';
import {createRearDiffuserView} from './rear-diffuser.js';

import {setupReflectionPanel} from './reflection-panel.js';
import {analyzeAcousticPaths,normalizeAcousticSettings} from './acoustic-simulation.js';

import './style.css';

const $=id=>document.getElementById(id),host=$('viewport');

const doc=createDocument();chooseDesk(doc,MODUL_1520_DESK_ID);const history=createDocumentHistory(doc);let bench,listenerPanel,monitorPanel,reflectionPanel,featuresPanel,objectPanel,surfacePanel,viewportEditor,fieldHistory,rackAddButton,billyAddButton,pvmAddButton;const orientation=createOrientation($('orientation'));let renderer;

try{renderer=new THREE.WebGLRenderer({antialias:true});}catch(error){$('error').hidden=false;$('error').textContent='Nie można uruchomić widoku 3D. Sprawdź obsługę WebGL w przeglądarce.';throw error;}

renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);renderer.setClearColor(0x16212b);
const panelInfo=document.createElement('section');panelInfo.id='ceiling-panel-distances';panelInfo.setAttribute('aria-label','Odległości narożników panelu sufitowego');
panelInfo.innerHTML='<strong>Panel sufitowy · 100 × 50 × 11 cm</strong><small>Odległości narożników od ścian</small><table><thead><tr><th>Nr</th><th>Przednia</th><th>Lewa</th><th>Prawa</th></tr></thead><tbody></tbody></table>';
panelInfo.hidden=true;host.append(panelInfo);
$('reflection-count').insertAdjacentHTML('afterend','<section class="ceiling-panel-controls" aria-label="Ustawienie panelu sufitowego"><h2>Panel sufitowy</h2><label for="ceiling-panel-drop">Odstęp od sufitu · w dół<div><input id="ceiling-panel-drop" type="number" min="0" step="0.1" value="0"><span>cm</span></div></label><label for="ceiling-panel-z-offset">Przesunięcie wzdłuż pokoju · + ku tyłowi<div><input id="ceiling-panel-z-offset" type="number" step="0.1" value="0"><span>cm</span></div></label><p class="muted">0 cm oznacza środek wyliczonych odbić. Wartość ujemna przesuwa panel ku przedniej ścianie.</p></section>');
$('reflections-panel').insertAdjacentHTML('beforeend','<p id="wall-panel-summary" class="muted" aria-live="polite"></p>');
let laserCursor=null;
host.addEventListener('pointermove',event=>{
 if(event.target.closest?.('button,input,label,#edit-popup,#edit-tools,#axis-gizmo,.view-tools,#distance-label,#edge-insert')){laserCursor=null;return;}
 const rect=renderer.domElement.getBoundingClientRect();
 laserCursor={x:event.clientX-rect.left,y:event.clientY-rect.top};
});
host.addEventListener('pointerleave',()=>{laserCursor=null;});

// Uchwyty geometrii leżą nad płótnem, więc gest touchpada trafia w SVG.
// Przekaż go do OrbitControls razem z pozycją kursora i modyfikatorami.
$('edit-overlay').addEventListener('wheel',event=>{
 const wheel=new WheelEvent('wheel',{
  bubbles:false,cancelable:true,deltaX:event.deltaX,deltaY:event.deltaY,
  deltaZ:event.deltaZ,deltaMode:event.deltaMode,clientX:event.clientX,
  clientY:event.clientY,ctrlKey:event.ctrlKey,shiftKey:event.shiftKey,
  altKey:event.altKey,metaKey:event.metaKey
 });
 renderer.domElement.dispatchEvent(wheel);
 if(wheel.defaultPrevented)event.preventDefault();
},{passive:false});

const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xe7f4ff,0x3b4b5e,2.5));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(3,8,5);scene.add(light);
const listenerPov=createListenerPov(renderer,scene);

const perspective=new THREE.PerspectiveCamera(42,1,0.01,200);

let camera=perspective,controls,view,featureViews=[],listenerViews=[],monitorViews=[],rackViews=[],deskViews=[],bookcaseViews=[],pvmViews=[],bassTrapViews=[],rearDiffuserView=null,ceilingPanelView=null,wallPanelViews=[],tweeterRays=null,wallWarnings=null,monitorSpan=null,reflectionView=null,selected=null,projection=null,selectedObjectId=null,povActive=false;

function bindControls(target){controls?.dispose();controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=0.15;controls.maxDistance=60;controls.maxPolarAngle=Math.PI;controls.enableRotate=!projection;controls.target.copy(target);controls.update();}

const format=(n,d=1)=>n.toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});

let measurement=null,measurementResult=null,distanceTyping=false;

const measurementGroup=new THREE.Group();measurementGroup.userData.helper=true;scene.add(measurementGroup);

const measurementLine=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xffdc72,depthTest:false}));measurementLine.renderOrder=30;measurementGroup.add(measurementLine);

const measurementTarget=new THREE.BoxHelper(undefined,0xffdc72);measurementTarget.material.depthTest=false;measurementTarget.renderOrder=29;measurementGroup.add(measurementTarget);measurementGroup.visible=false;

function entityKey(object){return view.surfaces.includes(object)?'surface:'+object.name:(object.userData.recordId??object.userData.id??object.name);}

function findEntity(key){return key.startsWith('surface:')?view.surfaces.find(s=>s.name===key.slice(8)):selectableGroups().find(g=>entityKey(g)===key);}

const surfaceLabels={'wall-front':'Przednia ściana','wall-back':'Tylna ściana','wall-left':'Lewa ściana','wall-right':'Prawa ściana',floor:'Podłoga',ceiling:'Sufit'};

function entityLabel(object){return surfaceLabels[object.name]??objectLabel(entityKey(object));}

function clearMeasurement(){for(const repeat of distanceRepeat)repeat.stop();measurement=null;measurementResult=null;measurementGroup.visible=false;$('distance-label').hidden=true;delete host.dataset.distanceMeters;}

function refreshMeasurement(){if(!measurement)return;const first=findEntity(measurement.first),second=findEntity(measurement.second);if(!first||!second){clearMeasurement();return;}measurementResult=distanceBetweenObjects(first,second);if(!measurementResult){clearMeasurement();return;}measurementGroup.visible=true;measurementTarget.setFromObject(second);measurementLine.geometry.dispose();measurementLine.geometry=new THREE.BufferGeometry().setFromPoints([measurementResult.start,measurementResult.end]);$('distance-value').textContent=entityLabel(first)+' ↔ '+entityLabel(second)+': '+format(measurementResult.distance*100,1)+' cm';$('distance-label').hidden=false;host.dataset.distanceMeters=measurementResult.distance;

 if(!distanceTyping)$('distance-input').value=(measurementResult.distance*100).toFixed(1);$('distance-input').disabled=measurement.first.startsWith('surface:')&&measurement.second.startsWith('surface:');for(const button of $('distance-form').querySelectorAll('button'))button.disabled=$('distance-input').disabled;}

function setMeasuredDistance(recordHistory=true){try{

 if(!measurement||!measurementResult)return;

 const requested=Number($('distance-input').value)/100;if($('distance-input').value===''||!Number.isFinite(requested)||requested<0||requested>20)throw new Error('Odległość musi wynosić od 0 do 2000 cm.');

 const id=measurement.first.startsWith('surface:')?measurement.second:measurement.first;if(id.startsWith('surface:'))return;

 const first=findEntity(measurement.first),second=findEntity(measurement.second),movingFirst=id===measurement.first,center=o=>new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());let current={x:0,y:0,z:0,rx:0,ry:0,rz:0,...doc.transforms[id]},result=measurementResult;

 for(let i=0;i<24;i++){

  if(Math.abs(result.distance-requested)<0.00002){commitObjectTransform(id,current,recordHistory);return;}

  current=distanceAdjustment(result,current,movingFirst,requested-result.distance,center(first),center(second));

  const proposed=updateObjectTransform(doc,id,current);

  const previewRooms=[];const preview=object=>{if(view.surfaces.includes(object)){const room=buildRoom(proposed);previewRooms.push(room);return room.surfaces.find(s=>s.name===object.name);}const clone=object.clone(true),key=entityKey(object),before=doc.transforms[key]??{},after=proposed[key]??{};for(const axis of ['x','y','z'])clone.position[axis]+=(after[axis]??0)-(before[axis]??0);clone.updateMatrixWorld(true);return clone;};

  result=distanceBetweenObjects(preview(first),preview(second));previewRooms.forEach(room=>room.dispose());if(!result)break;

 }

 throw new Error('Nie udało się ustawić tej odległości przy obecnym spięciu i układzie obiektów.');

 }catch(error){showError(error);}}

function nudgeDistance(sign){const input=$('distance-input');if(input.disabled)return;const value=Number(input.value);if(!Number.isFinite(value))return;input.value=Math.max(0,Math.min(2000,value+sign)).toFixed(1);input.dispatchEvent(new Event('input',{bubbles:true}));}

const distanceRepeat=[bindRepeatButton($('distance-minus'),()=>nudgeDistance(-1)),bindRepeatButton($('distance-plus'),()=>nudgeDistance(1))];

$('distance-input').addEventListener('input',()=>{const input=$('distance-input');if(input.value===''||!input.validity.valid)return;const typing=document.activeElement===input;distanceTyping=typing;try{setMeasuredDistance(!typing);}finally{distanceTyping=false;}});

$('distance-input').addEventListener('change',()=>{history.push(doc);bench.refresh(history);refreshMeasurement();});

$('distance-form').onsubmit=e=>e.preventDefault();

$('distance-clear').onclick=clearMeasurement;document.addEventListener('keydown',e=>{if(e.key==='Escape'){clearMeasurement();selectObject(null);select(null);}});

const selectionOutline=new THREE.BoxHelper(undefined,0x74dcc2);selectionOutline.userData.helper=true;selectionOutline.visible=false;selectionOutline.material.depthTest=false;selectionOutline.renderOrder=20;scene.add(selectionOutline);

const objectLabel=id=>id==='door'?'Drzwi':id==='window'?'Wnęka okna':id==='radiator'?'Kaloryfer':id==='switch'?'Włącznik światła':id==='ceiling-light'?'Lampa sufitowa Govee H60A6':id==='rack-15u'?'Stojak RIVECO 19″ 15U':id===BILLY_BOOKCASE_ID?'Regał IKEA BILLY 80 × 28 × 202 cm':id===PVM_20M2E_ID?'Sony PVM-20M2E · 45 × 45,8 × 50,3 cm':id==='rear-diffuser-binary'?'Dyfuzor binarny 60 × 120 × 11 cm':id==='desk-combodesk-88'?'Biurko Thomann ComboDesk 88':id===MODUL_DESK_ID?'Biurko modul Studio Desk 2025':id===MODUL_1520_DESK_ID?'Biurko modul Studio Desk 1520':id.startsWith('bass-trap-')?'Pułapka basowa '+id.slice(10):id.startsWith('monitor-')?'Monitor '+id.slice(8):'Manekin';

function selectableGroups(){return [...featureViews,...listenerViews,...monitorViews,...rackViews,...deskViews,...bookcaseViews,...pvmViews,...bassTrapViews,...(rearDiffuserView?[rearDiffuserView]:[])].map(v=>v.group);}

function refreshObjectSelection(){const object=selectableGroups().find(g=>(g.userData.recordId??g.userData.id??g.name)===selectedObjectId);selectionOutline.visible=!!object;if(object)selectionOutline.setFromObject(object);host.dataset.selectedObject=object?selectedObjectId:'';objectPanel?.sync();refreshMeasurement();}

function selectObject(object){selectedObjectId=object?(object.userData.recordId??object.userData.id??object.name):null;refreshObjectSelection();if(object)bench.showPanel('object');}

function select(surface){selected=surface;refreshCollisions();$('inside').disabled=$('outside').disabled=!selected;surfacePanel?.sync(selected);}

function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);perspective.aspect=w/h;perspective.updateProjectionMatrix();if(projection){camera.left=-projection.halfHeight*w/h;camera.right=projection.halfHeight*w/h;camera.updateProjectionMatrix();}}

const projectionHidden=new WeakMap();let projectionObjectsVisible=false;
function updateProjectionVisibility(){
 if(!view)return;
 const objects=[...featureViews,...listenerViews,...monitorViews,...rackViews,...deskViews,...bookcaseViews,...pvmViews,...bassTrapViews,...(rearDiffuserView?[rearDiffuserView]:[]),...(ceilingPanelView?[ceilingPanelView]:[]),...wallPanelViews].map(v=>v.group),helpers=[tweeterRays?.group,wallWarnings?.group,monitorSpan?.group].filter(Boolean),groups=[...objects,...helpers];
 const surface=projection?view.surfaces.find(s=>s.name===projection.surfaceName):null;
 for(const group of objects){if(projection){if(!projectionHidden.has(group))projectionHidden.set(group,group.visible);group.visible=!!(projectionObjectsVisible&&projectionHidden.get(group)&&objectOnProjectionSide(group,surface,projection.side));}else if(projectionHidden.has(group)){group.visible=projectionHidden.get(group);projectionHidden.delete(group);}}
 const visibleMonitors=new Set(monitorViews.filter(m=>m.group.visible).map(m=>m.group.name));
 for(const group of helpers){if(projection){if(!projectionHidden.has(group))projectionHidden.set(group,group.visible);group.visible=!!(projectionObjectsVisible&&projectionHidden.get(group)&&(group===monitorSpan?.group?visibleMonitors.size===2:visibleMonitors.size>0));}else if(projectionHidden.has(group)){group.visible=projectionHidden.get(group);projectionHidden.delete(group);}}
 for(const group of [tweeterRays?.group,wallWarnings?.group].filter(Boolean))for(const child of group.children){
  const monitor=child.userData.monitor??(child.name.startsWith('ray-')?child.name.slice(4):child.name.startsWith('head-hit-')?child.name.slice(9):null);
  if(!monitor)continue;
  if(projection){if(!projectionHidden.has(child))projectionHidden.set(child,child.visible);child.visible=projectionHidden.get(child)&&visibleMonitors.has(monitor);}else if(projectionHidden.has(child)){child.visible=projectionHidden.get(child);projectionHidden.delete(child);}
 }
 if(projection){for(const object of view.group.children)object.visible=object===surface||(object.name==='right-wall-sockets'&&surface?.name==='wall-right')||(object.name==='floor-outline'&&surface?.name==='floor')||(object===view.grid&&surface?.name==='floor'&&$('grid').checked);}
 updateReflectionVisibility(reflectionView,projection,projectionObjectsVisible,new Set(objects.filter(group=>group.visible).map(group=>group.userData.recordId??group.userData.id??group.name)));
 host.dataset.visibleLaserGroups=String(helpers.filter(g=>g.visible).length);
 host.dataset.visibleReflectionOutlines=String(reflectionView?.group.visible?reflectionView.group.children.filter(o=>o.name==='reflection-projection'&&o.visible).length:0);
 host.dataset.visibleSceneEntities=String(groups.filter(g=>g.visible).length);
 host.dataset.projectionSurface=projection?.surfaceName??'';
}

$('projection-objects').onclick=()=>{projectionObjectsVisible=!projectionObjectsVisible;const button=$('projection-objects');button.setAttribute('aria-pressed',String(projectionObjectsVisible));button.textContent=projectionObjectsVisible?'Ukryj obiekty':'Pokaż obiekty';updateProjectionVisibility();};

let previousSurfaceView=null;
function frame(top=false){povActive=false;host.classList.remove('listener-pov');$('listener-pov').setAttribute('aria-pressed','false');previousSurfaceView=null;projection=null;camera=perspective;camera.up.set(0,1,0);const r=doc.room,scale=Math.max(r.width,r.length,r.height),target=new THREE.Vector3(r.width/2,r.height*0.35,r.length/2);camera.position.copy(target).add(new THREE.Vector3(top?0:scale*1.25,top?scale*2:scale,top?0.001:scale*1.4));bindControls(target);view.group.children.forEach(o=>o.visible=true);view.grid.visible=$('grid').checked;$('cutaway').disabled=false;updateProjectionVisibility();resize();}

function enterListenerPov(){
 if(!listenerViews[0])return;
 previousSurfaceView=null;projection=null;povActive=true;camera=perspective;controls.enabled=false;
 host.classList.add('listener-pov');host.dataset.povHorizontalFov=String(BINOCULAR_FIELD.horizontal);host.dataset.povVerticalFov=String(BINOCULAR_FIELD.vertical);
 $('listener-pov').setAttribute('aria-pressed','true');$('cutaway').disabled=true;
 clearMeasurement();selectObject(null);select(null);viewportEditor?.clear();
 view.group.children.forEach(o=>o.visible=true);view.grid.visible=false;
 updateProjectionVisibility();listenerPov.invalidate();resize();
}

function project(side){if(!selected)return;projection=surfaceProjection(selected,host.clientWidth/host.clientHeight,side);projection.side=side;projection.surfaceName=selected.name;camera=projection.camera;bindControls(projection.target);for(const o of view.group.children)o.visible=o===selected||(o.name==='floor-outline'&&selected.name==='floor')||(o===view.grid&&selected.name==='floor'&&$('grid').checked);$('cutaway').disabled=true;updateProjectionVisibility();resize();}

function refreshCollisions(){if(!view)return;const objects=scene.children.filter(o=>o.isGroup&&!o.userData.helper&&o!==view.group&&o!==tweeterRays?.group),collisions=findMonitorCollisions(monitorViews,objects,doc.room,(doc.roomMesh||doc.roomShape)?view.surfaces:null);for(const object of objects)tintCollision(object,collisions.targets.has(object));for(const surface of view.surfaces){const active=collisions.surfaces.has(surface.name);tintCollision(surface,active);if(!active)surface.material.emissive.setHex(surface===selected?0x17483e:0);}host.dataset.collisionSurfaces=[...collisions.surfaces].sort().join(',');host.dataset.collisionObjects=[...collisions.targets].map(o=>o.userData.recordId??o.userData.id??o.name).sort().join(',');}

function includeAcousticMesh(mesh,root){
 if(doc.acoustics.includeHiddenDeskEquipment)return true;
 if(!root.name.startsWith('desk-'))return true;
 for(let node=mesh;node&&node!==root;node=node.parent)if(!node.visible)return false;
 return true;
}

function refreshReflections(){
 if(reflectionView){scene.remove(reflectionView.group);reflectionView.dispose();}
  if(ceilingPanelView){scene.remove(ceilingPanelView.group);ceilingPanelView.dispose();ceilingPanelView=null;}
  for(const wallPanel of wallPanelViews){scene.remove(wallPanel.group);wallPanel.dispose();}wallPanelViews=[];
 const objects=[...featureViews,...(doc.acoustics.includeHiddenRack?rackViews:[]),...deskViews,...bookcaseViews,...pvmViews,...bassTrapViews,...(rearDiffuserView?[rearDiffuserView]:[])];
  const targets=computeFirstReflections(monitorViews,listenerViews[0],doc.room,{...doc.reflections,ears:'both',selected:REFLECTION_KEYS},view.surfaces,objects.map(item=>item.group),includeAcousticMesh);
  const placement=ceilingPanelPlacement(targets,doc.room,doc.ceilingPanel);
  if(placement)doc.ceilingPanel=placement.settings;
  if(placement){ceilingPanelView=createCeilingPanelView(placement);scene.add(ceilingPanelView.group);}
  for(const side of ['left','right']){
   const wallPlacement=wallPanelPlacement(targets,doc.room,side);
   if(wallPlacement){const wallPanel=createWallPanelView(wallPlacement);wallPanelViews.push(wallPanel);scene.add(wallPanel.group);}
   const prefix=`wallPanel${side==='left'?'Left':'Right'}`;
   host.dataset[`${prefix}CenterY`]=wallPlacement?String(wallPlacement.center.y):'';
   host.dataset[`${prefix}UpperCenterY`]=wallPlacement?String(wallPlacement.upperCenterY):'';
   host.dataset[`${prefix}Count`]=String(wallPlacement?.count??0);
   host.dataset[`${prefix}CenterZ`]=wallPlacement?String(wallPlacement.center.z):'';
   host.dataset[`${prefix}Orientation`]=wallPlacement?.orientation??'';
   for(const axis of ['y','z'])for(const [bound,fn] of [['Min',Math.min],['Max',Math.max]])host.dataset[`${prefix}${bound}${axis.toUpperCase()}`]=wallPlacement?String(fn(...wallPlacement.reflectionPoints.map(point=>point[axis]))):'';
  }
  host.dataset.wallPanelCount=String(wallPanelViews.reduce((total,panel)=>total+panel.placement.count,0));
  $('wall-panel-summary').textContent=wallPanelViews.length===2?'Po dwa pionowe panele na lewej i prawej ścianie · każdy 100 × 50 × 11 cm · dolne krawędzie: 32 i 132 cm nad podłogą.':'Brak miejsca na dwa panele lub punktów odbić na jednej ze ścian bocznych.';
  const dropInput=$('ceiling-panel-drop'),offsetInput=$('ceiling-panel-z-offset');
  dropInput.max=String(Math.floor((doc.room.height-CEILING_PANEL.thickness)*1000)/10);
  dropInput.value=String(Math.round(doc.ceilingPanel.drop*1000)/10);
  offsetInput.min=placement?String(Math.ceil(placement.zOffsetLimits.min*1000)/10):'0';
  offsetInput.max=placement?String(Math.floor(placement.zOffsetLimits.max*1000)/10):'0';
  offsetInput.value=String(Math.round(doc.ceilingPanel.zOffset*1000)/10);
  dropInput.disabled=offsetInput.disabled=!placement;
  panelInfo.hidden=!placement;panelInfo.querySelector('tbody').replaceChildren();
  if(placement)for(const corner of placement.corners){const row=document.createElement('tr');for(const key of ['index','front','left','right']){const cell=document.createElement('td');cell.textContent=key==='index'?String(corner.index):format(corner[key]*100,1)+' cm';row.append(cell);}panelInfo.querySelector('tbody').append(row);}
  host.dataset.ceilingPanelCount=placement?'1':'0';host.dataset.ceilingPanelYaw=placement?placement.yaw.toFixed(5):'';
  host.dataset.ceilingPanelCenterX=placement?String(placement.center.x):'';host.dataset.ceilingPanelCenterZ=placement?String(placement.center.z):'';
  host.dataset.ceilingPanelDrop=placement?String(placement.settings.drop):'';host.dataset.ceilingPanelOffset=placement?String(placement.settings.zOffset):'';
  host.dataset.ceilingReflectionMinX=placement?String(Math.min(...placement.reflectionPoints.map(point=>point.x))):'';
  host.dataset.ceilingReflectionMaxX=placement?String(Math.max(...placement.reflectionPoints.map(point=>point.x))):'';
  host.dataset.ceilingReflectionMinZ=placement?String(Math.min(...placement.reflectionPoints.map(point=>point.z))):'';
  host.dataset.ceilingReflectionMaxZ=placement?String(Math.max(...placement.reflectionPoints.map(point=>point.z))):'';
  reflectionView=createReflectionView(monitorViews,listenerViews[0],doc.room,doc.reflections,view.surfaces,[...objects.map(item=>item.group),...(ceilingPanelView?[ceilingPanelView.group]:[]),...wallPanelViews.map(item=>item.group)],includeAcousticMesh);
 scene.add(reflectionView.group);
 host.dataset.reflectionCount=reflectionView.paths.length;
 for(const side of ['left','right'])host.dataset[`wallPanel${side==='left'?'Left':'Right'}ReflectionCount`]=String(reflectionView.paths.filter(path=>path.surface.startsWith(`object:wall-panel-${side}:`)).length);
 host.dataset.deskReflectionCount=reflectionView.paths.filter(path=>path.surface.startsWith('object:'+selectedDeskId(doc)+':')).length;
 host.dataset.activeDeskReflectionCount=reflectionView.paths.filter(path=>path.surface.startsWith('object:'+selectedDeskId(doc)+':')).length;
 const report=listenerViews[0]?analyzeAcousticPaths(monitorViews,listenerViews[0],reflectionView.paths,doc.reflections,doc.acoustics,doc.room,{approximateModes:!!(doc.roomMesh||doc.roomShape)}):null;
 reflectionPanel?.sync(reflectionView.paths.length,report);
}

function refreshTweeterRays(){if(tweeterRays){scene.remove(tweeterRays.group);tweeterRays.dispose();}if(wallWarnings){scene.remove(wallWarnings.group);wallWarnings.dispose();}if(monitorSpan){scene.remove(monitorSpan.group);monitorSpan.dispose();}monitorSpan=createMonitorSpan(monitorViews);tweeterRays=createTweeterRays(monitorViews,listenerViews[0],doc.room,doc.showTweeterRays,(doc.roomMesh||doc.roomShape)?view.surfaces:null);wallWarnings=createMonitorWallWarnings(monitorViews,view.surfaces);scene.add(tweeterRays.group,wallWarnings.group,monitorSpan.group);host.dataset.monitorSpanDistance=monitorSpan.distance?.toFixed(4)??"";host.dataset.tweeterRayCount=tweeterRays.rayCount;host.dataset.tweeterHeadHits=tweeterRays.hitCount;host.dataset.tooCloseMonitors=tweeterRays.tooCloseCount;host.dataset.tweeterRayColors=tweeterRays.group.children.filter(o=>o.name.startsWith('ray-')).map(o=>o.material.color.getHexString()).join(',');host.dataset.rayDistances=tweeterRays.group.children.filter(o=>o.name.startsWith('distance-ray-')).map(o=>o.userData.label).join(',');host.dataset.wallClearanceWarnings=wallWarnings.warnings.map(w=>w.monitor+':'+w.wall).join(',');host.dataset.wallClearanceCount=wallWarnings.warnings.length;host.dataset.wallDistances=wallWarnings.group.children.filter(o=>o.name.startsWith('wall-distance-')).map(o=>o.userData.label).join(',');host.dataset.rearCenterDistances=wallWarnings.group.children.filter(o=>o.name.startsWith('rear-center-distance-')).map(o=>o.userData.label).join(',');host.dataset.rearCenterTooClose=String(wallWarnings.rearClearances.filter(r=>r.center.distance<0.127-1e-7).length);$('tweeter-rays-visible').checked=doc.showTweeterRays;refreshReflections();refreshCollisions();refreshObjectSelection();}

function refreshListeners(){for(const listener of listenerViews){scene.remove(listener.group);listener.dispose();}listenerViews=[];if(!doc.objects.some(o=>o.type==='seated-listener'))doc.objects.push(createListenerRecord(doc.room));for(const record of doc.objects.filter(o=>o.type==='seated-listener')){const listener=createSeatedListener(record);applyObjectTransform(listener.group,doc.transforms);scene.add(listener.group);listenerViews.push(listener);}listenerPanel?.sync(listenerViews[0]?.getEarHeight());refreshTweeterRays();}

function refreshMonitors(){for(const monitor of monitorViews){scene.remove(monitor.group);monitor.dispose();}monitorViews=doc.objects.filter(o=>o.type==='studio-monitor').map(record=>{const monitor=createStudioMonitor(record);applyObjectTransform(monitor.group,doc.transforms);scene.add(monitor.group);return monitor;});host.dataset.monitorCount=monitorViews.length;monitorPanel?.sync();refreshTweeterRays();}

function refreshBassTraps(){for(const trap of bassTrapViews){scene.remove(trap.group);trap.dispose();}bassTrapViews=(doc.bassTraps??[]).map(record=>{const trap=createBassTrapView(record,doc.room);applyObjectTransform(trap.group,doc.transforms);scene.add(trap.group);return trap;});host.dataset.bassTrapCount=String(bassTrapViews.length);host.dataset.leftFrontBassTrapCount=String(bassTrapViews.filter(trap=>trap.placement.corner==='front-left').length);}
function refreshRacks(){refreshBassTraps();for(const rack of rackViews){scene.remove(rack.group);rack.dispose();}rackViews=doc.objects.filter(o=>o.type==='studio-rack').map(record=>{const rack=createRackView(record);const attachments=[createMotu24Ai(record),createBehringerModelD(),createBehringerKobolExpander()];for(const item of attachments)rack.group.add(item.group);const disposeRack=rack.dispose;rack.dispose=()=>{for(const item of attachments)item.dispose();disposeRack();};applyObjectTransform(rack.group,doc.transforms);rack.group.visible=false;scene.add(rack.group);return rack;});host.dataset.rackCount=rackViews.length;host.dataset.motu24AiCount=rackViews.length;host.dataset.modelDCount=rackViews.length;host.dataset.kobolExpanderCount=rackViews.length;if(rackAddButton)rackAddButton.hidden=!!rackViews.length;refreshCollisions();refreshObjectSelection();}

function refreshRearDiffuser(){if(rearDiffuserView){scene.remove(rearDiffuserView.group);rearDiffuserView.dispose();rearDiffuserView=null;}if(doc.rearDiffuser){rearDiffuserView=createRearDiffuserView(doc.rearDiffuser,doc.room);applyObjectTransform(rearDiffuserView.group,doc.transforms);scene.add(rearDiffuserView.group);}host.dataset.rearDiffuserCount=rearDiffuserView?'1':'0';host.dataset.rearDiffuserDepth=doc.rearDiffuser?String(doc.rearDiffuser.depth):'';}
function refreshBookcases(){for(const bookcase of bookcaseViews){scene.remove(bookcase.group);bookcase.dispose();}bookcaseViews=doc.objects.filter(o=>o.type==='bookcase'&&o.id===BILLY_BOOKCASE_ID).map(record=>{const bookcase=createBillyView(record);applyObjectTransform(bookcase.group,doc.transforms);scene.add(bookcase.group);return bookcase;});refreshRearDiffuser();host.dataset.billyCount=bookcaseViews.length;if(billyAddButton)billyAddButton.hidden=!!bookcaseViews.length;refreshCollisions();refreshObjectSelection();}

function refreshPvm(){for(const item of pvmViews){scene.remove(item.group);item.dispose();}pvmViews=doc.objects.filter(o=>o.type==='crt-television'&&o.id===PVM_20M2E_ID).map(record=>{const item=createPvm20m2eView(record);applyObjectTransform(item.group,doc.transforms);scene.add(item.group);return item;});host.dataset.pvmCount=String(pvmViews.length);if(pvmAddButton)pvmAddButton.hidden=!!pvmViews.length;refreshCollisions();refreshObjectSelection();}
function refreshDesks(){for(const desk of deskViews){scene.remove(desk.group);desk.dispose();}deskViews=doc.objects.filter(o=>o.type==='studio-desk').map(record=>{const desk=record.id===MODUL_DESK_ID?createModulDeskView(record):record.id===MODUL_1520_DESK_ID?createModul1520DeskView(record):createDeskView(record);const attachments=[createAlienwareDisplay(record),createMoniconXL(record),createProArtP16(record),createStreamDeckXL(record),createGxt144Rexx(record)];for(const item of attachments){desk.group.add(item.group);item.group.visible=false;}const disposeDesk=desk.dispose;desk.dispose=()=>{for(const item of attachments)item.dispose();disposeDesk();};applyObjectTransform(desk.group,doc.transforms);scene.add(desk.group);return desk;});host.dataset.deskCount=deskViews.length;host.dataset.computerDisplayCount=deskViews.length;host.dataset.moniconXLCount=deskViews.length;host.dataset.proArtP16Count=deskViews.length;host.dataset.streamDeckXLCount=deskViews.length;host.dataset.gxt144RexxCount=deskViews.length;host.dataset.modulDeskCount=deskViews.filter(d=>d.group.name===MODUL_DESK_ID).length;host.dataset.modul1520DeskCount=deskViews.filter(d=>d.group.name===MODUL_1520_DESK_ID).length;$('desk-choice').value=selectedDeskId(doc)??THOMANN_DESK_ID;refreshCollisions();refreshObjectSelection();}

function buildRoom(transforms=doc.transforms){
 const roomView=doc.roomMesh?createMeshRoom(doc.room,doc.roomMesh):doc.roomShape?createFootprintRoom(doc.room,doc.roomShape,doc.roomFeatures):createRoom(doc.room,doc.roomFeatures,transforms);
 if(doc.roomMesh)addNicheStepToMeshRoom(roomView,doc.roomFeatures.window.stepHeight,doc.roomFeatures.window.stepDepth);
 const floor=doc.roomMesh?.faces.find(face=>face.id==='floor');
 const footprint=floor?floor.indices.map(index=>doc.roomMesh.vertices[index]):doc.roomShape??initialFootprint({...doc,transforms});
 const baseboards=createBaseboards(footprint,doc.room,doc.roomFeatures.door,transforms.door?.x??0);
 roomView.group.add(baseboards.group);
 const sockets=createRightWallSockets(doc.room);
 if(sockets)roomView.group.add(sockets.group);
 const dispose=roomView.dispose;roomView.dispose=()=>{dispose();baseboards.dispose();};
 return roomView;
}

 function rebuild(preserveView=false){const surfaceName=selected?.name??projection?.surfaceName;bench?.refresh(history);if(view){scene.remove(view.group);view.dispose();}view=buildRoom();host.dataset.baseboardCount=view.group.getObjectByName('baseboards')?.children.length??0;host.dataset.rightWallSocketModules=view.group.getObjectByName('right-wall-sockets')?.children.filter(part=>part.name.startsWith('socket-module-')&&!part.name.startsWith('socket-module-outline-')).length??0;host.dataset.meshVertexCount=(doc.roomMesh??initialRoomMesh(doc)).vertices.length;host.dataset.shapeGridVertices=view.grid.geometry?.attributes.position.count??0;host.dataset.shapeVertexCount=doc.roomShape?.length??initialFootprint(doc).length;scene.add(view.group);for(const item of featureViews){scene.remove(item.group);item.dispose();}featureViews=createRoomFeatureViews(doc.room,doc.roomFeatures);for(const item of featureViews){applyObjectTransform(item.group,doc.transforms);if(item.group.name==='window'&&view.surfaces.some(surface=>surface.name==='niche-back'||surface.name==='niche-roof')){for(const part of item.group.children){if(!part.name.startsWith('window-')&&part.name!=='niche-sill')part.visible=false;part.userData.collision=false;}}scene.add(item.group);}host.dataset.featureCount=featureViews.length;featuresPanel?.sync();for(const input of document.querySelectorAll('[id^=feature-window-]'))input.disabled=!!doc.roomShape;surfacePanel?.sync(selected);refreshRacks();refreshDesks();refreshBookcases();refreshPvm();refreshListeners();refreshMonitors();select(null);const r=doc.room,m=doc.roomShape?{area:footprintArea(doc.roomShape),volume:footprintArea(doc.roomShape)*r.height}:roomMetrics(r);$('size').textContent=`${format(r.width*100)} × ${format(r.length*100)} × ${format(r.height*100)} cm`;$('metrics').textContent=`Powierzchnia: ${format(m.area,3)} m² · Objętość: ${format(m.volume,3)} m³`;
 if(!preserveView)frame();else{select(view.surfaces.find(s=>s.name===surfaceName)??null);if(projection){for(const o of view.group.children)o.visible=o===selected||(o.name==='right-wall-sockets'&&selected?.name==='wall-right')||(o.name==='floor-outline'&&selected?.name==='floor')||(o===view.grid&&selected?.name==='floor'&&$('grid').checked);$('cutaway').disabled=true;}resize();}}

function applySnapshot(snapshot){listenerPanel?.abort();const roomChanged=JSON.stringify(doc.roomMesh)!==JSON.stringify(snapshot.roomMesh)||JSON.stringify(doc.roomShape)!==JSON.stringify(snapshot.roomShape)||JSON.stringify(doc.room)!==JSON.stringify(snapshot.room)||JSON.stringify(doc.roomFeatures)!==JSON.stringify(snapshot.roomFeatures)||JSON.stringify(doc.transforms)!==JSON.stringify(snapshot.transforms);Object.assign(doc,snapshot);for(const key of ['width','length','height'])$(key).value=doc.room[key]*100;if(roomChanged)rebuild(true);else {refreshRacks();refreshDesks();refreshBookcases();refreshPvm();refreshListeners();refreshMonitors();}featuresPanel?.sync();objectPanel?.sync();refreshMeasurement();viewportEditor?.sync(true);fieldHistory?.restore();bench?.refresh(history);}

$('dimensions').addEventListener('submit',e=>{e.preventDefault();try{const nextRoom=roomFromCentimeters($('width').value,$('length').value,$('height').value),defaultListeningLayout=usesDefaultListeningLayout(doc);normalizeRoomFeatures(doc.roomFeatures,nextRoom);if(doc.roomShape)doc.roomShape=doc.roomShape.map(p=>({x:p.x*nextRoom.width/doc.room.width,z:p.z*nextRoom.length/doc.room.length}));if(doc.roomMesh)doc.roomMesh.vertices=doc.roomMesh.vertices.map(p=>({x:p.x*nextRoom.width/doc.room.width,y:p.y*nextRoom.height/doc.room.height,z:p.z*nextRoom.length/doc.room.length}));moveDefaultRackWithRoom(doc,nextRoom);moveDefaultDeskWithRoom(doc,nextRoom);moveDefaultModulDeskWithRoom(doc,nextRoom);moveDefaultModul1520DeskWithRoom(doc,nextRoom);moveDefaultBillyWithRoom(doc,nextRoom);moveDefaultPvm20m2eWithRoom(doc,nextRoom);doc.room=nextRoom;if(defaultListeningLayout)placeDefaultListeningLayout(doc);history.push(doc);rebuild();$('error').hidden=true;}catch(error){$('error').textContent=error.message;$('error').hidden=false;}});

$('grid').addEventListener('change',()=>view.grid.visible=$('grid').checked&&(!projection||selected?.name==='floor'));

$('perspective').onclick=()=>frame();$('top').onclick=()=>frame(true);$('inside').onclick=()=>project('inside');$('outside').onclick=()=>project('outside');$('return-3d').onclick=()=>frame();$('listener-pov').onclick=enterListenerPov;

function restore(room){doc.room={...room};for(const key of ['width','length','height'])$(key).value=room[key]*100;rebuild();fieldHistory?.reset();}

$('reset').onclick=()=>{doc.room={...DEFAULT_ROOM};doc.roomShape=null;doc.roomMesh=null;doc.roomFeatures=defaultRoomFeatures(doc.room);history.push(doc);restore(DEFAULT_ROOM);};

const raycaster=new THREE.Raycaster();let down;

document.addEventListener('keydown',e=>{if(e.key==='Control')host.classList.add('camera-pan-modifier');});
document.addEventListener('keyup',e=>{if(e.key==='Control')host.classList.remove('camera-pan-modifier');});
window.addEventListener('blur',()=>host.classList.remove('camera-pan-modifier'));
renderer.domElement.addEventListener('pointerdown',e=>{controls.mouseButtons.LEFT=e.shiftKey&&!e.ctrlKey?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE;down={x:e.clientX,y:e.clientY,id:e.pointerId,button:e.button};},true);

renderer.domElement.addEventListener('pointerup',e=>{if(!down||down.id!==e.pointerId||down.button!==0||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5){down=null;return;}down=null;if(edgeOnly(e))return;const {target,object}=pickScene(e);if(!target){clearMeasurement();viewportEditor.clear();selectObject(null);select(null);return;}if(e.ctrlKey){const first=selectedObjectId?findEntity(selectedObjectId):selected;if(first&&target&&first!==target){measurement={first:entityKey(first),second:entityKey(target)};refreshMeasurement();}return;}clearMeasurement();if(object){viewportEditor.clear();selectObject(object);if(!projection)select(null);}else if(view.surfaces.includes(target)){selectObject(null);select(target);viewportEditor.pick(target);}});

function pickScene(e){const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const groups=projection?[]:selectableGroups();const hits=raycaster.intersectObjects([...groups,...view.surfaces.filter(s=>s.visible)],true).filter(hit=>{let o=hit.object;while(o){if(!o.visible)return false;o=o.parent;}return !hit.object.name.startsWith('center-')&&!hit.object.name.startsWith('cross-');});const hit=hits[0];let object=hit?.object;while(object&&!groups.includes(object))object=object.parent;const target=object??(view.surfaces.includes(hit?.object)?hit.object:null);return {target,object,hit};}
function pickSurface(e){const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);return raycaster.intersectObjects(view.surfaces.filter(surface=>surface.visible),false)[0]?.object??null;}
renderer.domElement.addEventListener('dblclick',e=>{if(e.button!==0||e.shiftKey||e.ctrlKey||e.altKey||edgeOnly(e))return;const {target}=pickScene(e);if(!view.surfaces.includes(target))return;e.preventDefault();clearMeasurement();selectObject(null);if(previousSurfaceView&&projection?.surfaceName===target.name){const saved=previousSurfaceView;previousSurfaceView=null;projection=saved.projection;camera=saved.camera;camera.position.copy(saved.position);camera.quaternion.copy(saved.quaternion);camera.up.copy(saved.up);camera.zoom=saved.zoom;camera.updateProjectionMatrix();bindControls(saved.target);select(view.surfaces.find(s=>s.name===saved.surfaceName)??null);viewportEditor.clear();if(projection){select(view.surfaces.find(s=>s.name===projection.surfaceName)??null);for(const o of view.group.children)o.visible=o===selected||(o.name==='floor-outline'&&selected?.name==='floor')||(o===view.grid&&selected?.name==='floor'&&$('grid').checked);}else{view.group.children.forEach(o=>o.visible=true);view.grid.visible=$('grid').checked;}$('cutaway').disabled=!!projection;updateProjectionVisibility();resize();return;}if(!previousSurfaceView)previousSurfaceView={camera,position:camera.position.clone(),quaternion:camera.quaternion.clone(),up:camera.up.clone(),zoom:camera.zoom,target:controls.target.clone(),projection,surfaceName:selected?.name};select(target);viewportEditor.pick(target);project('inside');});
renderer.domElement.addEventListener('pointercancel',()=>down=null);

async function saveDocument(){try{const text=JSON.stringify(doc,null,2);if(window.desktop){const name=await window.desktop.save(text);if(name)$('file-status').textContent=name;}else{const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='pokoj.akustyka.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}catch(error){showError(error);}}

function showError(error){$('error').hidden=false;$('error').textContent=error.message;}

function loadDocument(text,name){const data=parseRoomDocument(text);Object.assign(doc,data);history.reset(doc);restore(doc.room);$('file-status').textContent=name;$('error').hidden=true;}

async function openDocument(){try{if(window.desktop){const result=await window.desktop.open();if(result)loadDocument(result.text,result.name);}else{const input=document.createElement('input');input.type='file';input.accept='.json';input.onchange=async()=>{try{if(input.files[0].size>1024*1024)throw new Error('Plik jest zbyt duży.');loadDocument(await input.files[0].text(),input.files[0].name);}catch(error){showError(error);}};input.click();}}catch(error){showError(error);}}

bench=setupBench({new(){const next=createDocument();chooseDesk(next,MODUL_1520_DESK_ID);Object.assign(doc,next);history.reset(doc);restore(doc.room);$('file-status').textContent='Nowy pokój';$('error').hidden=true;},open:openDocument,save:saveDocument,exit:()=>window.desktop?.exit(),undo:()=>{fieldHistory?.flush();applySnapshot(history.undo());},redo:()=>{fieldHistory?.flush();applySnapshot(history.redo());},three:()=>frame(),top:()=>frame(true),pov:enterListenerPov});

listenerPanel=setupListenerPanel({read:()=>doc.objects.find(o=>o.type==='seated-listener'),preview(patch){try{const record=doc.objects.find(o=>o.type==='seated-listener');Object.assign(record,patchListener(record,patch));refreshListeners();$('error').hidden=true;}catch(error){showError(error);listenerPanel.sync(listenerViews[0]?.getEarHeight());}},commit(){history.push(doc);bench.refresh(history);},cancel(start){Object.assign(doc.objects.find(o=>o.type==='seated-listener'),start);refreshListeners();}});

monitorPanel=setupMonitorPanel({read:()=>doc.objects.filter(o=>o.type==='studio-monitor'),readLinks:()=>doc.monitorLinks,readSideDistance:id=>monitorSideDistance(doc,id),change(id,patch,links=doc.monitorLinks,force=[]){Object.assign(doc,updateLinkedMonitor(doc,id,patch,links,force));history.push(doc);refreshMonitors();bench.refresh(history);$('error').hidden=true;},changeSideDistance(id,distance){Object.assign(doc,moveMonitorAlongSide(doc,id,distance));history.push(doc);refreshMonitors();bench.refresh(history);$('error').hidden=true;},add(){doc.objects.push(...createMonitorPair(doc.room,doc.objects.find(o=>o.type==='seated-listener')??createListenerRecord(doc.room)));doc.monitorLinks={...DEFAULT_MONITOR_LINKS};history.push(doc);refreshMonitors();bench.refresh(history);},showError});

$('tweeter-rays-visible').onchange=()=>{doc.showTweeterRays=$('tweeter-rays-visible').checked;history.push(doc);refreshTweeterRays();bench.refresh(history);};

reflectionPanel=setupReflectionPanel({read:()=>doc.reflections,change(settings){doc.reflections=normalizeReflectionSettings(settings);history.push(doc);refreshReflections();bench.refresh(history);},readAcoustics:()=>doc.acoustics,changeAcoustics(settings){doc.acoustics=normalizeAcousticSettings(settings);history.push(doc);refreshReflections();bench.refresh(history);}});

for(const [id,key] of [['ceiling-panel-drop','drop'],['ceiling-panel-z-offset','zOffset']])$(id).addEventListener('change',event=>{
 const input=event.currentTarget;
 try{
  if(input.value===''||!input.validity.valid)throw new Error('Podaj wartość w dozwolonym zakresie.');
  doc.ceilingPanel=normalizeCeilingPanelSettings({...doc.ceilingPanel,[key]:Number(input.value)/100},doc.room);
  refreshReflections();history.push(doc);bench.refresh(history);$('error').hidden=true;
 }catch(error){showError(error);refreshReflections();}
});

featuresPanel=setupFeaturesPanel({read:()=>doc.roomFeatures,change(features){const next=normalizeRoomFeatures(features,doc.room);moveDefaultPvm20m2eWithFeatures(doc,next);doc.roomFeatures=next;history.push(doc);rebuild();$('error').hidden=true;},showError});

function commitObjectTransform(id,transform,recordHistory=true){doc.transforms=updateObjectTransform(doc,id,transform);if(recordHistory)history.push(doc);const savedCamera=camera.position.clone(),savedTarget=controls.target.clone(),wasProjection=projection,oldSurface=selected?.name;rebuild();if(oldSurface)select(view.surfaces.find(s=>s.name===oldSurface));if(wasProjection&&oldSurface)project(wasProjection.side??'inside');else{camera.position.copy(savedCamera);controls.target.copy(savedTarget);controls.update();}refreshObjectSelection();$('error').hidden=true;}

objectPanel=setupObjectPanel({read:()=>selectedObjectId?{label:objectLabel(selectedObjectId),transform:doc.transforms[selectedObjectId]}:null,change(transform){if(selectedObjectId)commitObjectTransform(selectedObjectId,transform);},clear:()=>selectObject(null),showError});
rackAddButton=document.createElement('button');rackAddButton.type='button';rackAddButton.textContent='Dodaj stojak RIVECO 19″ 15U';rackAddButton.hidden=doc.objects.some(o=>o.id==='rack-15u');rackAddButton.onclick=()=>{ensureRackRecord(doc);history.push(doc);refreshRacks();refreshReflections();bench.refresh(history);};$('object-panel').append(rackAddButton);
billyAddButton=document.createElement('button');billyAddButton.type='button';billyAddButton.textContent='Dodaj regał IKEA BILLY 80 × 28 × 202 cm';billyAddButton.hidden=doc.objects.some(o=>o.id===BILLY_BOOKCASE_ID);billyAddButton.onclick=()=>{ensureBillyRecord(doc);history.push(doc);refreshBookcases();refreshReflections();bench.refresh(history);};$('object-panel').append(billyAddButton);
pvmAddButton=document.createElement('button');pvmAddButton.type='button';pvmAddButton.textContent='Dodaj Sony PVM-20M2E pod włącznikiem';pvmAddButton.hidden=doc.objects.some(o=>o.id===PVM_20M2E_ID);pvmAddButton.onclick=()=>{ensurePvm20m2eRecord(doc);history.push(doc);refreshPvm();refreshReflections();bench.refresh(history);};$('object-panel').append(pvmAddButton);
$('desk-choice').onchange=()=>{const old=selectedDeskId(doc),next=$('desk-choice').value;chooseDesk(doc,next);if(selectedObjectId===old)selectedObjectId=next;history.push(doc);refreshDesks();refreshReflections();updateProjectionVisibility();bench.refresh(history);};

surfacePanel=setupSurfacePanel({read:()=>doc.roomShape??initialFootprint(doc),change(points,commit){

 const next=normalizeFootprint(points),savedCamera=camera.position.clone(),savedTarget=controls.target.clone(),wasProjection=projection,oldName=selected?.name,oldEdge=selected?.userData.edgeIndex;

 doc.roomShape=next;if(commit)history.push(doc);clearMeasurement();rebuild();select(view.surfaces.find(s=>oldEdge!==undefined?s.userData.edgeIndex===oldEdge:s.name===oldName));

 if(wasProjection&&selected)project(wasProjection.side??'inside');else{camera.position.copy(savedCamera);controls.target.copy(savedTarget);controls.update();}

 $('error').hidden=true;

},showError});

function commitRoomMesh(mesh,commit){const next=normalizeRoomMesh(mesh),savedCamera=camera.position.clone(),savedTarget=controls.target.clone(),wasProjection=projection,oldName=viewportEditor?.faceId??selected?.name;doc.roomMesh=next;if(commit)history.push(doc);clearMeasurement();rebuild(true);select(view.surfaces.find(s=>s.name===oldName));if(wasProjection&&selected)project(wasProjection.side??'inside');else{camera.position.copy(savedCamera);controls.target.copy(savedTarget);controls.update();}$('error').hidden=true;host.dataset.meshVertexCount=next.vertices.length;}

viewportEditor=setupViewportEditor({host,read:()=>doc.roomMesh??initialRoomMesh(doc),camera:()=>camera,controls:()=>controls,change:commitRoomMesh,selectSurface:surface=>{selectObject(null);if(surface||!projection)select(surface);},visibleIds:()=>projection?(doc.roomMesh??initialRoomMesh(doc)).faces.find(f=>f.id===(projection.surfaceName??selected?.name))?.indices:null,showError});

$('toggle-surface').hidden=true;

new ResizeObserver(resize).observe(host);

rebuild();fieldHistory=setupFieldHistory({history,read:()=>doc,editor:viewportEditor,context:()=>({object:selectedObjectId,monitor:$('monitor-select').value})});setupNumericFields();renderer.setAnimationLoop(()=>{
 if(povActive){
  const pose=listenerViews[0]?.getEyePose();if(!pose)return;
  camera.position.copy(pose.position);camera.quaternion.copy(pose.quaternion);camera.updateMatrixWorld(true);
  host.dataset.cameraPosition=pose.position.toArray().join(',');
  host.dataset.cameraTarget=pose.position.clone().add(new THREE.Vector3(0,0,-1).applyQuaternion(pose.quaternion)).toArray().join(',');
  host.dataset.viewMode='listener-pov';host.dataset.hoverDistanceLabel='';
  view.updateVisibility(camera,false);
  const hidden=[...listenerViews.map(v=>v.group),tweeterRays?.group,wallWarnings?.group,monitorSpan?.group,reflectionView?.group,measurementGroup,selectionOutline,view.grid,view.group.getObjectByName('room-outline'),view.group.getObjectByName('floor-outline'),view.group.getObjectByName('axes')].filter(Boolean);
  listenerPov.render(pose,hidden);orientation.update(camera);
  return;
 }
 controls.update();host.dataset.viewMode=projection?'projection':'3d';host.dataset.cameraPosition=camera.position.toArray().join(',');host.dataset.cameraTarget=controls.target.toArray().join(',');updateProjectionVisibility();if(!projection)view.updateVisibility(camera,$('cutaway').checked);const label=hoverDistanceLabel([tweeterRays?.group,wallWarnings?.group,monitorSpan?.group],camera,laserCursor,renderer.domElement.clientWidth,renderer.domElement.clientHeight);host.dataset.hoverDistanceLabel=label?.name??'';updateDistanceLabels(tweeterRays?.group,camera);updateDistanceLabels(wallWarnings?.group,camera);updateDistanceLabels(monitorSpan?.group,camera);viewportEditor?.render();orientation.update(camera);renderer.render(scene,camera);
});
