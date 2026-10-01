import * as THREE from 'three';

export const BASEBOARD_HEIGHT=0.04;
export const BASEBOARD_DEPTH=0.015;

export function createBaseboards(points,room,door,doorOffsetX=0){
 const group=new THREE.Group();group.name='baseboards';
 const n=points.length,area=points.reduce((sum,a,i)=>{const b=points[(i+1)%n];return sum+a.x*b.z-b.x*a.z;},0),side=area>=0?1:-1;
 const material=new THREE.MeshStandardMaterial({color:0xc8c7bd,roughness:0.72,side:THREE.DoubleSide});
 const doorLeft=door.center-door.width/2+doorOffsetX,doorRight=door.center+door.width/2+doorOffsetX;
 const edges=points.map((a,i)=>{const b=points[(i+1)%n],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);return {length,normal:{x:-side*dz/length,z:side*dx/length}};});
 const joins=points.map((p,i)=>{
  const before=edges[(i+n-1)%n].normal,after=edges[i].normal,dot=before.x*after.x+before.z*after.z,denom=1+dot;
  if(denom<0.15)return {x:p.x+after.x*BASEBOARD_DEPTH,z:p.z+after.z*BASEBOARD_DEPTH};
  const scale=Math.min(BASEBOARD_DEPTH/denom,BASEBOARD_DEPTH*3/Math.hypot(before.x+after.x,before.z+after.z));
  return {x:p.x+(before.x+after.x)*scale,z:p.z+(before.z+after.z)*scale};
 });
 function segment(a,b,innerA,innerB,edgeIndex){
  const length=Math.hypot(b.x-a.x,b.z-a.z);if(length<1e-8)return;
  const polygon=[a,b,innerB,innerA],positions=[];
  for(const y of [0,BASEBOARD_HEIGHT])for(const p of polygon)positions.push(p.x,y,p.z);
  const indices=[0,2,1,0,3,2,4,5,6,4,6,7];
  for(let j=0;j<4;j++){const k=(j+1)%4;indices.push(j,k,k+4,j,k+4,j+4);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  geometry.parameters={width:length,height:BASEBOARD_HEIGHT,depth:BASEBOARD_DEPTH};
  const mesh=new THREE.Mesh(geometry,material);mesh.name='baseboard';mesh.userData={collision:false,edgeIndex,start:a,end:b,innerStart:innerA,innerEnd:innerB};group.add(mesh);
 }
 for(let i=0;i<n;i++){
  const a=points[i],b=points[(i+1)%n],normal=edges[i].normal;
  if(Math.abs(a.z-room.length)<1e-7&&Math.abs(b.z-room.length)<1e-7&&Math.abs(a.x-b.x)>1e-8){
   const cuts=[a.x,b.x,doorLeft,doorRight].filter(x=>x>=Math.min(a.x,b.x)-1e-8&&x<=Math.max(a.x,b.x)+1e-8).sort((x,y)=>x-y);
   for(let j=0;j+1<cuts.length;j++){
    const low=cuts[j],high=cuts[j+1],middle=(low+high)/2;
    if(high-low<=1e-8||(middle>=doorLeft&&middle<=doorRight))continue;
    const startX=a.x<b.x?low:high,endX=a.x<b.x?high:low;
    const start={x:startX,z:a.z},end={x:endX,z:a.z};
    const innerStart=Math.abs(startX-a.x)<1e-8?joins[i]:{x:startX+normal.x*BASEBOARD_DEPTH,z:a.z+normal.z*BASEBOARD_DEPTH};
    const innerEnd=Math.abs(endX-b.x)<1e-8?joins[(i+1)%n]:{x:endX+normal.x*BASEBOARD_DEPTH,z:b.z+normal.z*BASEBOARD_DEPTH};
    segment(start,end,innerStart,innerEnd,i);
   }
  }else segment(a,b,joins[i],joins[(i+1)%n],i);
 }
 return {group,dispose(){group.traverse(o=>o.geometry?.dispose());material.dispose();}};
}
