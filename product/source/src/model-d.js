import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RACK_15U} from './rack-model.js';

// Dimensions of the desktop instrument; the rack shelf is a separate part.
export const MODEL_D=Object.freeze({width:.374,depth:.136,height:.090,rackHeight:3*.04445});

function wedge(width,frontTop,rearTop,bottom=-.044){
 const x=width/2,z=MODEL_D.depth/2;
 const p=[-x,bottom,-z,x,bottom,-z,x,bottom,z,-x,bottom,z,
          -x,frontTop,-z,x,frontTop,-z,x,rearTop,z,-x,rearTop,z];
 const faces=[0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,3,7,6,3,6,2,0,4,7,0,7,3,1,2,6,1,6,5];
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(faces);g.computeVertexNormals();return g;
}

function printPanel(){
 const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=680;
 const c=canvas.getContext('2d');c.fillStyle='#101114';c.fillRect(0,0,1800,680);
 c.strokeStyle='#87898a';c.lineWidth=3;c.strokeRect(18,16,1764,648);
 const groups=[['CONTROLLERS',18,330],['OSCILLATOR BANK',330,795],['MIXER',795,1160],['MODIFIERS',1160,1540],['OUTPUT',1540,1782]];
 c.font='bold 22px Arial';c.textBaseline='middle';
 for(const [title,left,right] of groups){c.strokeStyle='#55585a';c.strokeRect(left+7,25,right-left-14,625);c.fillStyle='#dedbd7';c.fillText(title,left+22,620);}
 c.font='14px Arial';c.fillStyle='#a7a8a6';
 const lines=[['MIDI IN',75,69],['MIDI THRU',172,69],['GLIDE',72,180],['MOD MIX',210,180],['RANGE',410,80],['WAVEFORM',590,80],['OSCILLATOR 1',405,219],['OSCILLATOR 2',405,359],['OSCILLATOR 3',405,501],['NOISE',846,99],['EXT IN',994,99],['OSC 1',835,222],['OSC 2',935,222],['OSC 3',1035,222],['FILTER',1218,80],['CONTOUR',1390,80],['CUT OFF',1210,218],['EMPHASIS',1390,218],['ATTACK',1210,401],['DECAY',1375,401],['VOLUME',1605,215],['PHONES',1620,530]];
 for(const [s,x,y] of lines)c.fillText(s,x,y);
 c.lineWidth=2;c.strokeStyle='#878884';
 for(const [x,y] of [[65,265],[200,265],[417,145],[557,145],[700,145],[418,302],[557,302],[700,302],[418,452],[557,452],[700,452],[850,280],[950,280],[1050,280],[1220,280],[1390,280],[1220,465],[1390,465],[1620,275],[1660,467]]){
  c.beginPath();c.arc(x,y,27,Math.PI*.18,Math.PI*1.82);c.stroke();
  for(let i=0;i<7;i++){const a=.18*Math.PI+i*1.64*Math.PI/6;c.beginPath();c.moveTo(x+31*Math.cos(a),y+31*Math.sin(a));c.lineTo(x+36*Math.cos(a),y+36*Math.sin(a));c.stroke();}
 }
 c.fillStyle='#eee';c.font='bold 58px Arial';c.fillText('D',1050,90);
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}

