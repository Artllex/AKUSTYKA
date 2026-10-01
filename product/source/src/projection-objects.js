import * as THREE from 'three';

const boundsCache=new WeakMap();

export function objectOnProjectionSide(group,surface,side){
 if(!group||!surface)return false;
 let bounds=boundsCache.get(group);
 if(!bounds){group.updateWorldMatrix(true,true);bounds=new THREE.Box3().setFromObject(group);boundsCache.set(group,bounds);}
 if(bounds.isEmpty())return false;
 const normal=surface.userData.outward,center=bounds.getCenter(new THREE.Vector3());
 const half=bounds.getSize(new THREE.Vector3()).multiplyScalar(.5);
 const distance=normal.dot(center.sub(surface.getWorldPosition(new THREE.Vector3())));
 const radius=Math.abs(normal.x)*half.x+Math.abs(normal.y)*half.y+Math.abs(normal.z)*half.z;
 return (side==='inside'?-distance:distance)+radius>1e-4;
}
