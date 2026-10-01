import {setupFieldHistory} from './field-history.js';
import {edgeOnly} from './selection-policy.js';
import {createMeshRoom} from './mesh-view.js';
import {createBaseboards} from './baseboards.js';

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

import {createOrientation} from './orientation.js';

import {parseRoomDocument,setupBench} from './bench.js';

import {createListenerRecord,createSeatedListener} from './listener-view.js';

import {createDocumentHistory} from './history.js';

import {patchListener} from './listener-model.js';

import {setupListenerPanel} from './listener-panel.js';

import {createMonitorPair,normalizeMonitorRecord} from './monitor-model.js';

import {createStudioMonitor} from './monitor-view.js';

import {setupMonitorPanel} from './monitor-panel.js';
import {monitorSideDistance,moveMonitorAlongSide} from './monitor-side-distance.js';
import {createRackView} from './rack-view.js';
import {ensureRackRecord,moveDefaultRackWithRoom} from './rack-model.js';

import {updateLinkedMonitor,DEFAULT_MONITOR_LINKS} from './monitor-links.js';

import {createTweeterRays} from './tweeter-rays.js';

import {findMonitorCollisions,tintCollision} from './monitor-collisions.js';

import {createReflectionView} from './reflection-view.js';

import {normalizeReflectionSettings} from './reflection-model.js';

import {setupReflectionPanel} from './reflection-panel.js';

import './style.css';

const $=id=>document.getElementById(id),host=$('viewport');

const doc=createDocument();const history=createDocumentHistory(doc);let bench,listenerPanel,monitorPanel,reflectionPanel,featuresPanel,objectPanel,surfacePanel,viewportEditor,fieldHistory,rackAddButton;const orientation=createOrientation($('orientation'));let renderer;

try{renderer=new THREE.WebGLRenderer({antialias:true});}catch(error){$('error').hidden=false;$('error').textContent='Nie można uruchomić widoku 3D. Sprawdź obsługę WebGL w przeglądarce.';throw error;}

renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);renderer.setClearColor(0x16212b);

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

const perspective=new THREE.PerspectiveCamera(42,1,0.01,200);

let camera=perspective,controls,view,featureViews=[],listenerViews=[],monitorViews=[],rackViews=[],tweeterRays=null,reflectionView=null,selected=null,projection=null,selectedObjectId=null;

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

const objectLabel=id=>id==='door'?'Drzwi':id==='window'?'Wnęka okna':id==='radiator'?'Kaloryfer':id==='switch'?'Włącznik światła':id==='ceiling-light'?'Lampa sufitowa Govee H60A6':id==='rack-15u'?'Stojak RIVECO 19″ 15U':id.startsWith('monitor-')?'Monitor '+id.slice(8):'Manekin';

function selectableGroups(){return [...featureViews,...listenerViews,...monitorViews,...rackViews].map(v=>v.group);}

function refreshObjectSelection(){const object=selectableGroups().find(g=>(g.userData.recordId??g.userData.id??g.name)===selectedObjectId);selectionOutline.visible=!!object;if(object)selectionOutline.setFromObject(object);host.dataset.selectedObject=object?selectedObjectId:'';objectPanel?.sync();refreshMeasurement();}

function selectObject(object){selectedObjectId=object?(object.userData.recordId??object.userData.id??object.name):null;refreshObjectSelection();if(object)bench.showPanel('object');}

function select(surface){selected=surface;refreshCollisions();$('inside').disabled=$('outside').disabled=!selected;surfacePanel?.sync(selected);}

function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);perspective.aspect=w/h;perspective.updateProjectionMatrix();if(projection){camera.left=-projection.halfHeight*w/h;camera.right=projection.halfHeight*w/h;camera.updateProjectionMatrix();}}

