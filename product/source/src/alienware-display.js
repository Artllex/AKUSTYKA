import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {COMBODESK_88} from './desk-model.js';
import {MODUL_DESK_ID,MODUL_STUDIO_DESK} from './modul-desk-model.js';

// Dell AW3423DWF, at the stand's lowest position. Metres.
export const AW3423DWF=Object.freeze({width:.81525,height:.41557,depth:.30571,curveRadius:1.8,panelHeight:.352});

export function displayPlacement(desk){
 const modul=desk.id===MODUL_DESK_ID;
 const top=modul?MODUL_STUDIO_DESK.height:COMBODESK_88.worktop.top;
 // Both desk tops cover this entire footprint; the base clears B's cable grommet.
 return {x:0,y:top,z:modul?.055:.055};
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
 const d=AW3423DWF,panelY=d.height-d.panelHeight/2,panelZ=-.075;
 mesh('curved-rear-shell-1800r',curved(new THREE.BoxGeometry(d.width,d.panelHeight,.026,64,1,1)),body,0,panelY,panelZ);
 mesh('black-front-bezel',curved(new THREE.PlaneGeometry(d.width-.004,d.panelHeight-.004,64,1)),bezel,0,panelY,panelZ+.0135);
 mesh('curved-oled-screen',curved(new THREE.PlaneGeometry(d.width-.018,d.panelHeight-.032,64,1)),screen,0,panelY+.007,panelZ+.0143);
 mesh('lower-chin',curved(new THREE.BoxGeometry(d.width-.006,.018,.003,64,1,1)),stand,0,d.height-d.panelHeight+.009,panelZ+.015);
 // Central height-adjustable stem, V-shaped front feet and short rear heel.
 mesh('stand-stem',new RoundedBoxGeometry(.057,.205,.047,4,.008),stand,0,.116,-.097);
 mesh('stand-neck',new RoundedBoxGeometry(.073,.06,.066,4,.008),body,0,.265,-.094);
 for(const side of [-1,1]){
  const arm=new THREE.Shape();arm.moveTo(0,-.08);arm.lineTo(side*.031,-.065);arm.lineTo(side*.242,.137);arm.lineTo(side*.253,.137);arm.lineTo(side*.253,.115);arm.lineTo(side*.035,-.105);arm.closePath();
  const foot=new THREE.ExtrudeGeometry(arm,{depth:.012,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.002,bevelThickness:.001});foot.rotateX(-Math.PI/2);
  mesh('v-foot',foot,stand,0,.002,0);
 }
 mesh('rear-foot',new RoundedBoxGeometry(.048,.012,.079,3,.004),stand,0,.008,-.128);
 // Rounded vertical vent and luminous marks on the rear, visible when orbiting.
 const vent=mesh('rear-vent',new THREE.TorusGeometry(.044,.006,8,36),bezel,0,.257,panelZ-.014);vent.scale.y=2.05;
 const alien=mesh('rear-alien-mark',new THREE.SphereGeometry(.014,16,8),turquoise,-.205,.245,panelZ-.0146);alien.scale.set(1,.78,.1);
 for(const [x,y,w] of [[.165,.249,.037],[.205,.249,.037],[.205,.220,.037]])mesh('rear-34-mark',new THREE.BoxGeometry(w,.007,.001),turquoise,x,y,panelZ-.015);
 group.userData.dimensions={width:d.width,height:d.height,depth:d.depth,curveRadius:d.curveRadius};
 return {group,dispose(){for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();texture.dispose();}};
}