export function createBehringerModelD(){
 const group=new THREE.Group();group.name='behringer-model-d';group.userData.collision=false;group.userData.rackUnits=3;
 const geometries=[],materials=[],textures=[];
 const mat=(color,metalness=0,roughness=.68)=>{const m=new THREE.MeshStandardMaterial({color,metalness,roughness,side:THREE.DoubleSide});materials.push(m);return m;};
 const black=mat('#101114',.08,.7),edge=mat('#292b2e',.28,.5),wood=mat('#38232b',.04,.58),woodEdge=mat('#533840',.08,.46),metal=mat('#b7b8b4',.65,.31),ivory=mat('#e3dfd3',.12,.55),red=mat('#be2425',.05,.52),blue=mat('#2456a7',.08,.48),dark=mat('#08090b',.08,.74);
 const add=(name,g,m,parent=group,x=0,y=0,z=0)=>{const o=new THREE.Mesh(g,m);o.name=name;o.position.set(x,y,z);parent.add(o);geometries.push(g);return o;};
 const box=(name,w,h,d,m,x=0,y=0,z=0,parent=group)=>add(name,new THREE.BoxGeometry(w,h,d),m,parent,x,y,z);
 const round=(name,w,h,d,r,m,x=0,y=0,z=0,parent=group)=>add(name,new RoundedBoxGeometry(w,h,d,2,r),m,parent,x,y,z);
 const cyl=(name,r,h,m,x,y,z,parent=group)=>add(name,new THREE.CylinderGeometry(r,r,h,20),m,parent,x,y,z);
 const bank=(name,positions,r,h,m,parent=group)=>{const g=new THREE.CylinderGeometry(r,r,h,16),o=new THREE.InstancedMesh(g,m,positions.length),matrix=new THREE.Matrix4();positions.forEach(([x,z],i)=>o.setMatrixAt(i,matrix.makeTranslation(x,h/2+.003,z)));o.instanceMatrix.needsUpdate=true;o.name=name;parent.add(o);geometries.push(g);return o;};

 // The instrument is a continuous wedge, with a separate mahogany cheek on each end.
 add('model-d-formed-chassis',wedge(.354,-.021,.034),black);
 for(const side of [-1,1]){
  const cheek=add('model-d-wood-side',wedge(.009,-.019,.037),wood,group,side*.1825);
  cheek.userData.material='mahogany';
  const trim=box('model-d-wood-top-edge',.009,.002,.135,woodEdge,side*.1825,.008,0);
  trim.rotation.x=-Math.atan2(.055,.136);
  for(const z of [-.050,.050]){const screw=cyl('model-d-side-screw',.0015,.0005,metal,side*.187,z<0?-.032:.024,z);screw.rotation.z=Math.PI/2;}
 }
 box('synth-front-panel',MODEL_D.width,.013,.004,edge,0,-.037,-.068);
 box('model-d-rear-case',.354,.037,.004,edge,0,.013,.068);
 round('model-d-back-ridge',.345,.005,.005,.0015,edge,0,.035,.063);
 // The support tray is below the body. Its short outer tabs do not cover the control face.
 box('model-d-rack-shelf',.355,.0025,.122,edge,0,-.048,.001);
 box('model-d-rack-crossbar',.468,.003,.009,edge,0,-.048,.054);
 box('model-d-rack-front-crossbar',.468,.003,.009,edge,0,-.048,-.058);
 for(const side of [-1,1]){
  box('3u-rack-ear',.033,.020,.003,edge,side*.218,-.047,-.062);
  for(const y of [-.053,-.041]){const screw=cyl('model-d-rack-fastener',.0024,.0006,metal,side*.225,y,-.064);screw.rotation.x=Math.PI/2;}
 }

 // The control plane follows the true rising profile, rather than being a flat rack face.
 const plane=new THREE.Group();plane.name='model-d-sloped-control-panel';plane.position.y=.0065;plane.rotation.x=-Math.atan2(.055,.136);group.add(plane);
 box('model-d-control-plate',.352,.002,.144,black,0,0,0,plane);
 if(typeof document!=='undefined'){
  const tex=printPanel();textures.push(tex);
  const ink=new THREE.MeshBasicMaterial({map:tex,transparent:false,side:THREE.DoubleSide});materials.push(ink);
  const art=add('model-d-panel-print',new THREE.PlaneGeometry(.348,.139),ink,plane,0,.00125,0);
  art.rotation.x=-Math.PI/2;art.rotateZ(Math.PI);
 }
 const fromPrint=(px,py)=>[(px-900)/1800*.348,(py-340)/680*.139];
 const knobPixels=[[65,265],[200,265],[415,145],[555,145],[695,145],[415,302],[555,302],[695,302],[415,452],[555,452],[695,452],[850,280],[950,280],[1050,280],[1220,280],[1390,280],[1220,465],[1390,465],[1620,275],[1660,467],
  [110,385],[230,385],[440,560],[570,560],[700,560],[870,450],[990,450],[1100,450]];
 const knobs=knobPixels.map(([x,y])=>fromPrint(x,y));
 bank('model-d-knob-collars',knobs,.0053,.0008,metal,plane);
 bank('model-d-knobs',knobs,.0038,.007,dark,plane);
 // A bright index line on every physical knob, all batched in one draw call.
 const tickGeo=new THREE.BoxGeometry(.0007,.00035,.0025),ticks=new THREE.InstancedMesh(tickGeo,ivory,knobs.length),matrix=new THREE.Matrix4();
 knobs.forEach(([x,z],i)=>ticks.setMatrixAt(i,matrix.makeTranslation(x,.0104,z-.0022)));ticks.instanceMatrix.needsUpdate=true;ticks.name='model-d-knob-indexes';plane.add(ticks);geometries.push(tickGeo);
 const outputKnobs=[[1590,392],[1680,392],[1705,555]].map(([x,y])=>fromPrint(x,y));
 bank('model-d-output-collars',outputKnobs,.0045,.0008,metal,plane);
 bank('model-d-output-knobs',outputKnobs,.0032,.006,edge,plane);
 const switches=[[280,185,red],[321,324,blue],[785,179,red],[1130,184,blue],[1145,365,red],[1520,380,blue],[1725,175,red]];
 for(const [x,y,m] of switches){const [px,pz]=fromPrint(x,y);round('model-d-toggle',.006,.005,.009,.001,m,px,.004,pz,plane);}
 for(const [x,y] of [[105,95],[220,95],[1610,95],[1680,95]]){const [px,pz]=fromPrint(x,y);cyl('model-d-control-socket',.0038,.001,metal,px,.003,pz,plane);cyl('model-d-socket-bore',.0025,.0012,dark,px,.0037,pz,plane);}
 // Rear I/O is inset in the metal rear rail, not floating on the panel.
 for(const x of [.078,.108]){const outer=cyl('model-d-rear-output-rim',.0048,.001,metal,x,.012,.071);outer.rotation.x=Math.PI/2;const hole=cyl('model-d-rear-output-bore',.0032,.0011,dark,x,.012,.0717);hole.rotation.x=Math.PI/2;}
 box('model-d-rear-midi-port',.009,.008,.001,dark,.142,.012,.071);
 box('model-d-rear-power-port',.009,.008,.001,dark,.160,.012,.071);
 const centerY=.165,front=-RACK_15U.depth/2+.003+Math.tan(RACK_15U.leanDegrees*Math.PI/180)*(centerY-.06)-.003;
 group.position.set(0,centerY,front+MODEL_D.depth/2);
 group.updateMatrixWorld(true);
 return {group,dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}};
}