const projectionHidden=new WeakMap();
function updateProjectionVisibility(){
 if(!view)return;
 const groups=[...featureViews,...listenerViews,...monitorViews,...rackViews].map(v=>v.group);if(tweeterRays)groups.push(tweeterRays.group);
 for(const group of groups){if(projection){if(!projectionHidden.has(group))projectionHidden.set(group,group.visible);group.visible=false;}else if(projectionHidden.has(group)){group.visible=projectionHidden.get(group);projectionHidden.delete(group);}}
 if(projection){const surface=view.surfaces.find(s=>s.name===projection.surfaceName);for(const object of view.group.children)object.visible=object===surface||(object.name==='floor-outline'&&surface?.name==='floor')||(object===view.grid&&surface?.name==='floor'&&$('grid').checked);}
 host.dataset.visibleSceneEntities=String(groups.filter(g=>g.visible).length);
 host.dataset.projectionSurface=projection?.surfaceName??'';
}

let previousSurfaceView=null;
function frame(top=false){previousSurfaceView=null;projection=null;camera=perspective;camera.up.set(0,1,0);const r=doc.room,scale=Math.max(r.width,r.length,r.height),target=new THREE.Vector3(r.width/2,r.height*0.35,r.length/2);camera.position.copy(target).add(new THREE.Vector3(top?0:scale*1.25,top?scale*2:scale,top?0.001:scale*1.4));bindControls(target);view.group.children.forEach(o=>o.visible=true);view.grid.visible=$('grid').checked;$('cutaway').disabled=false;updateProjectionVisibility();resize();}

function project(side){if(!selected)return;projection=surfaceProjection(selected,host.clientWidth/host.clientHeight,side);projection.side=side;projection.surfaceName=selected.name;camera=projection.camera;bindControls(projection.target);for(const o of view.group.children)o.visible=o===selected||(o.name==='floor-outline'&&selected.name==='floor')||(o===view.grid&&selected.name==='floor'&&$('grid').checked);$('cutaway').disabled=true;updateProjectionVisibility();resize();}

function refreshCollisions(){if(!view)return;const objects=scene.children.filter(o=>o.isGroup&&!o.userData.helper&&o!==view.group&&o!==tweeterRays?.group),collisions=findMonitorCollisions(monitorViews,objects,doc.room,(doc.roomMesh||doc.roomShape)?view.surfaces:null);for(const object of objects)tintCollision(object,collisions.targets.has(object));for(const surface of view.surfaces){const active=collisions.surfaces.has(surface.name);tintCollision(surface,active);if(!active)surface.material.emissive.setHex(surface===selected?0x17483e:0);}host.dataset.collisionSurfaces=[...collisions.surfaces].sort().join(',');host.dataset.collisionObjects=[...collisions.targets].map(o=>o.userData.recordId??o.userData.id??o.name).sort().join(',');}

function refreshReflections(){if(reflectionView){scene.remove(reflectionView.group);reflectionView.dispose();}reflectionView=createReflectionView(monitorViews,listenerViews[0],doc.room,doc.reflections,view.surfaces);scene.add(reflectionView.group);host.dataset.reflectionCount=reflectionView.paths.length;reflectionPanel?.sync(reflectionView.paths.length);}

function refreshTweeterRays(){if(tweeterRays){scene.remove(tweeterRays.group);tweeterRays.dispose();}tweeterRays=createTweeterRays(monitorViews,listenerViews[0],doc.room,doc.showTweeterRays,(doc.roomMesh||doc.roomShape)?view.surfaces:null);scene.add(tweeterRays.group);host.dataset.tweeterRayCount=tweeterRays.rayCount;host.dataset.tweeterHeadHits=tweeterRays.hitCount;$('tweeter-rays-visible').checked=doc.showTweeterRays;refreshReflections();refreshCollisions();refreshObjectSelection();}

function refreshListeners(){for(const listener of listenerViews){scene.remove(listener.group);listener.dispose();}listenerViews=[];if(!doc.objects.some(o=>o.type==='seated-listener'))doc.objects.push(createListenerRecord(doc.room));for(const record of doc.objects.filter(o=>o.type==='seated-listener')){const listener=createSeatedListener(record);applyObjectTransform(listener.group,doc.transforms);scene.add(listener.group);listenerViews.push(listener);}listenerPanel?.sync(listenerViews[0]?.getEarHeight());refreshTweeterRays();}

