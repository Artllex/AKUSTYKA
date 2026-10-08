import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {COMBODESK_88} from './desk-model.js';
import {MODUL_DESK_ID,MODUL_STUDIO_DESK} from './modul-desk-model.js';
import {RACK_15U} from './rack-model.js';

// Manufacturer dimensions in metres. The MOTU's depth is the 7-inch chassis.
export const MOTU_24AI=Object.freeze({width:.4826,depth:.1778,height:.04445});
export const MONICON_XL=Object.freeze({width:.254,depth:.215,height:.084});
export const PROART_P16=Object.freeze({width:.3549,depth:.2469,baseHeight:.0183,screenHeight:.224});
export const STREAM_DECK_XL=Object.freeze({width:.182,depth:.112,height:.034,keys:32});
export const GXT_144_REXX=Object.freeze({width:.072,depth:.121,height:.077});
export const MODEL_D=Object.freeze({width:.374,depth:.136,height:.090,rackHeight:3*.04445});
export const KOBOL_EXPANDER=Object.freeze({width:.424,depth:.136,height:.094,rackHeight:3*.04445});

function builder(name){
 const group=new THREE.Group();group.name=name;group.userData.collision=false;
 const geometries=[],materials=[],textures=[];
 const mat=(color,metalness=0,roughness=.65)=>{const item=new THREE.MeshStandardMaterial({color,metalness,roughness});materials.push(item);return item;};
 const box=(name,w,h,d,material,x=0,y=0,z=0,parent=group)=>{
  const geometry=new THREE.BoxGeometry(w,h,d),item=new THREE.Mesh(geometry,material);item.name=name;item.position.set(x,y,z);parent.add(item);geometries.push(geometry);return item;
 };
 const round=(name,w,h,d,r,material,x=0,y=0,z=0,parent=group)=>{
  const geometry=new RoundedBoxGeometry(w,h,d,3,r),item=new THREE.Mesh(geometry,material);item.name=name;item.position.set(x,y,z);parent.add(item);geometries.push(geometry);return item;
 };
 const repeatedRound=(name,w,h,d,r,material,positions,parent=group)=>{
  // One low-detail bevel and one draw call for a whole bank of tiny keys.
  const geometry=new RoundedBoxGeometry(w,h,d,1,r),item=new THREE.InstancedMesh(geometry,material,positions.length);
  const matrix=new THREE.Matrix4();
  positions.forEach((position,index)=>{
   item.setMatrixAt(index,matrix.makeTranslation(position.x,position.y,position.z));
   if(position.color!==undefined)item.setColorAt(index,new THREE.Color(position.color));
  });
  item.instanceMatrix.needsUpdate=true;
  if(item.instanceColor)item.instanceColor.needsUpdate=true;
  item.name=name;parent.add(item);geometries.push(geometry);return item;
 };
 const cylinder=(name,radius,height,material,x,y,z,parent=group)=>{
  const geometry=new THREE.CylinderGeometry(radius,radius,height,24),item=new THREE.Mesh(geometry,material);item.name=name;item.position.set(x,y,z);parent.add(item);geometries.push(geometry);return item;
 };
 const mesh=(name,geometry,material,x=0,y=0,z=0,parent=group)=>{
  const item=new THREE.Mesh(geometry,material);item.name=name;item.position.set(x,y,z);parent.add(item);geometries.push(geometry);return item;
 };
 const label=(name,text,w,h,background,foreground,x,y,z,parent=group,rotationX=0)=>{
  if(typeof document==='undefined')return;
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,512,128);
  ctx.fillStyle=foreground;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 58px Arial';ctx.fillText(text,256,64);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
  const geometry=new THREE.PlaneGeometry(w,h),material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
  const item=new THREE.Mesh(geometry,material);item.name=name;item.position.set(x,y,z);item.rotation.x=rotationX;parent.add(item);geometries.push(geometry);materials.push(material);return item;
 };
 const image=(name,canvas,w,h,x,y,z,parent=group)=>{
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
  const geometry=new THREE.PlaneGeometry(w,h),material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
  const item=new THREE.Mesh(geometry,material);item.name=name;item.position.set(x,y,z);parent.add(item);geometries.push(geometry);materials.push(material);
 };
 return {group,mat,box,round,repeatedRound,cylinder,mesh,label,image,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}

