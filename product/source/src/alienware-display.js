import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {COMBODESK_88} from './desk-model.js';
import {MODUL_DESK_ID,MODUL_STUDIO_DESK} from './modul-desk-model.js';

// Dell AW3423DWF, at the stand's lowest position. Metres.
export const AW3423DWF=Object.freeze({width:.81525,height:.41557,depth:.30571,curveRadius:1.8,panelHeight:.352});

export function displayPlacement(desk){
 const modul=desk.id===MODUL_DESK_ID;
 const top=modul?MODUL_STUDIO_DESK.height:COMBODESK_88.worktop.top;
 const rear=modul?MODUL_STUDIO_DESK.top.frontZ-MODUL_STUDIO_DESK.top.depth:(COMBODESK_88.depth-COMBODESK_88.worktop.depth)/2-COMBODESK_88.worktop.depth/2;
 // The rear heel stays on the worktop while the V feet end at the display plane.
 return {x:0,y:top,z:rear+.241};
}

function curved(geometry,radius=AW3423DWF.curveRadius){
 const p=geometry.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i);
  p.setZ(i,p.getZ(i)+radius-Math.sqrt(radius*radius-x*x));
 }
 geometry.computeVertexNormals();
 return geometry;
}

function scenicTexture(){
 const width=640,height=268,data=new Uint8Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/width,v=1-y/height,i=(y*width+x)*4;
  const mountains=.49+.055*Math.sin(u*10)+.026*Math.sin(u*31);
  const ridge=.65+.032*Math.sin(u*17+2)+.015*Math.sin(u*57);
  const cloud=Math.max(0,Math.sin(u*19+Math.sin(v*25)*.8)*Math.sin(v*42+u*7));
  let r,g,b;
  if(v<mountains){const haze=Math.max(0,1-Math.abs(v-.28)*4);r=31+72*v+95*cloud*haze;g=111+71*v+58*cloud*haze;b=137+61*v+30*cloud*haze;}
  else if(v<ridge){r=20+45*(v-mountains);g=65+24*u;b=64+26*u;}
  else {const grass=Math.sin(u*135+Math.sin(v*21))*7;r=57+grass+70*(v-.65);g=85+grass+38*(v-.65);b=36+11*u;}
  data[i]=r;data[i+1]=g;data[i+2]=b;data[i+3]=255;
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}

export function createAlienwareDisplay(desk){
 const group=new THREE.Group();group.name='computer-display-aw3423dwf';group.userData.collision=false;
 const placement=displayPlacement(desk);group.position.set(placement.x,placement.y,placement.z);
 const body=new THREE.MeshStandardMaterial({color:0x171b1f,roughness:.62,metalness:.18});
 const bezel=new THREE.MeshStandardMaterial({color:0x080a0c,roughness:.53});
 const stand=new THREE.MeshStandardMaterial({color:0x25292d,roughness:.47,metalness:.26});
 const turquoise=new THREE.MeshBasicMaterial({color:0x26dcd9});
 const texture=scenicTexture(),screen=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
 const materials=[body,bezel,stand,turquoise,screen],geometries=[];
 function mesh(name,geometry,material,x=0,y=0,z=0){const item=new THREE.Mesh(geometry,material);item.name=name;item.position.set(x,y,z);group.add(item);geometries.push(geometry);return item;}
 // The panel is suspended in front of a separate, substantial stand.
 const d=AW3423DWF,panelY=d.height-d.panelHeight/2,panelZ=-.155;
 mesh('curved-rear-shell-1800r',curved(new THREE.BoxGeometry(d.width,d.panelHeight,.026,64,1,1)),body,0,panelY,panelZ);
 mesh('black-front-bezel',curved(new THREE.PlaneGeometry(d.width-.004,d.panelHeight-.004,64,1)),bezel,0,panelY,panelZ+.0135);
 mesh('curved-oled-screen',curved(new THREE.PlaneGeometry(d.width-.018,d.panelHeight-.032,64,1)),screen,0,panelY+.007,panelZ+.0143);
 mesh('lower-chin',curved(new THREE.BoxGeometry(d.width-.006,.018,.003,64,1,1)),stand,0,d.height-d.panelHeight+.009,panelZ+.015);
 // Rounded equipment housing on the back, with a short pivot arm to the post.
 mesh('rear-equipment-housing',new RoundedBoxGeometry(.44,.275,.026,4,.009),body,0,.245,-.177);
 mesh('mounting-arm',new RoundedBoxGeometry(.068,.039,.035,4,.006),stand,0,.262,-.197);
 const pivot=mesh('stand-pivot',new THREE.CylinderGeometry(.024,.024,.075,24),body,0,.262,-.204);pivot.rotation.z=Math.PI/2;
 // A thick, tapered side profile; the foot and post form one continuous silhouette.
 const profile=new THREE.Shape();
 profile.moveTo(.202,.044);profile.lineTo(.201,.349);profile.quadraticCurveTo(.202,.375,.218,.383);
 profile.lineTo(.230,.383);profile.quadraticCurveTo(.239,.382,.240,.370);
 profile.lineTo(.240,.060);profile.lineTo(.230,.022);profile.lineTo(.212,.018);profile.closePath();
 const stem=new THREE.ExtrudeGeometry(profile,{depth:.078,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.002,bevelThickness:.002});
 stem.rotateY(Math.PI/2);
 mesh('stand-stem',stem,stand,-.039,0,0);
 mesh('stand-foot-joint',new RoundedBoxGeometry(.084,.030,.048,3,.005),stand,0,.018,-.215);
 for(const side of [-1,1]){
  // Shape-Y becomes world -Z: the tips stop behind the front face of the panel.
  const arm=new THREE.Shape();arm.moveTo(0,.225);arm.lineTo(side*.040,.219);arm.lineTo(side*.249,.151);arm.lineTo(side*.254,.151);arm.lineTo(side*.254,.169);arm.lineTo(side*.046,.237);arm.closePath();
  const foot=new THREE.ExtrudeGeometry(arm,{depth:.012,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.002,bevelThickness:.001});foot.rotateX(-Math.PI/2);
  mesh('v-foot',foot,stand,0,.002,0);
 }
 mesh('rear-foot',new RoundedBoxGeometry(.054,.012,.036,3,.004),stand,0,.008,-.218);
 // Rounded vertical vent and luminous marks on the rear, visible when orbiting.
 const vent=mesh('rear-vent',new THREE.TorusGeometry(.044,.006,8,36),bezel,0,.257,-.191);vent.scale.y=2.05;
 const alien=mesh('rear-alien-mark',new THREE.SphereGeometry(.014,16,8),turquoise,-.205,.245,-.191);alien.scale.set(1,.78,.1);
 for(const [x,y,w] of [[.165,.249,.037],[.205,.249,.037],[.205,.220,.037]])mesh('rear-34-mark',new THREE.BoxGeometry(w,.007,.001),turquoise,x,y,-.191);
 group.userData.dimensions={width:d.width,height:d.height,depth:d.depth,curveRadius:d.curveRadius};
 return {group,dispose(){for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();texture.dispose();}};
}
