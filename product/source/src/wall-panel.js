import * as THREE from 'three';
import {CEILING_PANEL} from './ceiling-panel.js';

export const WALL_PANEL=CEILING_PANEL;
export const WALL_PANEL_GAP=.01;

export function wallPanelPlacement(paths,room,side){
 if(side!=='left'&&side!=='right')throw new Error('Nieznana ściana boczna.');
 const points=paths.filter(path=>path.surface===`wall-${side}`&&path.point);
 if(!points.length)return null;
 const ys=points.map(path=>path.point.y),zs=points.map(path=>path.point.z);
 const minY=Math.min(...ys),maxY=Math.max(...ys),minZ=Math.min(...zs),maxZ=Math.max(...zs);
 const panelHeight=WALL_PANEL.width;
 const panelLength=WALL_PANEL.depth;
 if(room.height<2*panelHeight+WALL_PANEL_GAP||room.length<panelLength)return null;
 const lowerY=THREE.MathUtils.clamp((minY+maxY)/2,panelHeight/2,room.height-1.5*panelHeight-WALL_PANEL_GAP);
 const center={
  x:side==='left'?WALL_PANEL.thickness/2:room.width-WALL_PANEL.thickness/2,
  y:lowerY,
  z:THREE.MathUtils.clamp((minZ+maxZ)/2,panelLength/2,room.length-panelLength/2)
 };
 return {side,center,upperCenterY:lowerY+panelHeight+WALL_PANEL_GAP,count:2,width:WALL_PANEL.thickness,height:panelHeight,length:panelLength,orientation:'vertical',reflectionPoints:points.map(path=>path.point.clone())};
}

export function createWallPanelView(placement){
 const group=new THREE.Group();group.name=`wall-panel-${placement.side}`;group.userData.recordId=group.name;
 const material=new THREE.MeshStandardMaterial({color:0xfffff0,roughness:1});
 const geometry=new THREE.BoxGeometry(placement.width,placement.height,placement.length);
 for(const [name,y] of [['absorber-lower',placement.center.y],['absorber-upper',placement.upperCenterY]]){
  const panel=new THREE.Mesh(geometry,material);
  panel.name=name;panel.position.set(placement.center.x,y,placement.center.z);group.add(panel);
 }
 return {group,placement,dispose(){geometry.dispose();material.dispose();}};
}