function moniconWedge(width){
 // Side silhouette: a short level rear shelf, a steep control bank and a
 // shallower front bank. Both end caps share this exact outline.
 const depth=MONICON_XL.depth/2,outline=[[-depth,.006],[depth,.006],[depth,.031],[-.012,.055],[-.078,.078],[-depth,.078]];
 const shape=new THREE.Shape();
 outline.forEach(([z,y],i)=>i?shape.lineTo(-z,y):shape.moveTo(-z,y));shape.closePath();
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:width,steps:1,bevelEnabled:false});
 geometry.rotateY(Math.PI/2);geometry.translate(-width/2,0,0);return geometry;
}

export function createMotu24Ai(rack){
 const b=builder('motu-24ai'),{group,mat,box,round,cylinder,label}=b;
 const shell=mat(0x171a1e,.55,.48),face=mat(0x252b31,.44,.48),black=mat(0x080c10,.1,.72),silver=mat(0x888e92,.6,.37),blue=mat(0x58bbed),led=mat(0x50c7a1);
 const y=.49,front=-RACK_15U.depth/2+.003+Math.tan(RACK_15U.leanDegrees*Math.PI/180)*(y-.06)-.003;
 group.position.set(0,y,front+MOTU_24AI.depth/2);
 round('motu-chassis',.435,.041,MOTU_24AI.depth,.004,shell);
 box('motu-front-panel',MOTU_24AI.width,MOTU_24AI.height,.003,face,0,0,-MOTU_24AI.depth/2);
 for(const x of [-.229,.229])for(const yy of [-.012,.012]){
  const screw=cylinder('rack-screw',.0027,.002,silver,x,yy,-MOTU_24AI.depth/2-.002);screw.rotation.x=Math.PI/2;
 }
 box('meter-glass',.235,.028,.001,black,-.013,0,-MOTU_24AI.depth/2-.002);
 for(let channel=0;channel<24;channel++){
  const x=-.123+channel*.0095;
  box('channel-meter',.0042,.005+(channel%5)*.002,.0005,channel%6===0?blue:led,x,-.008+(channel%5)*.001,-MOTU_24AI.depth/2-.0028);
 }
 label('motu-brand','MOTU',.064,.017,'#252b31','#d6d9d9',-.190,.002,-MOTU_24AI.depth/2-.0026);
 label('motu-model','24Ai',.046,.013,'#252b31','#d6d9d9',.144,.010,-MOTU_24AI.depth/2-.0026);
 for(let i=0;i<5;i++){
  const button=cylinder('front-menu-button',.0035,.002,silver,.13+i*.012,-.009,-MOTU_24AI.depth/2-.003);button.rotation.x=Math.PI/2;
 }
 box('rear-panel',.43,.037,.002,face,0,0,MOTU_24AI.depth/2);
 for(let i=0;i<3;i++){
  const x=-.15+i*.074;
  round('analog-db25',.046,.016,.002,.003,black,x,.004,MOTU_24AI.depth/2+.002);
  for(let pin=0;pin<13;pin++)box('db25-pin',.0011,.001,.0005,silver,x-.019+pin*.0031,.004,MOTU_24AI.depth/2+.0033);
 }
 for(let i=0;i<6;i++)box('adat-optical',.013,.012,.002,black,.078+(i%3)*.021,i<3?.006:-.009,MOTU_24AI.depth/2+.002);
 for(const x of [.155,.182]){
  const socket=cylinder('word-clock-bnc',.006,.003,silver,x,.006,MOTU_24AI.depth/2+.003);socket.rotation.x=Math.PI/2;
 }
 box('avb-ethernet',.014,.012,.003,black,.160,-.010,MOTU_24AI.depth/2+.002);
 box('usb-port',.011,.006,.002,black,.185,-.010,MOTU_24AI.depth/2+.002);
 group.userData.dimensions=MOTU_24AI;
 return b;
}