function refreshMonitors(){for(const monitor of monitorViews){scene.remove(monitor.group);monitor.dispose();}monitorViews=doc.objects.filter(o=>o.type==='studio-monitor').map(record=>{const monitor=createStudioMonitor(record);applyObjectTransform(monitor.group,doc.transforms);scene.add(monitor.group);return monitor;});host.dataset.monitorCount=monitorViews.length;monitorPanel?.sync();refreshTweeterRays();}

function refreshRacks(){for(const rack of rackViews){scene.remove(rack.group);rack.dispose();}rackViews=doc.objects.filter(o=>o.type==='studio-rack').map(record=>{const rack=createRackView(record);applyObjectTransform(rack.group,doc.transforms);scene.add(rack.group);return rack;});host.dataset.rackCount=rackViews.length;if(rackAddButton)rackAddButton.hidden=!!rackViews.length;refreshCollisions();refreshObjectSelection();}

function buildRoom(transforms=doc.transforms){
 const roomView=doc.roomMesh?createMeshRoom(doc.room,doc.roomMesh):doc.roomShape?createFootprintRoom(doc.room,doc.roomShape,doc.roomFeatures):createRoom(doc.room,doc.roomFeatures,transforms);
 if(doc.roomMesh)addNicheStepToMeshRoom(roomView,doc.roomFeatures.window.stepHeight,doc.roomFeatures.window.stepDepth);
 const floor=doc.roomMesh?.faces.find(face=>face.id==='floor');
 const footprint=floor?floor.indices.map(index=>doc.roomMesh.vertices[index]):doc.roomShape??initialFootprint({...doc,transforms});
 const baseboards=createBaseboards(footprint,doc.room,doc.roomFeatures.door,transforms.door?.x??0);
 roomView.group.add(baseboards.group);
 const dispose=roomView.dispose;roomView.dispose=()=>{dispose();baseboards.dispose();};
 return roomView;
}

 function rebuild(preserveView=false){const surfaceName=selected?.name??projection?.surfaceName;bench?.refresh(history);if(view){scene.remove(view.group);view.dispose();}view=buildRoom();host.dataset.baseboardCount=view.group.getObjectByName('baseboards')?.children.length??0;host.dataset.meshVertexCount=(doc.roomMesh??initialRoomMesh(doc)).vertices.length;host.dataset.shapeGridVertices=view.grid.geometry?.attributes.position.count??0;host.dataset.shapeVertexCount=doc.roomShape?.length??initialFootprint(doc).length;scene.add(view.group);for(const item of featureViews){scene.remove(item.group);item.dispose();}featureViews=createRoomFeatureViews(doc.room,doc.roomFeatures);for(const item of featureViews){applyObjectTransform(item.group,doc.transforms);if(item.group.name==='window'&&view.surfaces.some(surface=>surface.name==='niche-back'||surface.name==='niche-roof')){for(const part of item.group.children){part.visible=false;part.userData.collision=false;}}scene.add(item.group);}host.dataset.featureCount=featureViews.length;featuresPanel?.sync();for(const input of document.querySelectorAll('[id^=feature-window-]'))input.disabled=!!doc.roomShape;surfacePanel?.sync(selected);refreshRacks();refreshListeners();refreshMonitors();select(null);const r=doc.room,m=doc.roomShape?{area:footprintArea(doc.roomShape),volume:footprintArea(doc.roomShape)*r.height}:roomMetrics(r);$('size').textContent=`${format(r.width*100)} × ${format(r.length*100)} × ${format(r.height*100)} cm`;$('metrics').textContent=`Powierzchnia: ${format(m.area,3)} m² · Objętość: ${format(m.volume,3)} m³`;
 if(!preserveView)frame();else{select(view.surfaces.find(s=>s.name===surfaceName)??null);if(projection){for(const o of view.group.children)o.visible=o===selected||(o.name==='floor-outline'&&selected?.name==='floor')||(o===view.grid&&selected?.name==='floor'&&$('grid').checked);$('cutaway').disabled=true;}resize();}}

