import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {MM27,MM27_DRIVERS,normalizeMonitorRecord} from './monitor-model.js';
export function createStudioMonitor(record){
 record=normalizeMonitorRecord(record);
 const group=new THREE.Group();group.name=record.id;group.userData.recordId=record.id;group.userData.channel=record.channel;
 const shell=new THREE.MeshStandardMaterial({color:0x202124,roughness:0.94}),metal=new THREE.MeshStandardMaterial({color:0xc4c6c5,roughness:0.43,metalness:0.64}),frontPlate=new THREE.MeshStandardMaterial({color:0xe2e2df,roughness:0.55,metalness:0.18}),rubber=new THREE.MeshStandardMaterial({color:0x111215,roughness:0.91}),cone=new THREE.MeshStandardMaterial({color:0x33363a,metalness:0.08,roughness:0.78}),sideCone=new THREE.MeshBasicMaterial({color:0xe2e3df,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-20,polygonOffsetUnits:-100}),darkMetal=new THREE.MeshStandardMaterial({color:0x292b2e,roughness:0.6,metalness:0.4});
 // Deterministic depth layers for almost coplanar cabinet/driver surfaces.
 for(const [material,layer] of [[metal,1],[cone,2],[darkMetal,2],[rubber,3]]){material.polygonOffset=true;material.polygonOffsetFactor=-layer;material.polygonOffsetUnits=-layer*8;}
 function mesh(name,geometry,material,position,parent=group){const o=new THREE.Mesh(geometry,material);o.name=name;o.position.set(...position);parent.add(o);return o;}
 const {width:w,height:h,depth:d}=MM27.cabinet;
 mesh('cabinet',new RoundedBoxGeometry(w,h,d,3,0.022),shell,[0,h/2,0]);
 // The pale baffle must sit in front of the black cabinet face (z = d/2).
 mesh('baffle',new RoundedBoxGeometry(0.179,0.441,0.001,2,0.008),frontPlate,[0,h/2,0.1966]);
 mesh('tweeter-panel-border',new RoundedBoxGeometry(0.167,0.076,0.0001,2,0.018),darkMetal,[0,0.2605,0.19715]);
 mesh('tweeter-panel',new RoundedBoxGeometry(0.165,0.074,0.0001,2,0.017),frontPlate,[0,0.2605,0.19724]);
 mesh('rear-plate',new RoundedBoxGeometry(0.214,0.482,0.004,2,0.012),metal,[0,h/2,-0.199]);
 mesh('rear-amplifier',new THREE.BoxGeometry(0.165,0.28,0.044),darkMetal,[0,0.329,-0.223]);
 for(let i=0;i<16;i++)mesh('heatsink-fin',new THREE.BoxGeometry(0.003,0.28,0.028),shell,[-0.075+i*0.010,0.329,-0.231]);
 for(const x of [-0.082,0.082])for(const y of [0.042,0.145,0.247,0.391,0.475]){
  const screw=mesh('rear-fastener',new THREE.CylinderGeometry(0.0045,0.0045,0.001,12),rubber,[x,y,-0.202]);screw.rotation.x=Math.PI/2;
 }
 for(const x of [-0.045,0.005]){
  const socket=mesh('rear-xlr',new THREE.CylinderGeometry(0.014,0.014,0.003,24),rubber,[x,0.104,-0.204]);socket.rotation.x=Math.PI/2;
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const pin=mesh('rear-xlr-pin',new THREE.CircleGeometry(0.0018,8),metal,[x+Math.cos(a)*0.006,0.104+Math.sin(a)*0.006,-0.206]);pin.rotation.y=Math.PI;}
 }
 mesh('rear-power-inlet',new THREE.BoxGeometry(0.032,0.026,0.003),rubber,[-0.02,0.045,-0.203]);
 mesh('rear-level-control',new THREE.CylinderGeometry(0.011,0.011,0.004,24),rubber,[0.066,0.103,-0.204]).rotation.x=Math.PI/2;
 for(const driver of MM27_DRIVERS){
  const face=new THREE.Group();face.name='driver-'+driver.id;face.position.set(...driver.center);face.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(...driver.normal));group.add(face);
  const r=driver.diameter/2,frame=driver.id==='tweeter'?0.031:r+0.009;
  const isSide=driver.id.startsWith('sub-'),isTweeter=driver.id==='tweeter',surfaceOffset=isSide?0:0.00032;
  mesh('frame',new THREE.RingGeometry(r*0.88,frame,48),rubber,[0,0,surfaceOffset+0.00001],face);
  const surround=mesh('surround',new THREE.TorusGeometry(r*0.87,r*0.10,8,40),rubber,[0,0,surfaceOffset+0.00002-r*0.10*0.03],face);surround.scale.z=0.03;
  mesh('diaphragm',new THREE.CircleGeometry(r*0.80,48),cone,[0,0,surfaceOffset+0.00002],face);
  if(isSide)mesh('side-white-cone',new THREE.RingGeometry(r*0.40,r*0.70,48),sideCone,[0,0,0.00016],face);
  else if(!isTweeter)mesh('midbass-inner-cone',new THREE.RingGeometry(r*0.26,r*0.67,48),darkMetal,[0,0,surfaceOffset+0.00006],face);
  else mesh('tweeter-silver-dome',new THREE.CircleGeometry(r*0.23,24),metal,[0,0,surfaceOffset+0.00007],face);
  const dome=mesh('dust-cap',new THREE.SphereGeometry(r*(isSide?0.39:isTweeter?0.18:0.27),24,12),rubber,[0,0,surfaceOffset+(isSide?0.00019:0.00009)],face);dome.scale.z=isSide?0.001:0.004;
  for(let i=0;i<(isTweeter?4:6);i++){const a=i*Math.PI*2/(isTweeter?4:6);const screw=mesh('screw',new THREE.SphereGeometry(0.002,6,4),darkMetal,[Math.cos(a)*(frame-0.004),Math.sin(a)*(frame-0.004),isSide?-0.002:surfaceOffset],face);if(!isSide)screw.scale.z=0.03;}
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
  const ctx=canvas.getContext('2d');ctx.fillStyle='#575b60';ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.fillText('BAREFOOT',256,52);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  mesh('brand',new THREE.PlaneGeometry(0.123,0.019),new THREE.MeshBasicMaterial({map:texture,transparent:true}),[0,0.460,0.19732]);
  const modelCanvas=document.createElement('canvas');modelCanvas.width=512;modelCanvas.height=80;
  const modelContext=modelCanvas.getContext('2d');modelContext.fillStyle='#575b60';modelContext.font='bold 37px sans-serif';modelContext.textAlign='center';modelContext.fillText('MicroMain27',256,51);
  const modelTexture=new THREE.CanvasTexture(modelCanvas);modelTexture.colorSpace=THREE.SRGBColorSpace;
  mesh('model-lettering',new THREE.PlaneGeometry(0.135,0.018),new THREE.MeshBasicMaterial({map:modelTexture,transparent:true}),[0,0.056,0.19732]);
 }
 const powerLed=mesh('power-led',new THREE.SphereGeometry(0.002,8,6),new THREE.MeshBasicMaterial({color:0x75dcca}),[0.043,0.2605,0.1973]);powerLed.scale.z=0.03;
 group.position.set(record.position.x,record.position.y,record.position.z);group.rotation.y=record.yaw;group.updateMatrixWorld(true);
 return {group,getRearFaceCenter(){return group.localToWorld(new THREE.Vector3(0,h/2,-0.245));},getDriverCenters(){return MM27_DRIVERS.map(driver=>({id:driver.id,label:driver.label,color:driver.color,position:group.localToWorld(new THREE.Vector3(...driver.center)),normal:new THREE.Vector3(...driver.normal).applyQuaternion(group.quaternion)}));},dispose(){const geometries=new Set(),materials=new Set(),textures=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);if(o.material?.map)textures.add(o.material.map);});for(const t of textures)t.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}};
}



