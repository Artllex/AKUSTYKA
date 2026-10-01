import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {MM27,MM27_DRIVERS,normalizeMonitorRecord} from './monitor-model.js';
export function createStudioMonitor(record){
 record=normalizeMonitorRecord(record);
 const group=new THREE.Group();group.name=record.id;group.userData.recordId=record.id;group.userData.channel=record.channel;
 const shell=new THREE.MeshStandardMaterial({color:0x25272c,roughness:0.87}),metal=new THREE.MeshStandardMaterial({color:0x3a3e44,roughness:0.6,metalness:0.35}),rubber=new THREE.MeshStandardMaterial({color:0x111419,roughness:0.96}),cone=new THREE.MeshStandardMaterial({color:0x50565e,metalness:0.15,roughness:0.7});
 // Deterministic depth layers for almost coplanar cabinet/driver surfaces.
 for(const [material,layer] of [[metal,1],[cone,2],[rubber,3]]){material.polygonOffset=true;material.polygonOffsetFactor=-layer;material.polygonOffsetUnits=-layer*8;}
 function mesh(name,geometry,material,position,parent=group){const o=new THREE.Mesh(geometry,material);o.name=name;o.position.set(...position);parent.add(o);return o;}
 const {width:w,height:h,depth:d}=MM27.cabinet;
 mesh('cabinet',new RoundedBoxGeometry(w,h,d,3,0.022),shell,[0,h/2,0]);
 // Front face and driver surfaces lie within the published envelope.
 mesh('baffle',new RoundedBoxGeometry(0.179,0.441,0.005,2,0.008),metal,[0,h/2,0.1925]);
 mesh('rear-amplifier',new THREE.BoxGeometry(0.165,0.405,0.048),metal,[0,h/2,-0.221]);
 for(let x=-0.07;x<0.075;x+=0.014)mesh('heatsink-fin',new THREE.BoxGeometry(0.004,0.28,0.025),shell,[x,h/2,-0.2325]);
 for(const driver of MM27_DRIVERS){
  const face=new THREE.Group();face.name='driver-'+driver.id;face.position.set(...driver.center);face.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(...driver.normal));group.add(face);
  const r=driver.diameter/2,frame=driver.id==='tweeter'?0.031:r+0.009;
  mesh('frame',new THREE.RingGeometry(r*0.88,frame,40),metal,[0,0,0.00001],face);
  const surround=mesh('surround',new THREE.TorusGeometry(r*0.87,r*0.10,8,40),rubber,[0,0,0.00002-r*0.10*0.03],face);surround.scale.z=0.03;
  mesh('diaphragm',new THREE.CircleGeometry(r*0.80,40),cone,[0,0,0.00002],face);
  const dome=mesh('dust-cap',new THREE.SphereGeometry(r*0.29,20,10),rubber,[0,0,0.00006],face);dome.scale.z=0.004;
  for(let i=0;i<6;i++){const a=i*Math.PI/3;mesh('screw',new THREE.SphereGeometry(0.002,6,4),rubber,[Math.cos(a)*(frame-0.004),Math.sin(a)*(frame-0.004),-0.002],face);}
  // Surface center = geometric center of the visible driver plane. Offset only
  // the yellow marker outward for visibility; preserve true center in userData.
  const marker=mesh('center-'+driver.id,new THREE.SphereGeometry(0.0045,12,8),new THREE.MeshBasicMaterial({color:driver.color}),[0,0,0.0045],face);
  marker.visible=record.centersVisible;marker.userData.driverId=driver.id;
  marker.userData.surfaceCenter=new THREE.Vector3(...driver.center);
  const cross=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.009,0,0.001),new THREE.Vector3(0.009,0,0.001),new THREE.Vector3(0,-0.009,0.001),new THREE.Vector3(0,0.009,0.001)]),new THREE.LineBasicMaterial({color:driver.color}));cross.name='cross-'+driver.id;cross.visible=record.centersVisible;face.add(cross);
 }
 // Lightweight lettering generated locally; no external textures or assets.
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=80;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#c7cbd0';ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.fillText('BAREFOOT',256,52);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  mesh('brand',new THREE.PlaneGeometry(0.123,0.019),new THREE.MeshBasicMaterial({map:texture,transparent:true}),[0,0.460,0.1971]);
 }
 mesh('power-led',new THREE.SphereGeometry(0.002,8,6),new THREE.MeshBasicMaterial({color:0x75dcca}),[0.043,0.2605,0.195]);
 group.position.set(record.position.x,record.position.y,record.position.z);group.rotation.y=record.yaw;group.updateMatrixWorld(true);
 return {group,getRearFaceCenter(){return group.localToWorld(new THREE.Vector3(0,h/2,-0.245));},getDriverCenters(){return MM27_DRIVERS.map(driver=>({id:driver.id,label:driver.label,color:driver.color,position:group.localToWorld(new THREE.Vector3(...driver.center)),normal:new THREE.Vector3(...driver.normal).applyQuaternion(group.quaternion)}));},dispose(){const geometries=new Set(),materials=new Set(),textures=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);if(o.material?.map)textures.add(o.material.map);});for(const t of textures)t.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}};
}



