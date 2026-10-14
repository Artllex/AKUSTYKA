import * as THREE from 'three';
import {MILLENIUM_SD_180_B as D} from './millenium-desk-model.js';

// The user faces +Z. The origin is the centre of the floor footprint.
export function createMilleniumDeskView(record){
 const group=new THREE.Group();group.name=record.id;group.userData.recordId=record.id;
 const geometries=[],materials=[],textures=[];
 let grain;
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const context=canvas.getContext('2d'),data=context.createImageData(512,256);
  for(let y=0;y<256;y++)for(let x=0;x<512;x++){
   const wave=Math.sin(x*.039+Math.sin(y*.095)*2.1)*1.4+Math.sin(x*.105+y*.014)*.8;
   const streak=Math.sin(y*.37+Math.sin(x*.018)*2.4)*.8;
   const n=Math.sin(x*12.9898+y*78.233)*43758.5453;
   const shade=Math.max(0,Math.min(255,57+wave+streak+(n-Math.floor(n)-.5)*4));
   const i=(y*512+x)*4;data.data[i]=shade;data.data[i+1]=shade*.98;data.data[i+2]=shade*1.02;data.data[i+3]=255;
  }
  context.putImageData(data,0,0);grain=new THREE.CanvasTexture(canvas);grain.colorSpace=THREE.SRGBColorSpace;textures.push(grain);
 }
 const wood=new THREE.MeshStandardMaterial({color:grain?0xffffff:0x39383a,roughness:.84});
 if(grain)wood.map=grain;
 const woodEdge=new THREE.MeshStandardMaterial({color:0x302f31,roughness:.84});
 const metal=new THREE.MeshStandardMaterial({color:0x181b1e,metalness:.42,roughness:.55});
 const rail=new THREE.MeshStandardMaterial({color:0x34383c,metalness:.58,roughness:.48});
 const dark=new THREE.MeshStandardMaterial({color:0x0a0c0d,roughness:.72});
 materials.push(wood,woodEdge,metal,rail,dark);
 function mesh(name,geometry,material,x=0,y=0,z=0){const item=new THREE.Mesh(geometry,material);item.name=name;item.position.set(x,y,z);group.add(item);geometries.push(geometry);return item;}
 function box(name,w,h,d,x,y,z,material=wood){return mesh(name,new THREE.BoxGeometry(w,h,d),material,x,y,z);}
 function cylinder(name,r,h,x,y,z,material=metal,segments=16){return mesh(name,new THREE.CylinderGeometry(r,r,h,segments),material,x,y,z);}
 function board(name,outline,thickness,bottom){
  // Extruded shape uses y=-z so a rotation maps the drawing directly to X/Z.
  const shape=new THREE.Shape();outline(shape);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false,curveSegments:36});geometry.rotateX(-Math.PI/2);
  return mesh(name,geometry,wood,0,bottom,0);
 }
 const P=(shape,x,z)=>shape.lineTo(x,-z),M=(shape,x,z)=>shape.moveTo(x,-z);
 // Chamfered corners and a smooth concave seating cutout are part of the top,
 // not a dark decal laid over a rectangular slab.
 board('sd180-worktop-sculpted',shape=>{
  M(shape,-.82,-.4);P(shape,.82,-.4);P(shape,.9,-.34);P(shape,.9,.33);P(shape,.84,.4);P(shape,.43,.4);
  shape.bezierCurveTo(.23,-.28,-.23,-.28,-.43,-.4);
  P(shape,-.84,.4);P(shape,-.9,.33);P(shape,-.9,-.34);shape.closePath();
  const hole=new THREE.Path();hole.absarc(0,.31,.023,0,Math.PI*2,true);shape.holes.push(hole);
 },D.worktop.thickness,D.worktop.top-D.worktop.thickness);
 const grommet=mesh('rear-cable-grommet',new THREE.RingGeometry(.023,.029,24),metal,0,D.worktop.top+.0008,-.31);grommet.rotation.x=-Math.PI/2;grommet.userData.collision=false;
 const cableInsert=mesh('dark-cable-grommet-insert',new THREE.CircleGeometry(.023,24),dark,0,D.worktop.top-.004,-.31);cableInsert.rotation.x=-Math.PI/2;cableInsert.material.side=THREE.DoubleSide;cableInsert.userData.collision=false;

 // The wide lower platform extends beyond the worktop and has its own deeper
 // front arc. Its five casters are kept underneath, not added to desk height.
 board('sd180-floor-platform-sculpted',shape=>{
  M(shape,-.82,-.51);P(shape,.82,-.51);P(shape,.9,-.41);P(shape,.9,.41);P(shape,.81,.51);P(shape,.53,.51);
  shape.bezierCurveTo(.35,-.30,-.35,-.30,-.53,-.51);
  P(shape,-.81,.51);P(shape,-.9,.41);P(shape,-.9,-.41);shape.closePath();
 },.023,.047);
 for(const [x,z] of [[-.74,-.38],[.74,-.38],[-.74,.37],[.74,.37],[0,-.38]]){
  cylinder('swivel-caster',.018,.038,x,.019,z,dark,12);
  cylinder('caster-stem',.006,.014,x,.044,z,metal,10);
 }
 for(const x of [-.73,.73])for(const z of [-.28,.27]){
  cylinder('round-tube-leg',.022,.69,x,.415,z,metal,20);
  cylinder('leg-foot-collar',.027,.018,x,.078,z,rail,20);
 }
 for(const x of [-.18,.18])cylinder('centre-rear-tube',.017,.69,x,.415,-.29,metal,16);

 // Two open 4U rack cradles carry independent raised monitor shelves.
 for(const sign of [-1,1]){
  const cx=sign*.59;
  box('raised-monitor-shelf',D.monitorShelf.width,D.monitorShelf.thickness,D.monitorShelf.depth,cx,D.monitorShelf.top-D.monitorShelf.thickness/2,-.29);
  box('shelf-front-edge',D.monitorShelf.width,.008,.012,cx,D.monitorShelf.top-.02,-.17,woodEdge);
  for(const side of [-1,1]){
   const shape=new THREE.Shape();
   // Coordinates are -Z,Y; the front lip drops and the rear reaches shelf height.
   shape.moveTo(.40,.784);shape.lineTo(.17,.784);shape.lineTo(.17,.811);shape.lineTo(.31,.911);shape.lineTo(.40,.911);shape.closePath();
   const geometry=new THREE.ExtrudeGeometry(shape,{depth:.013,bevelEnabled:false});geometry.rotateY(Math.PI/2);
   mesh('angled-4u-rack-cheek',geometry,metal,cx+side*.258-.0065,0,0);
   const rackX=cx+side*.245;
   const strip=box('inclined-rack-rail',.008,.105,.009,rackX,.852,-.244,rail);
   strip.rotation.x=-.72;
   for(let u=0;u<4;u++){
    const dot=cylinder('rack-hole',.0028,.001,rackX+side*.005,.813+u*.025,-.18-u*.038,dark,8);
    dot.rotation.z=Math.PI/2;dot.userData.collision=false;
   }
  }
 }
 // Keyboard shelf is centred 14 cm below the top and runs on black guides.
 const trayTop=D.worktop.top-D.keyboardTray.drop;
 box('sliding-keyboard-tray',D.keyboardTray.width,D.keyboardTray.thickness,D.keyboardTray.depth,0,trayTop-D.keyboardTray.thickness/2,.20);
 box('keyboard-tray-front-edge',D.keyboardTray.width,.025,.014,0,trayTop-.020,.402,woodEdge);
 for(const x of [-.505,.505])box('keyboard-slide',.012,.022,.42,x,trayTop-.019,.20,rail);
 // A compact perforated cable plate is visible from the rear, between the
 // centre supports, with enough open space below the tray for the knees.
 box('rear-cable-management-plate',.48,.075,.007,0,.674,-.29,metal);
 const dots=[];for(let row=0;row<3;row++)for(let col=0;col<17;col++)dots.push([-.213+col*.026,.651+row*.021]);
 const holeGeometry=new THREE.CylinderGeometry(.003,.003,.001,8),holes=new THREE.InstancedMesh(holeGeometry,dark,dots.length),matrix=new THREE.Matrix4();
 dots.forEach(([x,y],i)=>holes.setMatrixAt(i,matrix.makeRotationX(Math.PI/2).setPosition(x,y,-.295)));
 holes.name='cable-plate-perforations';holes.instanceMatrix.needsUpdate=true;holes.userData.collision=false;group.add(holes);geometries.push(holeGeometry);
 group.position.set(record.position.x,record.position.y,record.position.z);group.rotation.y=record.yaw;group.updateMatrixWorld(true);
 return {group,dispose(){for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();for(const texture of textures)texture.dispose();}};
}
