import * as THREE from 'three';
import {CEILING_PANEL} from './ceiling-panel.js';

export const WALL_PANEL=CEILING_PANEL;
export const WALL_PANEL_BOTTOMS=Object.freeze([.32,1.32]);

export function wallPanelPlacement(paths,room,side){
 if(side!=='left'&&side!=='right')throw new Error('Nieznana ściana boczna.');
 const points=paths.filter(path=>path.surface===`wall-${side}`&&path.point);
 if(!points.length)return null;
 const zs=points.map(path=>path.point.z);
 const minZ=Math.min(...zs),maxZ=Math.max(...zs);
 const panelHeight=WALL_PANEL.width;
 const panelLength=WALL_PANEL.depth;
 if(room.height+1e-9<WALL_PANEL_BOTTOMS[1]+panelHeight||room.length<panelLength)return null;
 const center={
  x:side==='left'?WALL_PANEL.thickness/2:room.width-WALL_PANEL.thickness/2,
  y:WALL_PANEL_BOTTOMS[0]+panelHeight/2,
  z:THREE.MathUtils.clamp((minZ+maxZ)/2,panelLength/2,room.length-panelLength/2)
 };
 return {side,center,upperCenterY:WALL_PANEL_BOTTOMS[1]+panelHeight/2,count:2,width:WALL_PANEL.thickness,height:panelHeight,length:panelLength,orientation:'vertical',reflectionPoints:points.map(path=>path.point.clone())};
}

export function createWallPanelView(placement){
 const group=new THREE.Group();group.name=`wall-panel-${placement.side}`;group.userData.recordId=group.name;
 const material=new THREE.MeshStandardMaterial({color:0xfffff0,roughness:1});
 const geometry=new THREE.BoxGeometry(placement.width,placement.height,placement.length);
 for(const [name,y] of [['absorber-lower',placement.center.y],['absorber-upper',placement.upperCenterY]]){
  const panel=new THREE.Mesh(geometry,material);
  panel.name=name;panel.position.set(placement.center.x,y,placement.center.z);group.add(panel);
 }
 const seamGeometry=new THREE.BoxGeometry(placement.width+.001,.006,placement.length+.002);
 const seamMaterial=new THREE.MeshStandardMaterial({color:0xaaa79e,roughness:1});
 const seam=new THREE.Mesh(seamGeometry,seamMaterial);
 seam.name='panel-joint';seam.userData.collision=false;
 seam.position.set(placement.center.x+(placement.side==='left'?.0005:-.0005),WALL_PANEL_BOTTOMS[1],placement.center.z);
 group.add(seam);
 return {group,placement,dispose(){geometry.dispose();material.dispose();seamGeometry.dispose();seamMaterial.dispose();}};
}
