import * as THREE from 'three';
import {MODUL_1520_DESK as D} from './modul-1520-desk-model.js';

function woodTexture(){
 const w=128,h=128,pixels=new Uint8Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const grain=Math.sin(x*.32+Math.sin(y*.11)*1.6)*3+Math.sin(x*.96+y*.06)*1.5+Math.sin(x*.075+y*.017)*5;
  const knot=Math.sin((x-42)*.11)*Math.cos((y-75)*.057)*2;
  const i=(y*w+x)*4,shade=grain+knot;
  pixels[i]=Math.max(0,Math.min(255,39+shade));
  pixels[i+1]=Math.max(0,Math.min(255,41+shade));
  pixels[i+2]=Math.max(0,Math.min(255,43+shade));pixels[i+3]=255;
 }
 const texture=new THREE.DataTexture(pixels,w,h,THREE.RGBAFormat);
 texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
 texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}

// Main worktop and the recessed pull-out keyboard tray.
export function createModul1520DeskView(record){
 const group=new THREE.Group();group.name=record.id;group.userData.recordId=record.id;
 const texture=woodTexture();
 const wood=new THREE.MeshStandardMaterial({map:texture,roughness:.76});
 const rail=new THREE.MeshStandardMaterial({color:0x262a2c,metalness:.7,roughness:.46});
 const geometries=[];
 function mesh(name,geometry,material,x=0,y=0,z=0){const item=new THREE.Mesh(geometry,material);item.name=name;item.position.set(x,y,z);group.add(item);geometries.push(geometry);return item;}
 function box(name,w,h,d,x,y,z,material=wood){return mesh(name,new THREE.BoxGeometry(w,h,d),material,x,y,z);}
 const mainTop=new THREE.Shape(),halfW=D.worktop.width/2,halfD=D.worktop.depth/2;
 mainTop.moveTo(-halfW,-halfD);mainTop.lineTo(halfW,-halfD);mainTop.lineTo(halfW,halfD);mainTop.lineTo(-halfW,halfD);mainTop.closePath();
 const cableHole=new THREE.Path();cableHole.absarc(0,.18,.020,0,Math.PI*2,true);mainTop.holes.push(cableHole);
 const mainGeometry=new THREE.ExtrudeGeometry(mainTop,{depth:D.worktop.thickness,bevelEnabled:false,curveSegments:24});
 mainGeometry.rotateX(-Math.PI/2);
 mesh('main-worktop',mainGeometry,wood,0,D.worktopHeight-D.worktop.thickness,0);
 // Two MDF gables have the arched toe clearance shown in the side elevation.
 for(const sign of [-1,1]){
  const profile=new THREE.Shape();
  profile.moveTo(-.275,0);profile.lineTo(-.20,0);profile.lineTo(-.20,.012);
  profile.quadraticCurveTo(-.16,.067,-.085,.065);
  profile.lineTo(.09,.065);profile.quadraticCurveTo(.18,.068,.205,.012);
  profile.lineTo(.205,0);profile.lineTo(.275,0);
  profile.lineTo(.205,D.worktopHeight-D.worktop.thickness);
  profile.lineTo(-.275,D.worktopHeight-D.worktop.thickness);profile.closePath();
  const side=new THREE.ExtrudeGeometry(profile,{depth:D.sideThickness,bevelEnabled:false,curveSegments:16});
  side.rotateY(-Math.PI/2);
  mesh('arched-side-panel',side,wood,sign*.665+D.sideThickness/2,0,0);
  box('keyboard-runner',.008,.015,.245,sign*.661,D.worktopHeight-D.tray.drop-.005,.145,rail);
 }
 const trayY=D.worktopHeight-D.tray.drop-D.tray.thickness/2;
 const trayFront=D.worktop.frontZ-.01;
 box('pull-out-keyboard-tray',D.tray.width,D.tray.thickness,D.tray.depth,0,trayY,trayFront-D.tray.depth/2);
 box('tray-front-edge',D.tray.width,.022,.012,0,trayY-.004,trayFront-.006);
 // The shaped rear modesty board and slim central floor brace are visible in rear and front views.
 const back=new THREE.Shape();back.moveTo(-.65,.725);back.lineTo(.65,.725);back.lineTo(.65,.33);
 back.quadraticCurveTo(.36,.43,0,.43);back.quadraticCurveTo(-.36,.43,-.65,.33);back.closePath();
 const backGeometry=new THREE.ExtrudeGeometry(back,{depth:D.sideThickness,bevelEnabled:false,curveSegments:20});
 mesh('arched-rear-modesty-panel',backGeometry,wood,0,0,-.255);
 box('centre-floor-brace',D.sideThickness,.59,.21,0,.295,-.14);
 // One circular cable pass-through is cut into the rear part of the main worktop.
 const ring=mesh('cable-grommet-ring',new THREE.RingGeometry(.020,.030,24),rail,0,D.worktopHeight+.0007,-.18);
 ring.rotation.x=-Math.PI/2;ring.userData.collision=false;
 group.position.set(record.position.x,record.position.y,record.position.z);group.rotation.y=record.yaw;group.updateMatrixWorld(true);
 return {group,dispose(){for(const geometry of geometries)geometry.dispose();for(const material of [wood,rail])material.dispose();texture.dispose();}};
}
