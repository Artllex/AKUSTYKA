import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {COMBODESK_88} from './desk-model.js';
import {MODUL_DESK_ID,MODUL_STUDIO_DESK} from './modul-desk-model.js';
import {RACK_15U} from './rack-model.js';

// Manufacturer dimensions in metres. The MOTU's depth is the 7-inch chassis.
export const MOTU_24AI=Object.freeze({width:.4826,depth:.1778,height:.04445});
export const MONICON_XL=Object.freeze({width:.254,depth:.215,height:.084});
export const PROART_P16=Object.freeze({width:.3549,depth:.2469,baseHeight:.0183,screenHeight:.224});

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
 const cylinder=(name,radius,height,material,x,y,z,parent=group)=>{
  const geometry=new THREE.CylinderGeometry(radius,radius,height,24),item=new THREE.Mesh(geometry,material);item.name=name;item.position.set(x,y,z);parent.add(item);geometries.push(geometry);return item;
 };
 const label=(name,text,w,h,background,foreground,x,y,z,parent=group,rotationX=0)=>{
  if(typeof document==='undefined')return;
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,512,128);
  ctx.fillStyle=foreground;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 58px Arial';ctx.fillText(text,256,64);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
  const geometry=new THREE.PlaneGeometry(w,h),material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
  const item=new THREE.Mesh(geometry,material);item.name=name;item.position.set(x,y,z);item.rotation.x=rotationX;parent.add(item);geometries.push(geometry);materials.push(material);
 };
 const image=(name,canvas,w,h,x,y,z,parent=group)=>{
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
  const geometry=new THREE.PlaneGeometry(w,h),material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
  const item=new THREE.Mesh(geometry,material);item.name=name;item.position.set(x,y,z);parent.add(item);geometries.push(geometry);materials.push(material);
 };
 return {group,mat,box,round,cylinder,label,image,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
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
 return {top,laptop:{x:-.49,z:.10},monicon:{x:.49,z:.10}};
}

export function createMoniconXL(desk){
 const b=builder('palmer-monicon-xl'),{group,mat,box,round,cylinder,label}=b;
 const body=mat(0x242628,.35,.63),panel=mat(0x343638,.28,.6),wood=mat(0x684321,.05,.78),dark=mat(0x101214,.22,.65),silver=mat(0xb5b9b5,.54,.38),yellow=mat(0xffbc38),red=mat(0xdf6255),green=mat(0x6ccc80);
 const p=deskPeripheralPlacement(desk);group.position.set(p.monicon.x,p.top,p.monicon.z);
 round('console-body',MONICON_XL.width,.039,MONICON_XL.depth,.006,body,0,.020,0);
 for(const side of [-1,1])round('wood-side-cheek',.008,.052,MONICON_XL.depth,.003,wood,side*(MONICON_XL.width/2-.004),.027,0);
 const controls=new THREE.Group();controls.name='sloped-control-panel';controls.position.y=.057;controls.rotation.x=.18;group.add(controls);
 round('angled-control-surface',.237,.006,.197,.003,panel,0,0,0,controls);
 label('palmer-brand','PALMER',.052,.011,'#343638','#eff1e8',-.088,.0035,-.080,controls,-Math.PI/2);
 label('monicon-name','MONICON XL',.081,.011,'#343638','#eff1e8',.067,.0035,-.080,controls,-Math.PI/2);
 // Two banks of source and output selectors, metering, then the main controls.
 for(const side of [-1,1])for(let i=0;i<3;i++){
  const x=side*(.029+i*.026),z=-.052;
  round('source-output-key',.017,.005,.013,.002,i===0?yellow:dark,x,.006,z,controls);
 }
 box('correlation-meter',.061,.003,.015,dark,0,.004,-.025,controls);
 for(let i=0;i<11;i++)box('meter-led',.0023,.001,.004,i<4?green:i<8?yellow:red,-.024+i*.0048,.006,-.025,controls);
 for(const x of [-.083,.083])for(let i=0;i<3;i++)round('control-key',.021,.004,.014,.002,i===2?red:dark,x,.006,-.008+i*.022,controls);
 for(const x of [-.083,.083])cylinder('headphone-level',.010,.009,dark,x,.012,.063,controls);
 cylinder('main-volume-knob',.031,.016,dark,0,.015,.053,controls);
 cylinder('volume-cap',.022,.001,silver,0,.024,.053,controls);
 for(const x of [-.034,.034])round('mono-dim-key',.016,.004,.014,.002,dark,x,.005,.016,controls);
 // Front headphone sockets are inset in the vertical lip.
 for(const x of [-.083,.083]){
  const socket=cylinder('headphone-socket',.006,.0015,dark,x,.019,MONICON_XL.depth/2+.001);socket.rotation.x=Math.PI/2;
 }
 group.userData.dimensions=MONICON_XL;
 return b;
}

export function createProArtP16(desk){
 const b=builder('asus-proart-p16-h7606wr'),{group,mat,box,round,cylinder,label,image}=b;
 const caseMat=mat(0x16191d,.34,.54),keys=mat(0x22272b,.08,.69),screenBlack=mat(0x080c10,.05,.36),silver=mat(0x697278,.5,.5);
 const p=deskPeripheralPlacement(desk);group.position.set(p.laptop.x,p.top,p.laptop.z);
 round('laptop-base',PROART_P16.width,PROART_P16.baseHeight,PROART_P16.depth,.004,caseMat,0,PROART_P16.baseHeight/2,0);
 box('keyboard-bed',.295,.0005,.105,keys,0,PROART_P16.baseHeight+.0003,-.038);
 for(let row=0;row<6;row++)for(let col=0;col<16;col++){
  const x=-.139+col*.0185,z=-.084+row*.0175;
  round('keyboard-key',.016,.0009,.014,.0004,caseMat,x,PROART_P16.baseHeight+.001,z);
 }
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
