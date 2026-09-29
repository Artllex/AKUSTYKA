import * as THREE from 'three';
import {EMPTY_TRANSFORM} from './object-transform.js';
export function distanceAdjustment(result,current,movingFirst,delta,firstCenter,secondCenter){
 if(!Number.isFinite(delta))throw new Error('Nieprawidłowy krok pomiaru.');
 const direction=result.start.clone().sub(result.end);
 if(direction.lengthSq()<1e-16)direction.copy(firstCenter).sub(secondCenter);
 if(direction.lengthSq()<1e-16)direction.set(1,0,0);
 direction.normalize().multiplyScalar(movingFirst?1:-1);
 const step=delta<0?-Math.min(-delta,result.distance):delta;
 const next={...EMPTY_TRANSFORM,...current};for(const axis of ['x','y','z'])next[axis]+=direction[axis]*step;
 return next;
}