export function deskPeripheralPlacement(desk){
 const modul=desk.id===MODUL_DESK_ID;
 const top=modul?MODUL_STUDIO_DESK.height:COMBODESK_88.worktop.top;
 // Both worktops contain these footprints, even though B is shallower and narrower.
 return {top,laptop:{x:-.49,z:.10},monicon:{x:.49,z:.10},streamDeck:{x:-.145,z:.178},mouse:{x:.18,z:.177}};
}

// 3U rack ears align each module's front to the RIVECO's leaned rails.
function rackModule(name,dimensions,centerY){
 const b=builder(name),{group,mat,box,round,cylinder,label}=b;
 const front=-RACK_15U.depth/2+.003+Math.tan(RACK_15U.leanDegrees*Math.PI/180)*(centerY-.06)-.003;
 group.position.set(0,centerY,front+dimensions.depth/2);
 const shell=mat(0x17191b,.35,.62),panel=mat(0x292c2d,.28,.58),ear=mat(0x24282a,.55,.5),black=mat(0x090b0c,.2,.54),silver=mat(0xb8bab4,.55,.42),white=mat(0xd2d3cd);
 round('synth-chassis',dimensions.width,dimensions.height,dimensions.depth,.005,shell);
 box('synth-front-panel',dimensions.width,dimensions.rackHeight-.006,.003,panel,0,0,-dimensions.depth/2-.001);
 const faceZ=-dimensions.depth/2-.004;
 for(const side of [-1,1]){
  const earWidth=(.4826-dimensions.width)/2;
  box('3u-rack-ear',earWidth,dimensions.rackHeight-.006,.004,ear,side*(dimensions.width/2+earWidth/2),0,faceZ+.001);
  for(const y of [-dimensions.rackHeight/2+.013,dimensions.rackHeight/2-.013]){
   const screw=cylinder('rack-screw',.0032,.002,silver,side*.231,y,faceZ-.002);screw.rotation.x=Math.PI/2;
  }
 }
 const knob=(name,x,y,r=.006)=>{
  const item=cylinder(name,r,.006,black,x,y,faceZ-.006);item.rotation.x=Math.PI/2;
  const cap=cylinder(name+'-cap',r*.44,.0015,silver,x,y,faceZ-.009);cap.rotation.x=Math.PI/2;
 };
 const jack=(name,x,y)=>{
  const socket=cylinder(name,.0043,.0018,silver,x,y,faceZ-.004);socket.rotation.x=Math.PI/2;
  const hole=cylinder(name+'-hole',.0025,.002,black,x,y,faceZ-.006);hole.rotation.x=Math.PI/2;
 };
 group.userData.dimensions=dimensions;
 return {b,group,mat,box,round,cylinder,label,knob,jack,faceZ,white,black};
}

export function createBehringerModelD(){
 const r=rackModule('behringer-model-d',MODEL_D,.165);
 const {b,group,mat,box,label,knob,jack,faceZ}=r;
 const wood=mat(0x5c3924,.05,.8),line=mat(0x8e9290),red=mat(0xc34c3e);
 for(const side of [-1,1])box('wood-side-cheek',.006,MODEL_D.rackHeight-.014,.003,wood,side*(MODEL_D.width/2-.005),0,faceZ);
 for(const x of [-.112,-.033,.055,.128])box('section-divider',.0008,MODEL_D.rackHeight-.025,.001,line,x,0,faceZ-.002);
 label('model-d-name','MODEL D',.065,.013,'#292c2d','#ecece6',-.145,.051,faceZ-.002);
 label('behringer-brand','BEHRINGER',.067,.012,'#292c2d','#deded8',.139,.051,faceZ-.002);
 // Controllers, three oscillators, mixer, filter and two contour groups.
 for(const [x,ys] of [[-.151,[-.028,.004,.030]],[-.079,[-.031,.003,.030]],[-.046,[-.031,.003,.030]],[-.013,[-.031,.003,.030]],[.024,[-.031,.003,.030]],[.061,[-.031,.003,.030]],[.097,[-.031,.003,.030]],[.143,[-.031,.003,.030]]])for(const y of ys)knob('model-d-knob',x,y,y===.030?.007:.0053);
 for(const x of [-.105,-.095,.039,.050,.074])box('red-toggle',.003,.008,.004,red,x,-.047,faceZ-.006);
 for(const x of [-.160,-.144])jack('model-d-patch-jack',x,-.050);
 group.userData.rackUnits=3;
 return b;
}

