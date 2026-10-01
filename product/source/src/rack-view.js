import * as THREE from 'three';
import {RACK_15U} from './rack-model.js';

export function createRackView(record){
 const group=new THREE.Group();group.name=record.id;group.userData.recordId=record.id;
 const steel=new THREE.MeshStandardMaterial({color:0x202226,metalness:0.58,roughness:0.47});
 const edge=new THREE.MeshStandardMaterial({color:0x303338,metalness:0.55,roughness:0.48});
 const opening=new THREE.MeshStandardMaterial({color:0x080a0c,roughness:0.96});
 const rubber=new THREE.MeshStandardMaterial({color:0x111316,roughness:0.95});
 const {width,depth,height,leanDegrees,mountingHeight}=RACK_15U;
 const lowerBeamHeight=0.052,footBottom=0.011;
 const footTopAtUpright=footBottom+1.5*lowerBeamHeight;
 const footTopAtFarEnd=footBottom+lowerBeamHeight;
 const lean=Math.tan(leanDegrees*Math.PI/180),railBaseY=0.060;
 // The front cross-member and uprights face the room; the feet extend behind them.
 const railBaseZ=-depth/2+0.003;
 const footFrontZ=railBaseZ+0.002;
 const railZ=y=>railBaseZ+lean*(y-railBaseY);
 const geometries=[];
 function mesh(name,geometry,material,x=0,y=0,z=0){const part=new THREE.Mesh(geometry,material);part.name=name;part.position.set(x,y,z);group.add(part);geometries.push(geometry);return part;}
 function bar(name,w,h,d,x,y,z,material=steel){return mesh(name,new THREE.BoxGeometry(w,h,d),material,x,y,z);}
 function leaningBar(name,w,d,x,zOffset=0,material=steel){
  const h=height-railBaseY,geometry=new THREE.BoxGeometry(w,h,d),positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++)positions.setZ(i,positions.getZ(i)+lean*(positions.getY(i)+h/2));
  positions.needsUpdate=true;geometry.computeVertexNormals();
  return mesh(name,geometry,material,x,railBaseY+h/2,railBaseZ+zOffset);
 }
 // Each upright is a thin folded-steel angle: perforated 26 mm face and
 // 24 mm return. Its centreline moves 5 degrees toward the rear with height.
 for(const sign of [-1,1]){
  const frontX=sign*(width/2-0.013);
  leaningBar('mounting-rail',0.026,0.0025,frontX);
  leaningBar('upright-side-return',0.0025,0.024,sign*(width/2-0.00125),0.012);
  for(let unit=0;unit<15;unit++)for(let hole=0;hole<3;hole++){
   const y=railBaseY+(unit+(hole+0.5)/3)*(mountingHeight/15);
   const mark=bar('rack-mount-hole',0.006,0.009,0.001,frontX,y,railZ(y)-0.0018,opening);
   mark.userData.collision=false;
  }
  for(let n=0;n<6;n++){
   const y=0.14+n*0.105;
   const mark=bar('upright-side-slot',0.001,0.028,0.006,sign*(width/2-0.0007),y,railZ(y)+0.012,opening);
   mark.userData.collision=false;
  }
  // Side plates tuck behind the front rail and inside the upright returns.
  bar('foot-base',0.030,0.003,depth,sign*(width/2-0.015),0.0095,0,edge);
  const outline=new THREE.Shape();
  for(const [index,[z,y]] of [[footFrontZ,footBottom],[footFrontZ,footTopAtUpright],[depth/2,footTopAtFarEnd],[depth/2,footBottom]].entries()){
   if(index===0)outline.moveTo(-z,y);else outline.lineTo(-z,y);
  }
  outline.closePath();
  const side=new THREE.ExtrudeGeometry(outline,{depth:0.0025,bevelEnabled:false,steps:1});side.rotateY(Math.PI/2);
  mesh('foot-side-plate',side,steel,sign<0?-width/2+0.005:width/2-0.0075);
  for(const z of [-depth/2+0.018,depth/2-0.018]){
   mesh('rubber-foot',new THREE.CylinderGeometry(0.010,0.010,0.008,12),rubber,sign*(width/2-0.022),0.004,z);
  }
 }
 // Front low cross-member and slim upper cross-member leave the rack open.
 bar('lower-front-rail',width,lowerBeamHeight,0.003,0,0.036,railBaseZ+0.002,steel);
 bar('lower-rail-return',width,0.003,0.016,0,0.061,railBaseZ+0.008,edge);
 bar('upper-cross-member',width,0.012,0.003,0,height-0.006,railZ(height),steel);
 const screwRim=new THREE.MeshStandardMaterial({color:0x62666a,metalness:0.72,roughness:0.38});
 for(const x of [-width/2+0.019,width/2-0.019])for(const y of [0.023,0.048]){
  const rim=mesh('front-screw',new THREE.CylinderGeometry(0.0043,0.0043,0.0012,16),screwRim,x,y,railBaseZ-0.0002);
  rim.rotation.x=Math.PI/2;rim.userData.collision=false;
  const recess=mesh('front-screw-recess',new THREE.CylinderGeometry(0.0026,0.0026,0.0013,16),opening,x,y,railBaseZ-0.0011);
  recess.rotation.x=Math.PI/2;recess.userData.collision=false;
 }
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.strokeStyle='#ffffff';ctx.lineWidth=13;ctx.lineCap='round';
  ctx.beginPath();ctx.arc(128,96,68,-2.5,2.3);ctx.stroke();
  ctx.textAlign='center';ctx.font='italic bold 132px sans-serif';ctx.fillText('R',126,145);
  ctx.font='bold 29px sans-serif';ctx.fillText('RIVECO',128,228);
  const texture=new THREE.CanvasTexture(canvas),label=new THREE.Mesh(new THREE.PlaneGeometry(0.040,0.040),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide}));
  label.name='brand';label.position.set(0,0.036,railBaseZ+0.0001);label.rotation.y=Math.PI;label.userData.collision=false;group.add(label);geometries.push(label.geometry);
 }
 group.position.set(record.position.x,record.position.y,record.position.z);group.rotation.y=record.yaw;group.updateMatrixWorld(true);
 return {group,dispose(){const textures=new Set(),materials=new Set();group.traverse(part=>{if(part.material){materials.add(part.material);if(part.material.map)textures.add(part.material.map);}});for(const geometry of geometries)geometry.dispose();for(const texture of textures)texture.dispose();for(const material of materials)material.dispose();}};
}
