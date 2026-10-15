import * as THREE from 'three';

export const CEILING_PANEL=Object.freeze({width:1,depth:.5,thickness:.11});
export const DEFAULT_CEILING_PANEL_SETTINGS=Object.freeze({drop:0,zOffset:0});

export function normalizeCeilingPanelSettings(input,room){
 const settings=input??DEFAULT_CEILING_PANEL_SETTINGS;
 if(!settings||typeof settings!=='object'||typeof settings.drop!=='number'||!Number.isFinite(settings.drop)||typeof settings.zOffset!=='number'||!Number.isFinite(settings.zOffset)||settings.drop<0||settings.drop>room.height-CEILING_PANEL.thickness||Math.abs(settings.zOffset)>room.length)throw new Error('Nieprawidłowe ustawienia panelu sufitowego.');
 return {drop:settings.drop,zOffset:settings.zOffset};
}

// Center the panel over the complete footprint of ceiling reflections.
// The bounding midpoint keeps both opposite edges equally distant from the
// outermost reflection points even when different drivers have unequal counts.
export function ceilingPanelPlacement(paths,room,settings=DEFAULT_CEILING_PANEL_SETTINGS){
 const points=paths.filter(path=>path.surface==='ceiling'&&path.point);
 if(!points.length)return null;
 const xs=points.map(path=>path.point.x),zs=points.map(path=>path.point.z);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
 const center={x:(minX+maxX)/2,z:(minZ+maxZ)/2};
 const yaw=maxZ-minZ>maxX-minX?Math.PI/2:0;
 const c=Math.cos(yaw),s=Math.sin(yaw),corners=[];
 const halfZ=(CEILING_PANEL.width*Math.abs(s)+CEILING_PANEL.depth*Math.abs(c))/2;
 const zOffsetLimits={min:halfZ-center.z,max:room.length-halfZ-center.z};
 const zOffset=Math.min(zOffsetLimits.max,Math.max(zOffsetLimits.min,settings.zOffset));
 const drop=Math.min(room.height-CEILING_PANEL.thickness,Math.max(0,settings.drop));
 center.z+=zOffset;
 for(const [index,x,z] of [[1,-.5,-.25],[2,.5,-.25],[3,.5,.25],[4,-.5,.25]]){
  const px=center.x+x*c+z*s,pz=center.z-x*s+z*c;
  corners.push({index,x:px,z:pz,front:pz,left:px,right:room.width-px});
 }
 if(corners.some(corner=>corner.left<0||corner.right<0||corner.front<0||corner.z>room.length))return null;
 return {center:{x:center.x,y:room.height-drop-CEILING_PANEL.thickness/2,z:center.z},yaw,corners,reflectionPoints:points.map(path=>path.point.clone()),settings:{drop,zOffset},zOffsetLimits};
}

export function createCeilingPanelView(placement){
 const group=new THREE.Group();group.name='ceiling-panel';group.userData.recordId='ceiling-panel';
 const fabric=new THREE.MeshStandardMaterial({color:0x343a3c,roughness:1});
 const markerMaterial=new THREE.MeshBasicMaterial({color:0xffd470,depthTest:false});
 const panel=new THREE.Mesh(new THREE.BoxGeometry(CEILING_PANEL.width,CEILING_PANEL.thickness,CEILING_PANEL.depth),fabric);
 panel.name='absorber';panel.position.set(placement.center.x,placement.center.y,placement.center.z);panel.rotation.y=placement.yaw;group.add(panel);
 const markerGeometry=new THREE.SphereGeometry(.015,12,8);
 const textures=[];
 for(const corner of placement.corners){
  const marker=new THREE.Mesh(markerGeometry,markerMaterial);marker.name=`corner-${corner.index}`;
  marker.position.set(corner.x,placement.center.y-CEILING_PANEL.thickness/2-.012,corner.z);
  marker.userData.collision=false;marker.renderOrder=32;group.add(marker);
  if(typeof document!=='undefined'){
   const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#172127';ctx.beginPath();ctx.arc(32,32,29,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='#ffd470';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#ffd470';ctx.font='bold 36px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(corner.index),32,34);
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
   const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));
   label.name=`corner-label-${corner.index}`;label.position.copy(marker.position);label.position.y-=.045;label.scale.set(.095,.095,1);label.userData.collision=false;label.renderOrder=33;group.add(label);
  }
 }
 return {group,placement,dispose(){panel.geometry.dispose();markerGeometry.dispose();fabric.dispose();markerMaterial.dispose();for(const child of group.children)if(child.isSprite)child.material.dispose();for(const texture of textures)texture.dispose();}};
}