export function createBehringerKobolExpander(){
 const r=rackModule('behringer-kobol-expander',KOBOL_EXPANDER,.315);
 const {b,group,mat,box,label,knob,jack,faceZ}=r;
 const line=mat(0xb5b4aa),orange=mat(0xe1a259),led=mat(0x80d177);
 label('kobol-name','KOBOL EXPANDER',.11,.013,'#292c2d','#deded8',-.145,.051,faceZ-.002);
 label('kobol-brand','BEHRINGER',.066,.011,'#292c2d','#deded8',.159,.051,faceZ-.002);
 for(const x of [-.148,-.065,.021,.105])box('kobol-section-line',.0008,.102,.001,line,x,-.008,faceZ-.002);
 // Two variable-wave oscillators, filter, dual envelopes and patch bay.
 for(const x of [-.174,-.138,-.102,-.061,-.024,.012,.053,.089]){
  knob('kobol-control-knob',x,.019,.006);
  knob('kobol-control-knob',x,-.019,.005);
 }
 for(let row=0;row<5;row++)for(let col=0;col<6;col++){
  jack('kobol-patch-jack',.119+col*.014,-.045+row*.019);
 }
 jack('kobol-patch-jack',.202,.031);
 for(const x of [-.174,-.061,.053])box('kobol-status-led',.003,.003,.001,x<0?orange:led,x,.047,faceZ-.002);
 group.userData.rackUnits=3;
 return b;
}

export function createStreamDeckXL(desk){
 const b=builder('elgato-stream-deck-xl'),{group,mat,round,repeatedRound,box,label}=b;
 const p=deskPeripheralPlacement(desk);group.position.set(p.streamDeck.x,p.top,p.streamDeck.z);
 const black=mat(0x101418,.18,.55),bezel=mat(0x242b30,.28,.45),screen=mat(0x131d24,.05,.35),foot=mat(0x303538,.35,.65);
 round('stream-deck-foot',.170,.007,.102,.004,foot,0,.004,0);
 // Magnetic stand raises the back of the 8 × 4 key surface.
 const face=new THREE.Group();face.name='stream-deck-angled-face';face.position.set(0,.033,0);face.rotation.x=.43;group.add(face);
 round('stream-deck-body',STREAM_DECK_XL.width,.012,STREAM_DECK_XL.depth,.005,black,0,0,0,face);
 round('stream-deck-glass',.174,.001,.104,.003,bezel,0,.007,0,face);
 const colors=[0x30718b,0xb34e61,0x4d86a0,0xc18a50,0x647cb6,0x4b9a7b,0xb1699a,0x5b95af];
 const keyPositions=[],iconPositions=[];
 for(let row=0;row<4;row++)for(let col=0;col<8;col++){
  const x=-.074+col*.0211,z=-.037+row*.0246;
  keyPositions.push({x,y:.008,z});
  iconPositions.push({x,y:.0092,z,color:colors[(row*3+col)%colors.length]});
 }
 repeatedRound('stream-deck-lcd-keys',.017,.002,.020,.0018,screen,keyPositions,face);
 repeatedRound('stream-deck-key-icons',.009,.0004,.009,.001,mat(0xffffff,.05,.42),iconPositions,face);
 label('stream-deck-brand','elgato',.050,.009,'#101418','#d9e5e8',0,.009,.052,face,-Math.PI/2);
 // Rear support remains behind the visible key face.
 box('stream-deck-stand',.130,.035,.006,foot,0,.018,-.038);
 group.userData.dimensions=STREAM_DECK_XL;
 return b;
}

