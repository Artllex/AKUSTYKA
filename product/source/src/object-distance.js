import * as THREE from 'three';
function triangleData(object){object.updateWorldMatrix(true,true);const data=[];object.traverse(mesh=>{
 if(!mesh.isMesh||mesh.userData.collision===false||mesh.name.startsWith('center-')||mesh.name==='brand'||mesh.name==='power-led')return;
 let node=mesh;while(node){if(node!==object&&!node.visible)return;node=node.parent;}
 const position=mesh.geometry.attributes.position,index=mesh.geometry.index;if(!position)return;
 for(let i=0,n=index?index.count:position.count;i<n;i+=3){const vertices=[0,1,2].map(k=>new THREE.Vector3().fromBufferAttribute(position,index?index.getX(i+k):i+k).applyMatrix4(mesh.matrixWorld));const triangle=new THREE.Triangle(...vertices),box=new THREE.Box3().setFromPoints(vertices);data.push({triangle,box,center:box.getCenter(new THREE.Vector3())});}
 });return data;}
function tree(items){const box=new THREE.Box3();for(const item of items)box.union(item.box);if(items.length<=8)return {box,items};const size=box.getSize(new THREE.Vector3()),axis=size.x>=size.y&&size.x>=size.z?'x':size.y>=size.z?'y':'z';items.sort((a,b)=>a.center[axis]-b.center[axis]);const middle=Math.floor(items.length/2);return {box,left:tree(items.slice(0,middle)),right:tree(items.slice(middle))};}
function lowerBound(a,b){let distance=0;for(const axis of ['x','y','z']){const delta=Math.max(0,a.min[axis]-b.max[axis],b.min[axis]-a.max[axis]);distance+=delta*delta;}return distance;}
function segments(a,b,c,d){const u=b.clone().sub(a),v=d.clone().sub(c),w=a.clone().sub(c),A=u.dot(u),B=u.dot(v),C=v.dot(v),D=u.dot(w),E=v.dot(w),den=A*C-B*B,clamp=x=>Math.max(0,Math.min(1,x));let s=A<1e-20?0:den>1e-20?clamp((B*E-C*D)/den):0,t=C<1e-20?0:(B*s+E)/C;if(t<0){t=0;s=A<1e-20?0:clamp(-D/A);}else if(t>1){t=1;s=A<1e-20?0:clamp((B-D)/A);}return [a.clone().addScaledVector(u,s),c.clone().addScaledVector(v,t)];}
function compareTriangles(a,b,offer){const av=[a.a,a.b,a.c],bv=[b.a,b.b,b.c];for(const v of av)offer(v,b.closestPointToPoint(v,new THREE.Vector3()));for(const v of bv)offer(a.closestPointToPoint(v,new THREE.Vector3()),v);
 for(const [vertices,target] of [[av,b],[bv,a]])for(let i=0;i<3;i++){const start=vertices[i],end=vertices[(i+1)%3],delta=end.clone().sub(start),length=delta.length();if(length>1e-12){const ray=new THREE.Ray(start,delta.divideScalar(length)),hit=ray.intersectTriangle(target.a,target.b,target.c,false,new THREE.Vector3());if(hit&&hit.distanceTo(start)<=length+1e-9)offer(hit,hit);}}
 for(let i=0;i<3;i++)for(let j=0;j<3;j++){const [p,q]=segments(av[i],av[(i+1)%3],bv[j],bv[(j+1)%3]);offer(p,q);}
}
// Exact closest points on rendered physical triangles; bounds only prune search.
export function distanceBetweenObjects(first,second){const a=triangleData(first),b=triangleData(second);if(!a.length||!b.length)return null;let best=Infinity,result=null;const offer=(p,q)=>{const squared=p.distanceToSquared(q);if(squared<best){best=squared;result={start:p.clone(),end:q.clone(),distance:Math.sqrt(squared)};}};
 function visit(A,B){if(best<1e-18||lowerBound(A.box,B.box)>best+1e-18)return;if(A.items&&B.items){for(const a of A.items)for(const b of B.items)if(lowerBound(a.box,b.box)<=best)compareTriangles(a.triangle,b.triangle,offer);return;}
 const pairs=A.items?[[A,B.left],[A,B.right]]:B.items?[[A.left,B],[A.right,B]]:[[A.left,B.left],[A.left,B.right],[A.right,B.left],[A.right,B.right]];pairs.sort((a,b)=>lowerBound(a[0].box,a[1].box)-lowerBound(b[0].box,b[1].box));for(const [a,b] of pairs)visit(a,b);
 }visit(tree(a),tree(b));return result;}