function applySnapshot(snapshot){listenerPanel?.abort();const roomChanged=JSON.stringify(doc.roomMesh)!==JSON.stringify(snapshot.roomMesh)||JSON.stringify(doc.roomShape)!==JSON.stringify(snapshot.roomShape)||JSON.stringify(doc.room)!==JSON.stringify(snapshot.room)||JSON.stringify(doc.roomFeatures)!==JSON.stringify(snapshot.roomFeatures)||JSON.stringify(doc.transforms)!==JSON.stringify(snapshot.transforms);Object.assign(doc,snapshot);for(const key of ['width','length','height'])$(key).value=doc.room[key]*100;if(roomChanged)rebuild(true);else {refreshRacks();refreshListeners();refreshMonitors();}featuresPanel?.sync();objectPanel?.sync();refreshMeasurement();viewportEditor?.sync(true);fieldHistory?.restore();bench?.refresh(history);}

$('dimensions').addEventListener('submit',e=>{e.preventDefault();try{const nextRoom=roomFromCentimeters($('width').value,$('length').value,$('height').value),defaultListeningLayout=usesDefaultListeningLayout(doc);normalizeRoomFeatures(doc.roomFeatures,nextRoom);if(doc.roomShape)doc.roomShape=doc.roomShape.map(p=>({x:p.x*nextRoom.width/doc.room.width,z:p.z*nextRoom.length/doc.room.length}));if(doc.roomMesh)doc.roomMesh.vertices=doc.roomMesh.vertices.map(p=>({x:p.x*nextRoom.width/doc.room.width,y:p.y*nextRoom.height/doc.room.height,z:p.z*nextRoom.length/doc.room.length}));moveDefaultRackWithRoom(doc,nextRoom);doc.room=nextRoom;if(defaultListeningLayout)placeDefaultListeningLayout(doc);history.push(doc);rebuild();$('error').hidden=true;}catch(error){$('error').textContent=error.message;$('error').hidden=false;}});

$('grid').addEventListener('change',()=>view.grid.visible=$('grid').checked&&(!projection||selected?.name==='floor'));

$('perspective').onclick=()=>frame();$('top').onclick=()=>frame(true);$('inside').onclick=()=>project('inside');$('outside').onclick=()=>project('outside');$('return-3d').onclick=()=>frame();

function restore(room){doc.room={...room};for(const key of ['width','length','height'])$(key).value=room[key]*100;rebuild();fieldHistory?.reset();}

$('reset').onclick=()=>{doc.room={...DEFAULT_ROOM};doc.roomShape=null;doc.roomMesh=null;doc.roomFeatures=defaultRoomFeatures(doc.room);history.push(doc);restore(DEFAULT_ROOM);};

const raycaster=new THREE.Raycaster();let down;

renderer.domElement.addEventListener('pointerdown',e=>{controls.mouseButtons.LEFT=e.shiftKey&&!e.ctrlKey?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE;down={x:e.clientX,y:e.clientY,id:e.pointerId,button:e.button};},true);

renderer.domElement.addEventListener('pointerup',e=>{if(!down||down.id!==e.pointerId||down.button!==0||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5){down=null;return;}down=null;if(edgeOnly(e))return;if(e.altKey){const surface=pickSurface(e);if(surface){clearMeasurement();selectObject(null);select(surface);viewportEditor.pick(surface);}return;}const {target,object}=pickScene(e);if(!target){clearMeasurement();viewportEditor.clear();selectObject(null);select(null);return;}if(e.ctrlKey){const first=selectedObjectId?findEntity(selectedObjectId):selected;if(first&&target&&first!==target){measurement={first:entityKey(first),second:entityKey(target)};refreshMeasurement();}return;}clearMeasurement();if(object){viewportEditor.clear();selectObject(object);if(!projection)select(null);}else if(!projection){viewportEditor.clear();select(null);}});