export function createGxt144Rexx(desk){
 const b=builder('trust-gxt-144-rexx'),{group,mat,box,round,cylinder,label}=b;
 const p=deskPeripheralPlacement(desk);group.position.set(p.mouse.x,p.top,p.mouse.z);
 const shell=mat(0x171b20,.25,.54),grip=mat(0x242a30,.14,.73),button=mat(0x11151a,.22,.55),light=mat(0x36b7cc,.05,.4),wheel=mat(0x080a0d,.16,.72);
 round('mouse-sole',GXT_144_REXX.width,.008,GXT_144_REXX.depth,.005,shell,0,.005,0);
 // Ergonomic upright shell: the hand rests on a pitched right-side ridge.
 const body=round('vertical-mouse-shell',.060,.060,.108,.014,grip,-.001,.038,0);body.rotation.z=-.24;
 const upper=round('vertical-mouse-back',.035,.051,.080,.012,shell,-.018,.046,-.008);upper.rotation.z=-.22;
 round('thumb-rest',.030,.014,.066,.006,shell,.027,.019,.006);
 const left=round('left-click',.014,.004,.047,.002,button,-.021,.069,.026);left.rotation.z=-.30;
 const right=round('right-click',.014,.004,.047,.002,button,-.002,.073,.026);right.rotation.z=-.30;
 const scroll=cylinder('scroll-wheel',.006,.012,wheel,-.012,.078,.033);scroll.rotation.z=Math.PI/2;
 for(const z of [-.022,-.001])round('thumb-button',.003,.007,.013,.001,button,.031,.040,z);
 box('rgb-side-strip',.002,.002,.064,light,.034,.021,.003);
 label('rexx-brand','GXT',.024,.008,'#242a30','#bcc5ca',-.012,.069,-.025);
 group.userData.dimensions=GXT_144_REXX;
 return b;
}

