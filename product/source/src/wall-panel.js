import * as THREE from 'three';
import {CEILING_PANEL} from './ceiling-panel.js';

export const WALL_PANEL=CEILING_PANEL;

export function wallPanelPlacement(paths,room,side){
 if(side!=='left'&&side!=='right')throw new Error('Nieznana ściana boczna.');
 const points=paths.filter(path=>path.surface===`wall-${side}`&&path.point);
 if(!points.length)return null;
 const ys=points.map(path=>path.point.y),zs=points.map(path=>path.point.z);
 const minY=Math.min(...ys),maxY=Math.max(...ys),minZ=Math.min(...zs),maxZ=Math.max(...zs);
 const vertical=maxY-minY>maxZ-minZ&&room.height>=WALL_PANEL.width;
 const panelHeight=vertical?WALL_PANEL.width:WALL_PANEL.depth;
 const panelLength=vertical?WALL_PANEL.depth:WALL_PANEL.width;
 if(room.height<panelHeight||room.length<panelLength)return null;
 const center={
  x:side==='left'?WALL_PANEL.thickness/2:room.width-WALL_PANEL.thickness/2,
  y:THREE.MathUtils.clamp((minY+maxY)/2,panelHeight/2,room.height-panelHeight/2),
  z:THREE.MathUtils.clamp((minZ+maxZ)/2,panelLength/2,room.length-panelLength/2)
 };
 return {side,center,width:WALL_PANEL.thickness,height:panelHeight,length:panelLength,orientation:vertical?'vertical':'horizontal',reflectionPoints:points.map(path=>path.point.clone())};
}

export function createWallPanelView(placement){
 const group=new THREE.Group();group.name=`wall-panel-${placement.side}`;group.userData.recordId=group.name;
 const material=new THREE.MeshStandardMaterial({color:0xfffff0,roughness:1});
 const panel=new THREE.Mesh(new THREE.BoxGeometry(placement.width,placement.height,placement.length),material);
 panel.name='absorber';panel.position.set(placement.center.x,placement.center.y,placement.center.z);group.add(panel);
 return {group,placement,dispose(){panel.geometry.dispose();material.dispose();}};
}