function pickScene(e){const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const groups=projection?[]:selectableGroups();const hits=raycaster.intersectObjects([...groups,...view.surfaces.filter(s=>s.visible)],true).filter(hit=>{let o=hit.object;while(o){if(!o.visible)return false;o=o.parent;}return !hit.object.name.startsWith('center-')&&!hit.object.name.startsWith('cross-');});const hit=hits[0];let object=hit?.object;while(object&&!groups.includes(object))object=object.parent;const target=object??(view.surfaces.includes(hit?.object)?hit.object:null);return {target,object,hit};}
function pickSurface(e){const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);return raycaster.intersectObjects(view.surfaces.filter(surface=>surface.visible),false)[0]?.object??null;}
renderer.domElement.addEventListener('dblclick',e=>{if(e.button!==0||e.shiftKey||e.ctrlKey||e.altKey||edgeOnly(e))return;const {target}=pickScene(e);if(!view.surfaces.includes(target))return;e.preventDefault();clearMeasurement();selectObject(null);if(previousSurfaceView&&projection?.surfaceName===target.name){const saved=previousSurfaceView;previousSurfaceView=null;projection=saved.projection;camera=saved.camera;camera.position.copy(saved.position);camera.quaternion.copy(saved.quaternion);camera.up.copy(saved.up);camera.zoom=saved.zoom;camera.updateProjectionMatrix();bindControls(saved.target);select(view.surfaces.find(s=>s.name===saved.surfaceName)??null);viewportEditor.clear();if(projection){select(view.surfaces.find(s=>s.name===projection.surfaceName)??null);for(const o of view.group.children)o.visible=o===selected||(o.name==='floor-outline'&&selected?.name==='floor')||(o===view.grid&&selected?.name==='floor'&&$('grid').checked);}else{view.group.children.forEach(o=>o.visible=true);view.grid.visible=$('grid').checked;}$('cutaway').disabled=!!projection;updateProjectionVisibility();resize();return;}if(!previousSurfaceView)previousSurfaceView={camera,position:camera.position.clone(),quaternion:camera.quaternion.clone(),up:camera.up.clone(),zoom:camera.zoom,target:controls.target.clone(),projection,surfaceName:selected?.name};select(target);viewportEditor.pick(target);project('inside');});
renderer.domElement.addEventListener('pointercancel',()=>down=null);

