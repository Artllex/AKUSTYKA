import * as THREE from 'three';
import {WALL_PAINT_COLOR} from './wall-paint.js';
import {applyFolignoFloor} from './floor-finish.js';
export function createRoom(room,features,transforms={}){
 const {width:w,length:l,height:h}=room;
 const niche=features?.window,shift=transforms.window??{},left=niche?Math.max(0,niche.center+(shift.x??0)-niche.width/2):0,right=niche?Math.min(w,niche.center+(shift.x??0)+niche.width/2):0,depth=niche&&niche.bottom+(shift.y??0)<=0.001&&right>left?niche.depth:0;
 const perimeter=depth>0?[[0,0],[left,0],[left,-depth],[right,-depth],[right,0],[w,0],[w,l],[0,l]]:[[0,0],[w,0],[w,l],[0,l]];
 const group=new THREE.Group(); group.name='room'; const surfaces=[];
 function surface(name,width,height,position,rotation,normal,color){
  let geometry=new THREE.PlaneGeometry(width,height);
  if(depth>0&&(name==='floor'||(name==='ceiling'&&niche.bottom+niche.height>=h-1e-6))){const shape=new THREE.Shape();const points=perimeter.map(([x,z])=>[x-w/2,name==='floor'?l/2-z:z-l/2]);shape.moveTo(...points[0]);for(const p of points.slice(1))shape.lineTo(...p);shape.closePath();geometry.dispose();geometry=new THREE.ShapeGeometry(shape);geometry.parameters.width=width;geometry.parameters.height=height;}
  const opening=name==='wall-front'?features?.window:name==='wall-back'?features?.door:null;
  if(opening){
   const shape=new THREE.Shape();shape.moveTo(-width/2,-height/2);shape.lineTo(width/2,-height/2);shape.lineTo(width/2,height/2);shape.lineTo(-width/2,height/2);shape.closePath();
   const key=name==='wall-front'?'window':'door',t=transforms[key]??{},origin=new THREE.Vector3(opening.center,opening.bottom??0,position[2]);
   const rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler((t.rx??0)*Math.PI/180,(t.ry??0)*Math.PI/180,(t.rz??0)*Math.PI/180));
   let points=[[-opening.width/2,0],[opening.width/2,0],[opening.width/2,opening.height],[-opening.width/2,opening.height]].map(([x,y])=>{const p=new THREE.Vector3(x,y,0).applyQuaternion(rotation).add(origin).add(new THREE.Vector3(t.x??0,t.y??0,t.z??0));return new THREE.Vector2(p.x-position[0],p.y-position[1]);});
   // Clip the projected aperture to this wall, so translating beyond its edge
   // cannot create triangles outside the original room bounds.
   for(const [axis,bound,sign] of [['x',-width/2,1],['x',width/2,-1],['y',-height/2,1],['y',height/2,-1]]){const clipped=[];for(let i=0;i<points.length;i++){const A=points[i],B=points[(i+1)%points.length],insideA=sign*(A[axis]-bound)>=-1e-10,insideB=sign*(B[axis]-bound)>=-1e-10;if(insideA)clipped.push(A);if(insideA!==insideB){const ratio=(bound-A[axis])/(B[axis]-A[axis]);clipped.push(A.clone().lerp(B,ratio));}}points=clipped;}
   const area=points.reduce((sum,p,i)=>{const next=points[(i+1)%points.length];return sum+p.x*next.y-next.x*p.y;},0);
   if(points.length>=3&&Math.abs(area)>1e-10){
    if((name==='wall-back'||name==='wall-front')&&!(t.rx||t.ry||t.rz)&&(opening.bottom??0)+(t.y??0)<=0){
     const left=Math.min(...points.map(p=>p.x)),right=Math.max(...points.map(p=>p.x)),top=Math.max(...points.map(p=>p.y));
     shape.curves=[];shape.moveTo(-width/2,-height/2);shape.lineTo(left,-height/2);shape.lineTo(left,top);shape.lineTo(right,top);shape.lineTo(right,-height/2);shape.lineTo(width/2,-height/2);shape.lineTo(width/2,height/2);shape.lineTo(-width/2,height/2);shape.closePath();
    }else{if(area>0)points.reverse();const hole=new THREE.Path();hole.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))hole.lineTo(p.x,p.y);hole.closePath();shape.holes.push(hole);}
   }
   let wallShapes=shape;
   if(name==='wall-front'&&!(t.rx||t.ry||t.rz)&&(opening.bottom??0)+(t.y??0)<=0&&opening.height+(opening.bottom??0)+(t.y??0)>=height){
    const low=Math.max(-width/2,opening.center+(t.x??0)-opening.width/2-position[0]),high=Math.min(width/2,opening.center+(t.x??0)+opening.width/2-position[0]);
    if(high>low){wallShapes=[];for(const [a,b] of [[-width/2,low],[high,width/2]])if(b-a>1e-9){const part=new THREE.Shape();part.moveTo(a,-height/2);part.lineTo(b,-height/2);part.lineTo(b,height/2);part.lineTo(a,height/2);part.closePath();wallShapes.push(part);}}
   }
   geometry.dispose();geometry=new THREE.ShapeGeometry(wallShapes);geometry.parameters.width=width;geometry.parameters.height=height;
  }
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,side:THREE.DoubleSide,roughness:0.9}));
  mesh.name=name;mesh.position.set(...position);mesh.rotation.set(...rotation);mesh.userData.outward=new THREE.Vector3(...normal);if(name==='floor')applyFolignoFloor(mesh);group.add(mesh);surfaces.push(mesh);
 }
 surface('floor',w,l,[w/2,0,l/2],[-Math.PI/2,0,0],[0,-1,0],0x4c6572);
 surface('ceiling',w,l,[w/2,h,l/2],[Math.PI/2,0,0],[0,1,0],WALL_PAINT_COLOR);
 surface('wall-front',w,h,[w/2,h/2,0],[0,0,0],[0,0,-1],WALL_PAINT_COLOR);
 surface('wall-back',w,h,[w/2,h/2,l],[0,0,0],[0,0,1],WALL_PAINT_COLOR);
 surface('wall-left',l,h,[0,h/2,l/2],[0,Math.PI/2,0],[-1,0,0],WALL_PAINT_COLOR);
 surface('wall-right',l,h,[w,h/2,l/2],[0,Math.PI/2,0],[1,0,0],WALL_PAINT_COLOR);
 if(depth>0){
  const center=(left+right)/2,width=right-left,top=Math.min(h,niche.bottom+niche.height+(shift.y??0)),stepHeight=niche.stepHeight,stepDepth=niche.stepDepth,front=-depth+stepDepth;
  surface('niche-back',width,top-stepHeight,[center,(top+stepHeight)/2,-depth],[0,0,0],[0,0,-1],WALL_PAINT_COLOR);
  for(const [name,x,normal] of [['niche-left',left,[-1,0,0]],['niche-right',right,[1,0,0]]]){
   surface(name,depth,top-stepHeight,[x,(top+stepHeight)/2,-depth/2],[0,Math.PI/2,0],normal,WALL_PAINT_COLOR);
   if(stepHeight>0&&depth>stepDepth)surface(name+'-lower',depth-stepDepth,stepHeight,[x,stepHeight/2,front/2],[0,Math.PI/2,0],normal,WALL_PAINT_COLOR);
  }
  if(top<h-1e-6)surface('niche-roof',width,depth,[center,top,-depth/2],[Math.PI/2,0,0],[0,1,0],WALL_PAINT_COLOR);
  if(stepHeight>0&&stepDepth>0){
   const sillThickness=Math.min(.015,stepHeight),baseHeight=stepHeight-sillThickness,sillFront=front+.015;
   surface('niche-step-top',width,stepDepth+.015,[center,stepHeight,-depth+(stepDepth+.015)/2],[-Math.PI/2,0,0],[0,-1,0],WALL_PAINT_COLOR);
   if(baseHeight>0)surface('niche-step-front',width,baseHeight,[center,baseHeight/2,front],[0,0,0],[0,0,-1],WALL_PAINT_COLOR);
   surface('niche-sill-front',width,sillThickness,[center,stepHeight-sillThickness/2,sillFront],[0,0,0],[0,0,-1],WALL_PAINT_COLOR);
   surface('niche-sill-underside',width,.015,[center,baseHeight,front+.0075],[-Math.PI/2,0,0],[0,-1,0],WALL_PAINT_COLOR);
   for(const [name,x,normal] of [['niche-sill-left',left,[-1,0,0]],['niche-sill-right',right,[1,0,0]]])surface(name,.015,sillThickness,[x,stepHeight-sillThickness/2,front+.0075],[0,Math.PI/2,0],normal,WALL_PAINT_COLOR);
  }
 }
 const outlinePoints=[];const nicheTop=depth>0?Math.min(h,niche.bottom+niche.height+(shift.y??0)):h;
 for(let i=0;i<perimeter.length;i++){const [x,z]=perimeter[i],[nx,nz]=perimeter[(i+1)%perimeter.length];outlinePoints.push(x,0,z,nx,0,nz);if(depth===0||![1,2,3].includes(i))outlinePoints.push(x,h,z,nx,h,nz);outlinePoints.push(x,0,z,x,depth>0&&[2,3].includes(i)?nicheTop:h,z);}
 if(depth>0){outlinePoints.push(left,nicheTop,0,left,nicheTop,-depth,left,nicheTop,-depth,right,nicheTop,-depth,right,nicheTop,-depth,right,nicheTop,0,left,nicheTop,0,right,nicheTop,0,left,h,0,right,h,0);}
 const outline=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(outlinePoints,3)),new THREE.LineBasicMaterial({color:0xa6cbd5,transparent:true,opacity:0.55}));outline.name='room-outline';group.add(outline);
 const floorEdgePoints=[];for(let i=0;i<perimeter.length;i++){const [x,z]=perimeter[i],[nx,nz]=perimeter[(i+1)%perimeter.length];floorEdgePoints.push(x,0.001,z,nx,0.001,nz);}const floorOutline=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(floorEdgePoints,3)),new THREE.LineBasicMaterial({color:0xa6cbd5}));floorOutline.name='floor-outline';group.add(floorOutline);
 const points=[];for(let x=0;x<=w+1e-9;x+=0.1)points.push(x,0.002,depth>0&&x>=left&&x<=right?-depth:0,x,0.002,l);for(let z=0;z<=l+1e-9;z+=0.1)points.push(0,0.002,z,w,0.002,z);
 const grid=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(points,3)),new THREE.LineBasicMaterial({color:0x9bb7c3,transparent:true,opacity:0.25}));grid.name='floor-grid';group.add(grid);
 const axes=new THREE.AxesHelper(0.65);axes.position.set(0,0.01,0);group.add(axes);
 return {group,surfaces,grid,updateVisibility(camera,cutaway){for(const s of surfaces){const facing=s.userData.outward.dot(camera.position.clone().sub(s.position));s.visible=!!s.userData.monitorCollision||!cutaway||s.name==='floor'||(s.name!=='ceiling'&&facing<=0);}},dispose(){group.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});}};
}

