import * as THREE from 'three';

export function distanceText(metres){return `${(metres*100).toFixed(1).replace('.',',')} cm`;}

export function createDistanceLabel(metres,position,color=0xffffff){
 const label=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthTest:false,depthWrite:false}));
 label.name='distance-label';label.userData.distance=metres;label.userData.label=distanceText(metres);
 label.position.copy(position);label.renderOrder=30;
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=96;
  const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(16,25,33,.92)';ctx.beginPath();ctx.roundRect(4,4,312,88,22);ctx.fill();
  ctx.strokeStyle='#a7bdc9';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle=`#${new THREE.Color(color).getHexString()}`;
  ctx.font='600 47px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label.userData.label,160,49);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;label.material.map=texture;label.material.needsUpdate=true;
 }
 label.scale.set(.36,.108,1);return label;
}
