import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {PVM_20M2E} from './pvm-20m2e-model.js';

export function createPvm20m2eView(record,{mount=true}={}){
 const group=new THREE.Group();group.name=record.id;group.userData.recordId=record.id;
 const geometries=[],materials=[],textures=[];
 const material=(color,extra={})=>{const item=new THREE.MeshStandardMaterial({color,roughness:.74,...extra});materials.push(item);return item;};
 const shell=material(0x414449),front=material(0x45494d),rear=material(0x53565a),black=material(0x090d10),recess=material(0x020607),control=material(0x202a2e),silver=material(0x8e9696,{metalness:.65,roughness:.38}),port=material(0x20272c),green=material(0x567d6a,{emissive:0x1b3522});
 function add(name,geometry,mat,x=0,y=0,z=0,rotation=null,physical=false){
  const item=new THREE.Mesh(geometry,mat);item.name=name;item.position.set(x,y,z);if(rotation)item.rotation.set(...rotation);
  item.userData.collision=physical;group.add(item);geometries.push(geometry);return item;
 }
 const box=(name,w,h,d,x,y,z,mat,physical=false)=>add(name,new THREE.BoxGeometry(w,h,d),mat,x,y,z,null,physical);
 const rounded=(name,w,h,d,r,x,y,z,mat,physical=false)=>add(name,new RoundedBoxGeometry(w,h,d,3,r),mat,x,y,z,null,physical);
 const cylinder=(name,radius,length,x,y,z,mat,segments=20,physical=false)=>add(name,new THREE.CylinderGeometry(radius,radius,length,segments),mat,x,y,z,[Math.PI/2,0,0],physical);

 const {width,height,depth}=PVM_20M2E,frontZ=-depth/2,rearZ=depth/2;
 rounded('pvm-cabinet',width,height,depth,.007,0,height/2,0,shell,true);
 // A stepped CRT housing and a continuous front frame establish the silhouette.
 rounded('pvm-rear-housing',.420,.430,.380,.013,0,.232,.059,rear);
 // Four separate bezel rails leave a real opening for the curved screen.
 rounded('pvm-bezel-top',.448,.027,.009,.004,0,.442,frontZ-.004,front);
 rounded('pvm-bezel-bottom',.448,.106,.009,.004,0,.056,frontZ-.004,front);
 rounded('pvm-bezel-left',.019,.333,.009,.003,-.215,.275,frontZ-.004,front);
 rounded('pvm-bezel-right',.019,.333,.009,.003,.215,.275,frontZ-.004,front);
 rounded('pvm-screen-recess',.411,.320,.003,.009,0,.268,frontZ-.002,black);
 rounded('pvm-screen-inner-surround',.370,.283,.003,.010,0,.269,frontZ-.004,recess);

 // The glass bows gently toward the viewer, unlike a flat display plane.
 const columns=32,rows=24,w=.348,h=.260,positions=[],uvs=[],indices=[];
 for(let row=0;row<=rows;row++)for(let column=0;column<=columns;column++){
  const u=column/columns,v=row/rows,x=(u-.5)*w,y=.269+(v-.5)*h;
  const bow=.006*(1-(2*u-1)**2)*(1-(2*v-1)**2);
  positions.push(x,y,frontZ-.006-bow);uvs.push(u,v);
 }
 for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
  const a=row*(columns+1)+column,b=a+1,c=a+columns+1,d=c+1;indices.push(a,c,b,b,c,d);
 }
 const screenGeometry=new THREE.BufferGeometry();screenGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));screenGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));screenGeometry.setIndex(indices);screenGeometry.computeVertexNormals();
 let screenMap=null;
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=384;const ctx=canvas.getContext('2d');
  const gradient=ctx.createRadialGradient(170,104,25,260,210,360);gradient.addColorStop(0,'#3d4b50');gradient.addColorStop(.56,'#1d2b31');gradient.addColorStop(1,'#081115');ctx.fillStyle=gradient;ctx.fillRect(0,0,512,384);
  const glint=ctx.createLinearGradient(0,0,512,384);glint.addColorStop(0,'rgba(214,228,228,.09)');glint.addColorStop(.3,'rgba(190,210,215,.01)');glint.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glint;ctx.fillRect(0,0,512,384);
  screenMap=new THREE.CanvasTexture(canvas);screenMap.colorSpace=THREE.SRGBColorSpace;textures.push(screenMap);
 }
 add('pvm-curved-crt-glass',screenGeometry,material(0xffffff,{map:screenMap,metalness:.12,roughness:.18,side:THREE.DoubleSide}),0,0,0,null,true);
 box('pvm-screen-top-shadow',.367,.003,.003,0,.410,frontZ-.007,black);
 box('pvm-screen-bottom-shadow',.367,.003,.003,0,.128,frontZ-.007,black);
 rounded('pvm-status-window',.041,.020,.002,.002,0,.437,frontZ-.007,silver);
 rounded('pvm-control-well',.422,.064,.003,.004,0,.047,frontZ-.006,black);
 rounded('pvm-left-grip',.100,.047,.004,.006,.165,.048,frontZ-.009,recess);
 for(const side of [-1,1]){
  box('pvm-grip-rail',.003,.055,.006,side*.218,.047,frontZ-.013,silver);
 }
 for(let row=0;row<2;row++)for(let column=0;column<6;column++){
  const x=.085-column*.019,y=.061-row*.021;
  rounded(`pvm-input-button-${row}-${column}`,.011,.011,.004,.001,x,y,frontZ-.009,column===5&&row===0?green:control);
 }
 for(let column=0;column<7;column++){
  const x=-.041-column*.024;
  cylinder(`pvm-control-knob-${column}`,.007,.008,x,.051,frontZ-.012,black,20);
  cylinder(`pvm-control-knob-cap-${column}`,.004,.001,x,.051,frontZ-.017,silver,20);
 }
 rounded('pvm-power-switch',.014,.019,.005,.002,-.200,.055,frontZ-.011,control);
 cylinder('pvm-power-led',.002,.001,-.200,.037,frontZ-.014,green,12);

 // Rear vents, screw heads, service panel and connector bank follow the rear reference.
 const vents=[];
 for(const [baseY,columnsCount] of [[.414,52],[.351,44],[.150,14]])for(let col=0;col<columnsCount;col++)vents.push({x:(col-(columnsCount-1)/2)*.0073,y:baseY});
 const ventGeometry=new THREE.BoxGeometry(.0032,.0026,.0005);geometries.push(ventGeometry);
 const ventMesh=new THREE.InstancedMesh(ventGeometry,black,vents.length);ventMesh.name='pvm-rear-ventilation';ventMesh.userData.collision=false;
 const matrix=new THREE.Matrix4();vents.forEach(({x,y},index)=>{matrix.makeTranslation(x,y,rearZ+.0006);ventMesh.setMatrixAt(index,matrix);});ventMesh.instanceMatrix.needsUpdate=true;group.add(ventMesh);
 rounded('pvm-rear-port-recess',.341,.106,.002,.003,0,.073,rearZ+.0007,black);
 rounded('pvm-rear-port-plate',.319,.091,.002,.002,0,.073,rearZ+.002,port);
 rounded('pvm-ac-inlet',.043,.042,.002,.002,-.133,.073,rearZ+.004,recess);
 box('pvm-ac-inlet-slot',.027,.016,.001,-.133,.074,rearZ+.005,black);
 for(let row=0;row<2;row++)for(let column=0;column<8;column++){
  const x=-.083+column*.027,y=.090-row*.035;
  cylinder(`pvm-bnc-rim-${row}-${column}`,.0074,.002,x,y,rearZ+.005,silver,18);
  cylinder(`pvm-bnc-hole-${row}-${column}`,.0046,.0025,x,y,rearZ+.0064,recess,18);
 }
 rounded('pvm-remote-port',.039,.026,.002,.003,.171,.327,rearZ+.002,black);
 for(const y of [.337,.318])cylinder('pvm-remote-button',.006,.003,.171,y,rearZ+.004,control,18);
 for(const x of [-.205,.205])for(const y of [.044,.231,.416])cylinder('pvm-rear-screw',.004,.001,x,y,rearZ+.001,black,14);

 // A shallow wall plate explains the 18 mm standoff without altering the TV envelope.
 if(mount){
  box('pvm-wall-mount-plate',.110,.076,.004,0,.250,rearZ+.016,black);
  for(const x of [-.042,.042])box('pvm-wall-mount-arm',.010,.068,.016,x,.250,rearZ+.008,silver);
 }

 if(typeof document!=='undefined'){
  function label(name,text,w,h,x,y,z,color='#bcc1bd',faceFront=false){
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,512,128);ctx.fillStyle=color;ctx.font=text.length>8?'bold 48px Arial':'bold 83px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,70);
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
   const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide});materials.push(mat);
   const mesh=add(name,new THREE.PlaneGeometry(w,h),mat,x,y,z);if(faceFront)mesh.rotation.y=Math.PI;
  }
  label('pvm-sony-logo','SONY',.072,.018,0,.097,frontZ-.011,'#aeb5b5',true);
  label('pvm-model-label','PVM-20M2E',.110,.012,.118,.437,frontZ-.011,'#bec3c2',true);
  label('pvm-rear-label','SONY  PVM-20M2E',.104,.016,-.092,.314,rearZ+.001,'#afb3af');
 }
 group.position.set(record.position.x,record.position.y,record.position.z);group.rotation.y=record.yaw;group.updateMatrixWorld(true);
 return {group,dispose(){for(const geometry of geometries)geometry.dispose();for(const item of materials)item.dispose();for(const item of textures)item.dispose();}};
}
