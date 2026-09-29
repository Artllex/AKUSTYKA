import * as THREE from 'three';
// Projection is independent of surface visibility in the 3D cutaway.
export function surfaceProjection(surface, aspect, side='inside') {
 const normal=surface.userData.outward;
 const center=surface.position.clone();
 const {width,height}=surface.geometry.parameters;
 const halfHeight=Math.max(height/2,width/(2*aspect))*1.2;
 const distance=Math.max(width,height)*2;
 // Tight depth interval keeps millimetre-scale overlays stable in orthographic views.
 const camera=new THREE.OrthographicCamera(-halfHeight*aspect,halfHeight*aspect,halfHeight,-halfHeight,0.01,distance+Math.max(width,height)*2);
 camera.position.copy(center).addScaledVector(normal,side==='inside'?-distance:distance);
 camera.up.set(0,1,0);
 if(Math.abs(normal.y)>0.9)camera.up.set(0,0,-1);
 camera.lookAt(center);camera.updateMatrixWorld(true);
 return {camera,target:center,halfHeight};
}
