import * as THREE from 'three';
// Two rigid arm segments reaching a fixed wrist, elbow chooses a stable bend plane.
export function solveElbow(shoulder,wrist,hint,upperLength,forearmLength){
 const start=new THREE.Vector3(...shoulder),end=new THREE.Vector3(...wrist),axis=end.clone().sub(start),distance=axis.length();
 if(distance>upperLength+forearmLength+1e-8||distance<Math.abs(upperLength-forearmLength)-1e-8||distance<1e-8)throw new RangeError('Pozycja dłoni jest poza zasięgiem ramienia.');
 axis.divideScalar(distance);const along=(upperLength**2-forearmLength**2+distance**2)/(2*distance),radius=Math.sqrt(Math.max(0,upperLength**2-along**2)),center=start.clone().addScaledVector(axis,along);
 const bend=new THREE.Vector3(...hint).sub(center);bend.addScaledVector(axis,-bend.dot(axis));
 if(bend.lengthSq()<1e-10){bend.crossVectors(axis,Math.abs(axis.y)<0.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0));}
 return center.addScaledVector(bend.normalize(),radius).toArray();
}
