import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RACK_15U} from './rack-model.js';
const modelDTopUrl=new URL('./assets/model-d-top.png',import.meta.url).href;

// Dimensions of the desktop instrument; the rack shelf is a separate part.
export const MODEL_D=Object.freeze({width:.374,depth:.136,height:.090,rackHeight:3*.04445});

function instrumentSide(width,rearTop=.037,frontTop=-.009){
 // Rear is on the left in profile: a slanted back corner, a short vertical
 // lower wall, an inset base and the rounded lower front of the wood cheek.
 const outline=new THREE.Shape();
 outline.moveTo(.011,rearTop);
 outline.quadraticCurveTo(.008,rearTop+.001,.007,rearTop-.004);
 outline.lineTo(0,.007);
 outline.quadraticCurveTo(-.001,.003,.002,0);
 outline.lineTo(.009,-.008);
 outline.quadraticCurveTo(.011,-.010,.011,-.014);
 outline.lineTo(.011,-.038);
 outline.quadraticCurveTo(.011,-.044,.018,-.044);
 outline.lineTo(.115,-.044);
 outline.quadraticCurveTo(.121,-.044,.124,-.038);
 outline.lineTo(.136,frontTop);
 outline.closePath();
 const geometry=new THREE.ExtrudeGeometry(outline,{depth:width,steps:1,bevelEnabled:false,curveSegments:5});
 geometry.rotateY(Math.PI/2);geometry.translate(-width/2,0,MODEL_D.depth/2);
 geometry.computeVertexNormals();return geometry;
}

