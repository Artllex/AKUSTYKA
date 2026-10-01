import * as THREE from 'three';

export function distanceText(metres){return `${(metres*100).toFixed(1).replace('.',',')} cm`;}

export function createDistanceLabel(metres,position,color=0xffffff){
 const label=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthTest:false,depthWrite:false}));
 label.name='distance-label';label.userData.distance=metres;label.userData.label=distanceText(metres);
 label.visible=false;
 label.position.copy(position);label.userData.anchor=position.clone();label.renderOrder=30;
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=96;
  const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(16,25,33,.92)';ctx.beginPath();ctx.roundRect(4,4,312,88,22);ctx.fill();
  ctx.strokeStyle='#a7bdc9';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle=`#${new THREE.Color(color).getHexString()}`;
  ctx.font='600 47px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label.userData.label,160,49);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;label.material.map=texture;label.material.needsUpdate=true;
 }
 label.scale.set(.36,.108,1);return label;
}

export function updateDistanceLabels(group,camera){
 if(!group)return;
 const screenUp=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
 for(const label of group.children)if(label.isSprite&&label.userData.anchor)label.position.copy(label.userData.anchor).addScaledVector(screenUp,label.scale.y/2+.045);
}

export function hoverDistanceLabel(groups,camera,cursor,width,height){
 let closest=null,best=10*10;
 for(const group of groups){
  if(!group?.visible)continue;
  for(const line of group.children){
   const label=line.userData.distanceLabel;
   if(!label)continue;
   label.visible=false;
   if(!cursor||!line.visible)continue;
   const start=line.userData.origin??line.userData.start;
   const end=line.userData.target??line.userData.end;
   if(!start||!end)continue;
   const a=start.clone().project(camera),b=end.clone().project(camera);
   if(a.z>1&&b.z>1||a.z< -1&&b.z< -1)continue;
   const ax=(a.x+1)*width/2,ay=(1-a.y)*height/2;
   const bx=(b.x+1)*width/2,by=(1-b.y)*height/2;
   const dx=bx-ax,dy=by-ay,denominator=dx*dx+dy*dy;
   const t=denominator?Math.max(0,Math.min(1,((cursor.x-ax)*dx+(cursor.y-ay)*dy)/denominator)):0;
   const distance=(cursor.x-ax-t*dx)**2+(cursor.y-ay-t*dy)**2;
   if(distance<best){best=distance;closest=label;}
  }
 }
 if(closest)closest.visible=true;
 return closest;
}