export function createMoniconXL(desk){
 const b=builder('palmer-monicon-xl'),{group,mat,box,round,repeatedRound,cylinder,mesh,label}=b;
 const p=deskPeripheralPlacement(desk);group.position.set(p.monicon.x,p.top,p.monicon.z);
 const chassis=mat(0x282b2e,.32,.67),sideCap=mat(0x333638,.12,.91),upperMat=mat(0x17191c,.13,.74),lowerMat=mat(0x292c2f,.27,.62);
 const dark=mat(0x111316,.18,.55),silver=mat(0xaaaead,.57,.38),white=mat(0xe2e4df,.08,.45),orange=mat(0xe46c1d,.05,.5),black=mat(0x050607,.1,.66);
 mesh('formed-metal-chassis',moniconWedge(MONICON_XL.width-.016),chassis);
 for(const side of [-1,1]){
  mesh('textured-side-cap',moniconWedge(.008),sideCap,side*(MONICON_XL.width/2-.004));
  const outline=[[-MONICON_XL.depth/2,.078],[-.078,.078],[-.012,.055],[MONICON_XL.depth/2,.031]];
  const seam=new THREE.CurvePath();
  for(let i=1;i<outline.length;i++)seam.add(new THREE.LineCurve3(
   new THREE.Vector3(side*.119,outline[i-1][1],outline[i-1][0]),
   new THREE.Vector3(side*.119,outline[i][1],outline[i][0])
  ));
  mesh('orange-side-seam',new THREE.TubeGeometry(seam,24,.0011,5,false),orange);
  for(const [y,z] of [[.057,-.070],[.026,.070]]){
   const screw=cylinder('side-screw',.0015,.0008,dark,side*.1273,y,z);screw.rotation.z=Math.PI/2;
  }
 }
 for(const x of [-.101,.101])for(const z of [-.080,.080])round('rubber-foot',.018,.004,.014,.002,black,x,.004,z);

 // The branding sits on its own level rear shelf, behind the two slopes.
 round('rear-top-shelf',.230,.002,.029,.0015,upperMat,0,.079,-.093);
 label('monicon-name','monicon XL',.060,.009,'#17191c','#a3a6a5',-.074,.081,-.093,group,-Math.PI/2);
 label('palmer-brand','Palmer',.055,.010,'#17191c','#a3a6a5',.075,.081,-.093,group,-Math.PI/2);
 const upper=new THREE.Group();upper.name='upper-control-panel';upper.position.set(0,.0665,-.045);upper.rotation.x=Math.atan2(.023,.066);group.add(upper);
 const lower=new THREE.Group();lower.name='lower-control-panel';lower.position.set(0,.043,.045);lower.rotation.x=.208;group.add(lower);
 round('upper-face',.230,.002,.070,.0015,upperMat,0,.001,0,upper);
 round('lower-face',.230,.002,.114,.0015,lowerMat,0,.001,0,lower);

 const knob=(name,parent,x,z,r,h)=>{
  cylinder(name+'-ring',r*1.17,.0014,silver,x,.003,z,parent);
  cylinder(name,r,h,dark,x,.003+h/2,z,parent);
  box(name+'-orange-index',r*.30,.0006,.0012,orange,x+r*.41,.003+h+.0003,z-r*.28,parent);
 };
 knob('aux-input-level',upper,-.097,.008,.0065,.009);
 knob('cue-output-level',upper,.082,.026,.0065,.009);
 for(const [title,x,width] of [['INPUT SELECT',-.054,.034],['OUTPUT SELECT',.055,.037],['CUE SOURCE',.104,.031]]){
  label(`${title}-legend`,title,width,.005,'#17191c','#aeb1b0',x,.003,-.023,upper,-Math.PI/2);
  for(let i=0;i<3;i++){
   const z=-.003+i*.013;
   round('white-selector-key',.011,.004,.009,.0015,white,x,.005,z,upper);
   label('selector-caption',title==='OUTPUT SELECT'?`OUT ${i+1}`:`IN ${i+1}`,.009,.005,'#e2e4df','#222528',x,.0075,z,upper,-Math.PI/2);
  }
 }
 const meters=[];
 for(const x of [-.020,0,.020])for(let row=0;row<8;row++)meters.push({x,y:.003,z:-.005+row*.005});
 repeatedRound('three-channel-meter-leds',.005,.0007,.0022,.0003,white,meters,upper);
 for(const [title,x,width] of [['LEFT',-.020,.014],['CORRELATION',0,.023],['RIGHT',.020,.015]])label(`${title}-meter-label`,title,width,.004,'#17191c','#9b9e9d',x,.003,-.016,upper,-Math.PI/2);

 for(const [name,x] of [['headphone-one-level',-.098],['headphone-two-level',-.069],['attenuation-level',.070],['talk-level',.101]])knob(name,lower,x,-.019,.0065,.009);
 knob('main-volume-knob',lower,0,.009,.018,.013);
 label('main-volume-caption','MAIN',.031,.006,'#292c2f','#b8b9b5',0,.003,.037,lower,-Math.PI/2);
 for(const x of [-.098,-.069])round('black-pfl-key',.014,.004,.009,.0015,dark,x,.005,.036,lower);
 for(const [name,x] of [['MUTE',-.039],['MONO',.038],['DIM',.071],['TALK',.104]]){
  round('white-function-key',.018,.004,.013,.0018,white,x,.005,.039,lower);
  label(`${name}-caption`,name,.015,.007,'#e2e4df','#292c2f',x,.0075,.039,lower,-Math.PI/2);
 }

 // Two headphone outputs share one recessed plate in the front wall.
 round('front-headphone-recess',.061,.022,.001,.004,black,-.073,.019,MONICON_XL.depth/2+.0005);
 for(const x of [-.091,-.055]){
  mesh('front-headphone-rim',new THREE.TorusGeometry(.007,.0012,6,16),silver,x,.019,MONICON_XL.depth/2+.002);
  mesh('front-headphone-hole',new THREE.CircleGeometry(.0046,16),black,x,.019,MONICON_XL.depth/2+.0021);
 }

 // The rear panel has paired balanced connections plus auxiliary and power I/O.
 const back=-MONICON_XL.depth/2;
 round('rear-connector-panel',.228,.050,.001,.003,upperMat,0,.039,back-.0006);
 const rearSocket=(name,x,y,ring=silver)=>{
  const rim=mesh(name+'-rim',new THREE.TorusGeometry(.0051,.0011,6,14),ring,x,y,back-.002);rim.rotation.y=Math.PI;
  const hole=mesh(name+'-hole',new THREE.CircleGeometry(.0035,14),black,x,y,back-.0022);hole.rotation.y=Math.PI;
 };
 for(const x of [-.089,-.065,-.025,0,.025,.090,.113])for(const y of [.028,.050])rearSocket('balanced-rear-jack',x,y);
 rearSocket('aux-rca-left',.053,.049,white);rearSocket('aux-rca-right',.053,.028,orange);
 rearSocket('spdif-in',.072,.049);rearSocket('aux-in',.072,.028);
 round('rear-power-switch',.009,.018,.002,.001,dark,-.111,.044,back-.002);
 rearSocket('power-in',-.111,.024);
 for(const [title,x] of [['OUTPUTS',-.063],['MONITOR',0],['INPUTS',.101]]){
  const marking=label(`${title}-rear-label`,title,.050,.007,'#17191c','#adb1af',x,.066,back-.0015);
  if(marking)marking.rotation.y=Math.PI;
 }
 group.userData.dimensions=MONICON_XL;
 return b;
}