export function addNicheStepToMeshRoom(view,stepHeight,stepDepth){
 const roof=view.surfaces.find(s=>s.name==='niche-roof');if(!roof||stepHeight<=0||stepDepth<=0)return;
 view.group.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(roof),width=bounds.max.x-bounds.min.x,center=(bounds.min.x+bounds.max.x)/2,back=bounds.min.z,front=back+stepDepth;
 function add(name,w,h,position,rotation,outward){
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({color:WALL_PAINT_COLOR,side:THREE.DoubleSide,roughness:.9}));
  mesh.name=name;mesh.position.set(...position);mesh.rotation.set(...rotation);mesh.userData.outward=new THREE.Vector3(...outward);view.group.add(mesh);view.surfaces.push(mesh);
 }
 const sillThickness=Math.min(.015,stepHeight),baseHeight=stepHeight-sillThickness;
 add('niche-step-top',width,stepDepth+.015,[center,stepHeight,back+(stepDepth+.015)/2],[-Math.PI/2,0,0],[0,-1,0]);
 if(baseHeight>0)add('niche-step-front',width,baseHeight,[center,baseHeight/2,front],[0,0,0],[0,0,-1]);
 add('niche-sill-front',width,sillThickness,[center,stepHeight-sillThickness/2,front+.015],[0,0,0],[0,0,-1]);
 add('niche-sill-underside',width,.015,[center,baseHeight,front+.0075],[-Math.PI/2,0,0],[0,-1,0]);
 for(const [name,x,normal] of [['niche-sill-left',center-width/2,[-1,0,0]],['niche-sill-right',center+width/2,[1,0,0]]])add(name,.015,sillThickness,[x,stepHeight-sillThickness/2,front+.0075],[0,Math.PI/2,0],normal);
}
