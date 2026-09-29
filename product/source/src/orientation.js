import * as THREE from 'three';
export const DIRECTIONS=Object.freeze({north:[0,0,-1],east:[1,0,0],down:[0,-1,0]});
// Orthographic axis-aligned cameras can acquire tiny signed errors from controls.
// Snap only numerical noise so labels and dashed lines cannot flip every frame.
export function orientationDirections(camera){
 const inverse=camera.quaternion.clone().invert();
 return Object.fromEntries(Object.entries(DIRECTIONS).map(([name,axis])=>{
  const d=new THREE.Vector3(...axis).applyQuaternion(inverse);
  for(const key of ['x','y','z'])if(Math.abs(d[key])<1e-6)d[key]=0;
  return [name,d];
 }));
}
export function createOrientation(host){
 host.innerHTML='<svg viewBox="5 10 160 125" role="img" aria-label="Orientacja kamery: północ, wschód, dół"><circle cx="85" cy="70" r="49" fill="none" stroke="#344956"/><g id="north"><line/><circle r="3"/><text>Północ N</text></g><g id="east"><line/><circle r="3"/><text>Wschód E</text></g><g id="down"><line/><circle r="3"/><text>Dół</text></g></svg>';
 const colors={north:'#8ddac6',east:'#efa180',down:'#93baf5'};
 const groups=Object.entries(DIRECTIONS).map(([name,axis])=>({name,axis:new THREE.Vector3(...axis),node:host.querySelector('#'+name)}));
 
 return {update(camera){const directions=orientationDirections(camera);for(const {name,node} of groups){const d=directions[name],x=85+d.x*44,y=70-d.y*44;const line=node.querySelector('line'),dot=node.querySelector('circle'),label=node.querySelector('text');line.setAttribute('x1',85);line.setAttribute('y1',70);line.setAttribute('x2',x);line.setAttribute('y2',y);line.setAttribute('stroke',colors[name]);line.setAttribute('stroke-width',2);line.setAttribute('stroke-dasharray',d.z<0?'3 3':'');dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.setAttribute('fill',colors[name]);label.setAttribute('x',Math.max(29,Math.min(141,x)));label.setAttribute('y',y+(d.y>0? -9:16));label.setAttribute('fill',colors[name]);label.setAttribute('text-anchor','middle');label.setAttribute('font-size',10);label.textContent=(name==='north'?'Północ N':name==='east'?'Wschód E':'Dół')+(Math.hypot(d.x,d.y)<0.05?(d.z<0?' ⊗':' ⊙'):'');}}};
}