export function createProArtP16(desk){
 const b=builder('asus-proart-p16-h7606wr'),{group,mat,box,round,repeatedRound,cylinder,label,image}=b;
 const caseMat=mat(0x16191d,.34,.54),keys=mat(0x22272b,.08,.69),screenBlack=mat(0x080c10,.05,.36),silver=mat(0x697278,.5,.5);
 const p=deskPeripheralPlacement(desk);group.position.set(p.laptop.x,p.top,p.laptop.z);
 round('laptop-base',PROART_P16.width,PROART_P16.baseHeight,PROART_P16.depth,.004,caseMat,0,PROART_P16.baseHeight/2,0);
 box('keyboard-bed',.295,.0005,.105,keys,0,PROART_P16.baseHeight+.0003,-.038);
 const keyPositions=[];
 for(let row=0;row<6;row++)for(let col=0;col<16;col++){
  const x=-.139+col*.0185,z=-.084+row*.0175;
  keyPositions.push({x,y:PROART_P16.baseHeight+.001,z});
 }
 repeatedRound('keyboard-keys',.016,.0009,.014,.0004,caseMat,keyPositions);
 for(const side of [-1,1])for(let i=0;i<15;i++)box('speaker-grille',.0013,.0005,.004,keys,side*.162,PROART_P16.baseHeight+.0004,-.081+i*.007);
 round('trackpad',.107,.0005,.071,.003,keys,0,PROART_P16.baseHeight+.0003,.074);
 cylinder('asus-dialpad-mark',.009,.0005,silver,.044,PROART_P16.baseHeight+.0008,.052);
 const hinge=new THREE.Group();hinge.name='laptop-hinge';hinge.position.set(0,PROART_P16.baseHeight,-PROART_P16.depth/2+.006);hinge.rotation.x=-.25;group.add(hinge);
 round('display-lid',PROART_P16.width,PROART_P16.screenHeight,.008,.004,caseMat,0,PROART_P16.screenHeight/2,0,hinge);
 // Laptop display lies on the +Z face, toward the seated listener.
 box('oled-display',.342,.214,.0007,screenBlack,0,.112,.0045,hinge);
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=380;const ctx=canvas.getContext('2d');
  const background=ctx.createLinearGradient(0,0,640,380);background.addColorStop(0,'#0a162c');background.addColorStop(.58,'#183955');background.addColorStop(1,'#0a101e');ctx.fillStyle=background;ctx.fillRect(0,0,640,380);
  for(const [color,offset,width] of [['#203da1',-64,72],['#157db0',-18,59],['#df623a',75,49],['#f2ae52',126,23],['#a3273d',182,39]]){
   ctx.beginPath();ctx.moveTo(-60,305+offset);ctx.bezierCurveTo(175,300+offset,350,25+offset,700,-40+offset);
   ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();
  }
  ctx.fillStyle='#f7fafb';ctx.font='bold 36px Arial';ctx.fillText('ProArt',22,352);
  image('proart-oled-artwork',canvas,.336,.210,0,.112,.0057,hinge);
 }else box('display-wallpaper',.336,.210,.0008,mat(0x1c557b),0,.112,.005,hinge);
 cylinder('webcam',.0018,.001,screenBlack,0,.220,.005,hinge).rotation.x=Math.PI/2;
 label('proart-lid-brand','ProArt',.067,.015,'#16191d','#8e969a',0,.170,-.0045,hinge);
 group.userData.dimensions=PROART_P16;
 return b;
}
