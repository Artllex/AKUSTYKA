import * as THREE from 'three';
export function defaultRoomFeatures(room){return {
 door:{center:room.width*0.25,width:Math.min(0.85,room.width*0.4),height:Math.min(2.05,room.height*0.85),depth:0.12},
 window:{center:room.width*(1.072/2.477),width:Math.min(1.038,room.width*0.44),bottom:0,height:room.height,depth:0.086},
 radiator:{center:room.width*0.80,width:Math.min(0.45,room.width*0.19),bottom:0.12,height:Math.min(0.65,room.height*0.26),depth:0.12}
};}
export function normalizeRoomFeatures(input,room){
 const features=input??defaultRoomFeatures(room);
 for(const [name,f] of Object.entries(features)){
  if(!['door','window','radiator'].includes(name)||!f||Object.values(f).some(v=>!Number.isFinite(v)))throw new Error('Nieprawidłowe wymiary elementów pokoju.');
  const required=name==='door'?['center','width','height','depth']:['center','width','height','depth','bottom'];if(required.some(key=>!Number.isFinite(f[key])))throw new Error('Brak wymiaru elementu: '+name);
  const bottom=f.bottom??0;
  if(f.width<=0||f.height<=0||f.depth<=0||f.depth>0.6||f.center-f.width/2<0||f.center+f.width/2>room.width||bottom<0||bottom+f.height>room.height)throw new Error('Element nie mieści się na ścianie: '+name);
 }
 if(!features.door||!features.window||!features.radiator)throw new Error('Brak elementów pokoju.');
 return structuredClone(features);
}
export function createRoomFeatureViews(room,features){
 const result=[];
 function create(name){const group=new THREE.Group();group.name=name;group.userData.recordId=name;const materials=[];
  function mat(color,extra={}){const m=new THREE.MeshStandardMaterial({color,roughness:0.7,...extra});materials.push(m);return m;}
  function box(name,size,position,material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.name=name;mesh.position.set(...position);group.add(mesh);return mesh;}
  const item={group,dispose(){group.traverse(o=>o.geometry?.dispose());materials.forEach(m=>m.dispose());}};result.push(item);return {group,mat,box};
 }
 const d=features.door,D=create('door'),wood=D.mat(0x92745b),trim=D.mat(0xd2c6b6),handle=D.mat(0xb5bec1,{metalness:0.75,roughness:0.2});
 D.box('door-leaf',[d.width-0.07,d.height-0.04,0.04],[d.center,d.height/2,room.length+0.035],wood);
 for(const side of [-1,1])D.box('door-jamb',[0.055,d.height,d.depth],[d.center+side*(d.width/2-0.025),d.height/2,room.length+0.02],trim);
 D.box('door-lintel',[d.width,0.055,d.depth],[d.center,d.height-0.025,room.length+0.02],trim);
 D.box('door-handle',[0.11,0.018,0.035],[d.center-d.width*0.33,1.0,room.length-0.005],handle);
 const w=features.window,W=create('window'),reveal=W.mat(0x9aafb8);
 const middle=w.bottom+w.height/2;
 for(const side of [-1,1])W.box('window-reveal-side',[0.01,w.height,w.depth],[w.center+side*(w.width/2-0.005),middle,-w.depth/2],reveal);
 W.box('recess-back',[w.width,w.height,0.01],[w.center,middle,-w.depth-0.005],reveal);
 const r=features.radiator,R=create('radiator'),enamel=R.mat(0xe0e2dc),pipe=R.mat(0xbec5c1,{metalness:0.5});
 R.box('radiator-body',[r.width,r.height,r.depth],[r.center,r.bottom+r.height/2,r.depth/2+0.03],enamel);
 const ribs=Math.max(4,Math.round(r.width/0.04));for(let i=0;i<ribs;i++)R.box('radiator-rib',[0.012,r.height-0.06,0.008],[r.center-r.width/2+(i+0.5)*r.width/ribs,r.bottom+r.height/2,r.depth+0.034],pipe);
 for(const side of [-1,1])R.box('radiator-pipe',[0.018,r.bottom+0.08,0.018],[r.center+side*(r.width/2-0.03),(r.bottom+0.08)/2,0.055],pipe);
 for(const [item,pivot] of [[result[0],[d.center,0,room.length]],[result[1],[w.center,w.bottom,0]],[result[2],[r.center,r.bottom,0]]]){const origin=new THREE.Vector3(...pivot);for(const child of item.group.children)child.position.sub(origin);item.group.position.copy(origin);item.group.updateMatrixWorld(true);}
 return result;
}