function walnutTexture(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
 const c=canvas.getContext('2d');c.fillStyle='#624839';c.fillRect(0,0,512,256);
 let seed=719;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 for(let i=0;i<280;i++){
  const y=random()*256,drift=(random()-.5)*23;
  c.strokeStyle=random()>.5?'rgba(34,19,13,.13)':'rgba(227,186,138,.12)';c.lineWidth=.35+random()*1.5;
  c.beginPath();c.moveTo(0,y);c.bezierCurveTo(145,y+drift,330,y-drift*.4,512,y+drift*.25);c.stroke();
 }
 for(const [x,y,r] of [[338,181,22],[190,96,10]]){
  for(let k=0;k<9;k++){c.strokeStyle=`rgba(35,21,15,${.11-k*.009})`;c.lineWidth=1.4;c.beginPath();c.ellipse(x,y,r+k*5,5+k*2,-.12,0,Math.PI*2);c.stroke();}
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(1/.136,1/.085);texture.offset.set(0,.044/.085);texture.anisotropy=4;
 return texture;
}

function printPanel(){
 // Crop only the printed face from Behringer's orthographic product image:
 // https://cdn-media.empowertribe.com/b5cf761465654c73acd9834ae905a2e5/Image_BE_0718-AAC_MODEL-D_Top_XL.png
 // The wooden cheeks and protruding controls remain independent 3D geometry.
 const canvas=document.createElement('canvas');canvas.width=1915;canvas.height=710;
 const context=canvas.getContext('2d');context.fillStyle='#18191b';context.fillRect(0,0,canvas.width,canvas.height);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
 const image=new Image();image.onload=()=>{context.drawImage(image,42,0,1915,710,0,0,1915,710);texture.needsUpdate=true;window.dispatchEvent(new Event('model-d-texture-ready'));};image.src=modelDTopUrl;
 return texture;
}

export function createBehringerModelD(){
 const group=new THREE.Group();group.name='behringer-model-d';group.userData.collision=false;group.userData.rackUnits=3;
 const geometries=[],materials=[],textures=[];
 const mat=(color,metalness=0,roughness=.68)=>{const m=new THREE.MeshStandardMaterial({color,metalness,roughness,side:THREE.DoubleSide});materials.push(m);return m;};
 const black=mat('#101114',.08,.7),edge=mat('#292b2e',.28,.5),wood=mat('#d4c2b0',.04,.75),metal=mat('#b7b8b4',.65,.31),ivory=mat('#e3dfd3',.12,.55),red=mat('#be2425',.05,.52),blue=mat('#2456a7',.08,.48),dark=mat('#08090b',.08,.74);
 if(typeof document!=='undefined'){const grain=walnutTexture();textures.push(grain);wood.map=grain;wood.needsUpdate=true;}
 const add=(name,g,m,parent=group,x=0,y=0,z=0)=>{const o=new THREE.Mesh(g,m);o.name=name;o.position.set(x,y,z);parent.add(o);geometries.push(g);return o;};
 const box=(name,w,h,d,m,x=0,y=0,z=0,parent=group)=>add(name,new THREE.BoxGeometry(w,h,d),m,parent,x,y,z);
 const round=(name,w,h,d,r,m,x=0,y=0,z=0,parent=group)=>add(name,new RoundedBoxGeometry(w,h,d,2,r),m,parent,x,y,z);
 const cyl=(name,r,h,m,x,y,z,parent=group)=>add(name,new THREE.CylinderGeometry(r,r,h,20),m,parent,x,y,z);
 const bank=(name,positions,r,h,m,parent=group,lift=.003)=>{const g=new THREE.CylinderGeometry(r,r,h,20),o=new THREE.InstancedMesh(g,m,positions.length),matrix=new THREE.Matrix4(),origin=new THREE.Vector3(),scale=new THREE.Vector3(),rotation=new THREE.Quaternion();positions.forEach(([x,z,size=1],i)=>{const bottom=lift==='cap'?.003+.0065*size+.0001:lift;origin.set(x,bottom+h*size/2,z);scale.set(size,size,size);o.setMatrixAt(i,matrix.compose(origin,rotation,scale));});o.instanceMatrix.needsUpdate=true;o.name=name;parent.add(o);geometries.push(g);return o;};

 // The metal chassis and the two wood cheeks share the stepped side silhouette.
 add('model-d-formed-chassis',instrumentSide(.354,.034,-.012),black);
 for(const side of [-1,1]){
  const cheek=add('model-d-wood-side',instrumentSide(.009),wood,group,side*.1825);
  cheek.userData.material='mahogany';
 }
 const screwProfile=[[.019,.017],[.124,-.026],[.023,-.037],[.077,-.037]];
 const screwCenters=[-1,1].flatMap(side=>screwProfile.map(([u,y])=>[side*.188,y,MODEL_D.depth/2-u]));
 const screws=new THREE.InstancedMesh(new THREE.SphereGeometry(.003,12,8),dark,screwCenters.length),screwMatrix=new THREE.Matrix4(),screwPosition=new THREE.Vector3(),screwScale=new THREE.Vector3(.46,1,1);
 screwCenters.forEach(([x,y,z],index)=>{screwPosition.set(x,y,z);screws.setMatrixAt(index,screwMatrix.compose(screwPosition,new THREE.Quaternion(),screwScale));});
 screws.instanceMatrix.needsUpdate=true;screws.name='model-d-side-screws';group.add(screws);geometries.push(screws.geometry);
 for(const [name,w,h,d] of [['model-d-screw-slot-horizontal',.0002,.00055,.003],['model-d-screw-slot-vertical',.0002,.003,.00055]]){
  const geometry=new THREE.BoxGeometry(w,h,d),slots=new THREE.InstancedMesh(geometry,edge,screwCenters.length),matrix=new THREE.Matrix4();
  screwCenters.forEach(([x,y,z],index)=>slots.setMatrixAt(index,matrix.makeTranslation(x+Math.sign(x)*.00125,y,z)));
  slots.instanceMatrix.needsUpdate=true;slots.name=name;group.add(slots);geometries.push(geometry);
 }
 box('synth-front-panel',MODEL_D.width,.013,.004,edge,0,-.037,-.055);
 box('model-d-rear-case',.354,.025,.004,edge,0,.012,.054);
 round('model-d-back-ridge',.345,.004,.005,.0015,edge,0,.033,.052);
 // The support tray is below the body. Its short outer tabs do not cover the control face.
 box('model-d-rack-shelf',.355,.0025,.122,edge,0,-.048,.001);
 box('model-d-rack-crossbar',.468,.003,.009,dark,0,-.048,.062);
 for(const side of [-1,1]){
  box('3u-rack-ear',.033,.012,.003,dark,side*.218,-.047,.062);
  const screw=cyl('model-d-rack-fastener',.0024,.0006,metal,side*.225,-.047,.060);screw.rotation.x=Math.PI/2;
 }

 // The control plane follows the true rising profile, rather than being a flat rack face.
 const plane=new THREE.Group();plane.name='model-d-sloped-control-panel';plane.position.set(0,.013,-.005);plane.rotation.x=-Math.atan2(.046,.125);group.add(plane);
 box('model-d-control-plate',.352,.002,.125,black,0,0,0,plane);
 if(typeof document!=='undefined'){
  const tex=printPanel();textures.push(tex);
  const ink=new THREE.MeshBasicMaterial({map:tex,transparent:false,side:THREE.DoubleSide});materials.push(ink);
  const art=add('model-d-panel-print',new THREE.PlaneGeometry(.348,.121),ink,plane,0,.00125,0);
  art.rotation.x=-Math.PI/2;art.rotateZ(Math.PI);
 }
 const fromPrint=(px,py)=>[-(px-1000)/1915*.348,-(py-355)/710*.121];
 // Centers traced from the manufacturer's straight-on view, in image pixels.
 const knobPixels=[[215,251,1.3],[131,380],[298,380],[132,586],[298,586],
  [516,213,1.15],[780,213,1.15],[516,379,1.15],[650,379,1.3],[780,379,1.15],[516,546,1.15],[650,546,1.3],[780,546,1.15],
  [915,211],[915,378],[915,545],[1129,294],[1129,461],
  [1409,214],[1535,214],[1657,214],[1409,378],[1535,378],[1657,378],[1409,545],[1535,545],[1657,545]];
 const knobs=knobPixels.map(([x,y,size=1])=>[...fromPrint(x,y),size]);
 bank('model-d-knob-collars',knobs,.0067,.0011,dark,plane);
 bank('model-d-knobs',knobs,.0058,.0065,edge,plane);
 bank('model-d-metal-knob-caps',knobs,.0035,.0008,metal,plane,'cap');
 // A bright index line on every physical knob, all batched in one draw call.
 const tickGeo=new THREE.BoxGeometry(.0007,.00035,.0025),ticks=new THREE.InstancedMesh(tickGeo,ivory,knobs.length),matrix=new THREE.Matrix4();
 knobs.forEach(([x,z],i)=>ticks.setMatrixAt(i,matrix.makeTranslation(x,.0104,z-.0022)));ticks.instanceMatrix.needsUpdate=true;ticks.name='model-d-knob-indexes';plane.add(ticks);geometries.push(tickGeo);
 const outputKnobs=[[1777,214],[1777,545]].map(([x,y])=>fromPrint(x,y));
 bank('model-d-output-collars',outputKnobs,.0067,.0011,dark,plane);
 bank('model-d-output-knobs',outputKnobs,.0058,.0065,edge,plane);
 bank('model-d-output-caps',outputKnobs,.0035,.0008,metal,plane,'cap');
 const switches=[[385,256,blue],[417,543,blue],[1025,216,red],[1025,297,red],[1025,378,red],[1025,461,red],[1025,542,red],
  [1218,461,red],[1297,216,blue],[1297,297,blue],[1297,379,blue],[1297,462,ivory],[1297,543,ivory],[1777,379,red],[1884,215,red]];
 for(const [name,material] of [['blue',blue],['red',red],['white',ivory]]){
  const positions=switches.filter(([, ,item])=>item===material).map(([x,y])=>fromPrint(x,y));
  const geometry=new RoundedBoxGeometry(.006,.005,.009,1,.001),mesh=new THREE.InstancedMesh(geometry,material,positions.length),transform=new THREE.Matrix4();
  positions.forEach(([x,z],index)=>mesh.setMatrixAt(index,transform.makeTranslation(x,.004,z)));
  mesh.instanceMatrix.needsUpdate=true;mesh.name=`model-d-${name}-switches`;plane.add(mesh);geometries.push(geometry);
 }
 const sockets=[[516,91],[649,91],[780,91],[896,91],[966,91],[1140,91],[1210,91],[1390,91],[1462,91],[1535,91],[1605,91],[1675,91],[1778,91],[1887,91],[1887,540]].map(([x,y])=>fromPrint(x,y));
 bank('model-d-control-sockets',sockets,.0038,.001,metal,plane,.003);
 bank('model-d-socket-bores',sockets,.0025,.0012,dark,plane,.0037);
 // Rear I/O is inset in the metal rear rail, not floating on the panel.
 for(const x of [.078,.108]){const outer=cyl('model-d-rear-output-rim',.0048,.001,metal,x,.012,.071);outer.rotation.x=Math.PI/2;const hole=cyl('model-d-rear-output-bore',.0032,.0011,dark,x,.012,.0717);hole.rotation.x=Math.PI/2;}
 box('model-d-rear-midi-port',.009,.008,.001,dark,.142,.012,.071);
 box('model-d-rear-power-port',.009,.008,.001,dark,.160,.012,.071);
 const centerY=.165,front=-RACK_15U.depth/2+.003+Math.tan(RACK_15U.leanDegrees*Math.PI/180)*(centerY-.06)-.003;
 group.position.set(0,centerY,front+MODEL_D.depth/2);
 group.updateMatrixWorld(true);
 return {group,dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}};
}