async function saveDocument(){try{const text=JSON.stringify(doc,null,2);if(window.desktop){const name=await window.desktop.save(text);if(name)$('file-status').textContent=name;}else{const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='pokoj.akustyka.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}catch(error){showError(error);}}

function showError(error){$('error').hidden=false;$('error').textContent=error.message;}

function loadDocument(text,name){const data=parseRoomDocument(text);Object.assign(doc,data);history.reset(doc);restore(doc.room);$('file-status').textContent=name;$('error').hidden=true;}

async function openDocument(){try{if(window.desktop){const result=await window.desktop.open();if(result)loadDocument(result.text,result.name);}else{const input=document.createElement('input');input.type='file';input.accept='.json';input.onchange=async()=>{try{if(input.files[0].size>1024*1024)throw new Error('Plik jest zbyt duży.');loadDocument(await input.files[0].text(),input.files[0].name);}catch(error){showError(error);}};input.click();}}catch(error){showError(error);}}

bench=setupBench({new(){Object.assign(doc,createDocument());history.reset(doc);restore(doc.room);$('file-status').textContent='Nowy pokój';$('error').hidden=true;},open:openDocument,save:saveDocument,exit:()=>window.desktop?.exit(),undo:()=>{fieldHistory?.flush();applySnapshot(history.undo());},redo:()=>{fieldHistory?.flush();applySnapshot(history.redo());},three:()=>frame(),top:()=>frame(true)});

listenerPanel=setupListenerPanel({read:()=>doc.objects.find(o=>o.type==='seated-listener'),preview(patch){try{const record=doc.objects.find(o=>o.type==='seated-listener');Object.assign(record,patchListener(record,patch));refreshListeners();$('error').hidden=true;}catch(error){showError(error);listenerPanel.sync(listenerViews[0]?.getEarHeight());}},commit(){history.push(doc);bench.refresh(history);},cancel(start){Object.assign(doc.objects.find(o=>o.type==='seated-listener'),start);refreshListeners();}});

monitorPanel=setupMonitorPanel({read:()=>doc.objects.filter(o=>o.type==='studio-monitor'),readLinks:()=>doc.monitorLinks,readSideDistance:id=>monitorSideDistance(doc,id),change(id,patch,links=doc.monitorLinks,force=[]){Object.assign(doc,updateLinkedMonitor(doc,id,patch,links,force));history.push(doc);refreshMonitors();bench.refresh(history);$('error').hidden=true;},changeSideDistance(id,distance){Object.assign(doc,moveMonitorAlongSide(doc,id,distance));history.push(doc);refreshMonitors();bench.refresh(history);$('error').hidden=true;},add(){doc.objects.push(...createMonitorPair(doc.room,doc.objects.find(o=>o.type==='seated-listener')??createListenerRecord(doc.room)));doc.monitorLinks={...DEFAULT_MONITOR_LINKS};history.push(doc);refreshMonitors();bench.refresh(history);},showError});

$('tweeter-rays-visible').onchange=()=>{doc.showTweeterRays=$('tweeter-rays-visible').checked;history.push(doc);refreshTweeterRays();bench.refresh(history);};

reflectionPanel=setupReflectionPanel({read:()=>doc.reflections,change(settings){doc.reflections=normalizeReflectionSettings(settings);history.push(doc);refreshReflections();bench.refresh(history);}});

featuresPanel=setupFeaturesPanel({read:()=>doc.roomFeatures,change(features){doc.roomFeatures=normalizeRoomFeatures(features,doc.room);history.push(doc);rebuild();$('error').hidden=true;},showError});

function commitObjectTransform(id,transform,recordHistory=true){doc.transforms=updateObjectTransform(doc,id,transform);if(recordHistory)history.push(doc);const savedCamera=camera.position.clone(),savedTarget=controls.target.clone(),wasProjection=projection,oldSurface=selected?.name;rebuild();if(oldSurface)select(view.surfaces.find(s=>s.name===oldSurface));if(wasProjection&&oldSurface)project(wasProjection.side??'inside');else{camera.position.copy(savedCamera);controls.target.copy(savedTarget);controls.update();}refreshObjectSelection();$('error').hidden=true;}

objectPanel=setupObjectPanel({read:()=>selectedObjectId?{label:objectLabel(selectedObjectId),transform:doc.transforms[selectedObjectId]}:null,change(transform){if(selectedObjectId)commitObjectTransform(selectedObjectId,transform);},clear:()=>selectObject(null),showError});
rackAddButton=document.createElement('button');rackAddButton.type='button';rackAddButton.textContent='Dodaj stojak RIVECO 19″ 15U';rackAddButton.hidden=doc.objects.some(o=>o.id==='rack-15u');rackAddButton.onclick=()=>{ensureRackRecord(doc);history.push(doc);refreshRacks();bench.refresh(history);};$('object-panel').append(rackAddButton);

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

rebuild();fieldHistory=setupFieldHistory({history,read:()=>doc,editor:viewportEditor,context:()=>({object:selectedObjectId,monitor:$('monitor-select').value})});renderer.setAnimationLoop(()=>{controls.update();updateProjectionVisibility();if(!projection)view.updateVisibility(camera,$('cutaway').checked);if(reflectionView)for(const o of reflectionView.group.children)o.visible=!projection||(o.userData.surface===projection.surfaceName&&o.name!=='reflection-path');viewportEditor?.render();orientation.update(camera);renderer.render(scene,camera);});











