import * as THREE from 'three';
import {WALL_PAINT_COLOR} from './wall-paint.js';
import {addRectaDoorHardware} from './recta-handle.js';
const DEFAULT_SWITCH_HEIGHT=.112;
function defaultSwitchBottom(room){const doorTop=room.height-.505-.058,handleY=doorTop-.923;return handleY+.1-DEFAULT_SWITCH_HEIGHT/2;}
export function defaultRoomFeatures(room){return {
 door:{center:(room.width-1.506+0.028)/2,width:room.width-1.506-0.028,height:room.height-0.505,depth:0.015,jambLeft:0.061,jambRight:0.061,lintel:0.058},
 window:{center:room.width*(1.072/2.477),width:Math.min(1.038,room.width*0.44),bottom:0,height:room.height-0.385,depth:0.151,stepDepth:0.065,stepHeight:0.08},
 radiator:{center:room.width-0.144-0.603/2,width:0.603,bottom:0.147,height:0.60,depth:0.10,standoff:0.03},
 switch:{center:1.364,width:0.112,bottom:defaultSwitchBottom(room),height:DEFAULT_SWITCH_HEIGHT,depth:0.012}
};}
export function normalizeRoomFeatures(input,room,{migrateDefaultNiche=true}={}){
 const features=structuredClone(input??defaultRoomFeatures(room));
 // Documents saved before the measured niche correction had a depth of 8.6 cm.
 // Preserve custom geometry; migrate the untouched default to the full 15.1 cm.
 const w=features.window;
 if(w&&!Number.isFinite(w.stepDepth)&&!Number.isFinite(w.stepHeight)){
  if(migrateDefaultNiche&&Math.abs(w.depth-.086)<1e-9)w.depth=.151;
  if(migrateDefaultNiche&&Math.abs(w.height-room.height)<1e-9)w.height=room.height-.385;
  w.stepDepth=Math.min(.065,Math.max(0,w.depth-.002));w.stepHeight=w.stepDepth>0?.08:0;
 }
 const d=features.door;
 if(d&&!Number.isFinite(d.jambLeft)&&!Number.isFinite(d.jambRight)&&!Number.isFinite(d.lintel)){
  const oldDefault=Math.abs(d.center-room.width*.25)<1e-9&&Math.abs(d.width-Math.min(.85,room.width*.4))<1e-9&&Math.abs(d.height-Math.min(2.05,room.height*.85))<1e-9&&Math.abs(d.depth-.12)<1e-9;
  if(oldDefault)Object.assign(d,defaultRoomFeatures(room).door);
  else{d.jambLeft=Math.min(.061,d.width*.1);d.jambRight=Math.min(.061,d.width*.1);d.lintel=Math.min(.058,d.height*.1);}
 }
 if(d){
  const measuredDoor=Math.abs(d.width-(room.width-1.506-.028))<1e-9&&Math.abs(d.center-(room.width-1.506+.028)/2)<1e-9;
  if(measuredDoor&&Math.abs(d.jambLeft-.028)<1e-9&&Math.abs(d.jambRight-.061)<1e-9)d.jambLeft=.061;
  if(measuredDoor&&Math.abs(d.jambLeft-.028)<1e-9&&Math.abs(d.jambRight-.028)<1e-9&&Math.abs(d.revealRight-.033)<1e-9){d.jambLeft=.061;d.jambRight=.061;}
  delete d.revealRight;
 }
 if(!features.switch)features.switch=defaultRoomFeatures(room).switch;
 else{const s=features.switch;if(Math.abs(s.center-1.364)<1e-9&&Math.abs(s.width-.112)<1e-9&&Math.abs(s.bottom-1.444)<1e-9&&Math.abs(s.height-.112)<1e-9&&Math.abs(s.depth-.012)<1e-9)s.bottom=defaultSwitchBottom(room);}
 const r=features.radiator;
 if(r){
  const oldDefault=Math.abs(r.center-room.width*.80)<1e-9&&Math.abs(r.width-Math.min(.45,room.width*.19))<1e-9&&Math.abs(r.bottom-.12)<1e-9&&Math.abs(r.height-Math.min(.65,room.height*.26))<1e-9&&Math.abs(r.depth-.12)<1e-9;
  if(oldDefault)Object.assign(r,defaultRoomFeatures(room).radiator);
  else if(!Number.isFinite(r.standoff))r.standoff=.03;
 }

 for(const [name,f] of Object.entries(features)){
  if(!['door','window','radiator','switch'].includes(name)||!f||Object.values(f).some(v=>!Number.isFinite(v)))throw new Error('Nieprawidłowe wymiary elementów pokoju.');
  const required=name==='door'?['center','width','height','depth','jambLeft','jambRight','lintel']:name==='window'?['center','width','height','depth','bottom','stepDepth','stepHeight']:name==='radiator'?['center','width','height','depth','bottom','standoff']:['center','width','height','depth','bottom'];if(required.some(key=>!Number.isFinite(f[key])))throw new Error('Brak wymiaru elementu: '+name);
  const bottom=f.bottom??0;
  if(f.width<=0||f.height<=0||f.depth<=0||f.depth>0.6||f.center-f.width/2<0||f.center+f.width/2>room.width||bottom<0||bottom+f.height>room.height)throw new Error('Element nie mieści się na ścianie: '+name);
  if(name==='window'&&(f.stepDepth<0||f.stepDepth>=f.depth||f.stepHeight<0||f.stepHeight>=f.height||(f.stepDepth===0)!==(f.stepHeight===0)))throw new Error('Schodek musi mieścić się we wnęce.');
  if(name==='door'&&(f.jambLeft<=0||f.jambRight<=0||f.jambLeft+f.jambRight>=f.width||f.lintel<=0||f.lintel>=f.height))throw new Error('Nieprawidłowe wymiary framugi.');
  if(name==='radiator'&&(f.standoff<0||f.standoff>0.3||f.depth<0.01))throw new Error('Nieprawidłowy odstęp lub grubość grzejnika.');
 }
 if(!features.door||!features.window||!features.radiator||!features.switch)throw new Error('Brak elementów pokoju.');
 return structuredClone(features);
}
export function createRoomFeatureViews(room,features){
 const result=[];
 function create(name){const group=new THREE.Group();group.name=name;group.userData.recordId=name;const materials=[];
  function mat(color,extra={}){const m=new THREE.MeshStandardMaterial({color,roughness:0.7,...extra});materials.push(m);return m;}
  function box(name,size,position,material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.name=name;mesh.position.set(...position);group.add(mesh);return mesh;}
  const item={group,dispose(){group.traverse(o=>o.geometry?.dispose());materials.forEach(m=>m.dispose());}};result.push(item);return {group,mat,box};
 }
 const d=features.door,D=create('door'),cashmere=D.mat(0xcdc3b9),trim=D.mat(0xd4cabe),panel=D.mat(0xc9bfb4),rail=D.mat(0xddd3c7),groove=D.mat(0xb9aea1),black=D.mat(0x151515,{metalness:.08,roughness:.82}),lockOpening=D.mat(0x030303,{roughness:1}),steel=D.mat(0xadb8b9,{metalness:.75,roughness:.25});
 const doorLeft=d.center-d.width/2,doorRight=d.center+d.width/2,openingWidth=d.width-d.jambLeft-d.jambRight;
 const leafWidth=Math.min(.844,openingWidth+.023),leafHeight=Math.min(2.03,d.height-d.lintel),leafBottom=d.height-d.lintel-leafHeight,leafFront=room.length-.038,panelWidth=leafWidth-.204;
 const leafShape=new THREE.Shape();leafShape.moveTo(-leafWidth/2,0);leafShape.lineTo(leafWidth/2,0);leafShape.lineTo(leafWidth/2,leafHeight);leafShape.lineTo(-leafWidth/2,leafHeight);leafShape.closePath();
 const leaf=new THREE.Mesh(new THREE.ExtrudeGeometry(leafShape,{depth:.038,bevelEnabled:false}),cashmere);leaf.name='door-leaf';leaf.position.set(d.center,leafBottom,leafFront);D.group.add(leaf);
 // VINCI 10 has solid recessed fields, framed by 102 mm side stiles and six
 // narrow horizontal rails. The same pattern is visible from both sides.
 const railOffsets=[.14,.47,.82,1.17,1.52,1.87].filter(fromTop=>fromTop<leafHeight-.06);
 const boundaries=[0,...railOffsets,leafHeight];
 for(const outward of [-1,1]){
  const faceZ=outward<0?leafFront:room.length;
  const at=depth=>faceZ+outward*depth;
  for(let i=0;i<boundaries.length-1;i++){
   const top=boundaries[i],bottom=boundaries[i+1],fieldHeight=bottom-top-.014;
   if(fieldHeight>0)D.box('door-recessed-panel',[panelWidth,fieldHeight,.001],[d.center,leafBottom+leafHeight-(top+bottom)/2,at(.0006)],panel);
  }
  for(const side of [-1,1])D.box('door-stile',[.102,leafHeight,.002],[d.center+side*(leafWidth/2-.051),leafBottom+leafHeight/2,at(.001)],trim);
  for(const fromTop of railOffsets){
   const y=leafBottom+leafHeight-fromTop;
   D.box('door-rail-groove',[panelWidth,.014,.001],[d.center,y,at(.0012)],groove);
   D.box('door-rail',[panelWidth,.009,.002],[d.center,y,at(.0023)],rail);
  }
 }
 D.box('door-jamb-left',[d.jambLeft,d.height,d.depth],[doorLeft+d.jambLeft/2,d.height/2,room.length-d.depth/2],trim);
 D.box('door-jamb-right',[d.jambRight,d.height,d.depth],[doorRight-d.jambRight/2,d.height/2,room.length-d.depth/2],trim);
 D.box('door-lintel',[d.width,d.lintel,d.depth],[d.center,d.height-d.lintel/2,room.length-d.depth/2],trim);
 // Looking at the back wall from inside the room, +X is screen-left.
 const handleX=d.center+leafWidth/2-.065,handleY=leafBottom+leafHeight-.923;
 addRectaDoorHardware(D.group,black,lockOpening,{x:handleX,y:handleY,doorFace:leafFront,outward:-1});
 addRectaDoorHardware(D.group,black,lockOpening,{x:handleX,y:handleY,doorFace:room.length,outward:1});
 for(const fromTop of [.252,1.042,1.774]){
  const y=leafBottom+leafHeight-fromTop,x=d.center-leafWidth/2-.002;
  D.box('door-hinge',[.016,.052,.02],[x,y,room.length-.023],steel);
  D.box('door-hinge-outside',[.016,.052,.02],[x,y,room.length+.01],steel);
 }
 const w=features.window,W=create('window'),reveal=W.mat(WALL_PAINT_COLOR),stepMaterial=W.mat(WALL_PAINT_COLOR);
 const middle=w.bottom+w.height/2,hasStep=w.stepDepth>0&&w.stepHeight>0;
 for(const side of [-1,1]){
  const x=w.center+side*(w.width/2-0.005);
  W.box('window-reveal-side',[0.01,w.height-(hasStep?w.stepHeight:0),w.depth],[x,w.bottom+(hasStep?w.stepHeight:0)+(w.height-(hasStep?w.stepHeight:0))/2,-w.depth/2],reveal);
  if(hasStep)W.box('window-reveal-side-lower',[0.01,w.stepHeight,w.depth-w.stepDepth],[x,w.bottom+w.stepHeight/2,-(w.depth-w.stepDepth)/2],reveal);
 }
 W.box('recess-back',[w.width,w.height-(hasStep?w.stepHeight:0),0.01],[w.center,w.bottom+(hasStep?w.stepHeight:0)+(w.height-(hasStep?w.stepHeight:0))/2,-w.depth-0.005],reveal);
 if(hasStep)W.box('niche-step',[w.width,w.stepHeight,w.stepDepth],[w.center,w.bottom+w.stepHeight/2,-w.depth+w.stepDepth/2],stepMaterial);
 W.box('niche-roof',[w.width,0.01,w.depth],[w.center,w.bottom+w.height+0.005,-w.depth/2],reveal).userData.collision=false;

 const r=features.radiator,R=create('radiator'),enamel=R.mat(0xe0e2dc),pipe=R.mat(0xbec5c1,{metalness:0.5});
 R.box('radiator-body',[r.width,r.height,r.depth-0.005],[r.center,r.bottom+r.height/2,r.standoff+(r.depth-0.005)/2],enamel);
 const ribs=Math.max(4,Math.round(r.width/0.04));for(let i=0;i<ribs;i++)R.box('radiator-rib',[0.012,r.height-0.06,0.008],[r.center-r.width/2+(i+0.5)*r.width/ribs,r.bottom+r.height/2,r.standoff+r.depth-0.004],pipe);
 for(const side of [-1,1]){
  const x=r.center+side*(r.width/2-0.095);
  for(const y of [r.bottom+0.13,r.bottom+r.height-0.13]){
   R.box('radiator-wall-plate',[0.055,0.075,0.012],[x,y,0.006],pipe);
   R.box('radiator-bracket',[0.025,0.028,r.standoff],[x,y,r.standoff/2],pipe);
   R.box('radiator-bracket-hook',[0.032,0.055,0.014],[x,y+0.02,r.standoff+0.007],pipe);
  }
 }
 const s=features.switch,S=create('switch'),plate=S.mat(0xe9e8df),toggle=S.mat(0xc7c6bb);
 S.box('switch-plate',[s.width,s.height,s.depth],[s.center,s.bottom+s.height/2,room.length-s.depth/2],plate);
 S.box('switch-key',[s.width*.58,s.height*.58,0.003],[s.center,s.bottom+s.height/2,room.length-s.depth-0.0015],toggle);
 const L=create('ceiling-light'),housing=L.mat(0xe9ebea,{side:THREE.DoubleSide}),diffuser=L.mat(0xf7f8f5,{emissive:0xffffff,emissiveIntensity:0.8,toneMapped:false}),glow=L.mat(0xe0f8f3,{emissive:0xa8e9ed,emissiveIntensity:0.85,side:THREE.DoubleSide});
 function lampPart(name,geometry,material,y){const part=new THREE.Mesh(geometry,material);part.name=name;part.position.set(room.width/2,y,room.length/2);L.group.add(part);return part;}
 // The 36 cm illuminated collar touches the ceiling. Below it, the 38 cm
 // opaque collar surrounds a flat, luminous disk flush with its underside.
 lampPart('govee-h60a6-glow-ring',new THREE.CylinderGeometry(.18,.18,.015,64,1,true),glow,room.height-.0075);
 lampPart('govee-h60a6-body',new THREE.CylinderGeometry(.19,.19,.045,64,1,true),housing,room.height-.0375);
 lampPart('govee-h60a6-body-rim',new THREE.RingGeometry(.17,.19,64),housing,room.height-.06).rotation.x=Math.PI/2;
 lampPart('govee-h60a6-diffuser',new THREE.CylinderGeometry(.17,.17,.002,64),diffuser,room.height-.059);
 for(const [item,pivot] of [[result[0],[d.center,0,room.length]],[result[1],[w.center,w.bottom,0]],[result[2],[r.center,r.bottom,0]],[result[3],[s.center,s.bottom,room.length]],[result[4],[room.width/2,room.height,room.length/2]]]){const origin=new THREE.Vector3(...pivot);for(const child of item.group.children)child.position.sub(origin);item.group.position.copy(origin);item.group.updateMatrixWorld(true);}
 return result;
}
