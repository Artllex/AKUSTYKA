import * as THREE from 'three';

// The supplied Foligno sample spans approximately 1.8 × 1.792 m: its
// 193-pixel rows correspond to the manufacturer's 193 mm plank width.
export const FOLIGNO_PLANK={length:1.291,width:.193,thickness:.008};
export const FOLIGNO_SAMPLE={width:1.8,height:1.792};
let floorTexture;

export function applyFolignoFloor(mesh){
 const positions=mesh.geometry.getAttribute('position'),uv=[];
 mesh.updateMatrixWorld(true);
 for(let i=0;i<positions.count;i++){
  const point=mesh.localToWorld(new THREE.Vector3().fromBufferAttribute(positions,i));
  uv.push(point.z/FOLIGNO_SAMPLE.width,point.x/FOLIGNO_SAMPLE.height);
 }
 mesh.geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 mesh.material.color.set(0xffffff);
 mesh.material.roughness=.92;
 if(typeof document==='undefined')return;
 if(!floorTexture){
  floorTexture=new THREE.TextureLoader().load(new URL('./assets/foligno-floor.png',import.meta.url).href);
  floorTexture.colorSpace=THREE.SRGBColorSpace;
  floorTexture.wrapS=floorTexture.wrapT=THREE.MirroredRepeatWrapping;
  floorTexture.anisotropy=8;
 }
 mesh.material.map=floorTexture;
 mesh.material.needsUpdate=true;
}
