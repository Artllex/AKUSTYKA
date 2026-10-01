import * as THREE from 'three';
import {computeFirstReflections,normalizeReflectionSettings} from './reflection-model.js';
export function createReflectionView(monitors,listener,room,input,surfaces=null,objects=[]){
 const settings=normalizeReflectionSettings(input),paths=computeFirstReflections(monitors,listener,room,settings,surfaces,objects),group=new THREE.Group();group.name='first-reflections';group.userData.helper=true;group.visible=settings.visible;
 const materials=new Map();function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));return materials.get(color);}
 for(const path of paths){
  const point=new THREE.Mesh(new THREE.RingGeometry(0.014,0.023,24),material(path.color));point.name=`reflection-${path.channel}-${path.driverId}-${path.ear}-${path.surface}`;point.position.copy(path.point).addScaledVector(path.normal,0.003);point.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),path.normal);point.userData=path;group.add(point);
  const dot=new THREE.Mesh(new THREE.CircleGeometry(0.004,12),material(path.color));dot.position.copy(point.position);dot.quaternion.copy(point.quaternion);dot.userData.surface=path.surface;group.add(dot);
  const outline=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:48},(_,i)=>{const a=i*Math.PI/24;return new THREE.Vector3(Math.cos(a)*0.018,Math.sin(a)*0.018,0);})),new THREE.LineBasicMaterial({color:path.color,depthTest:false,depthWrite:false}));
  outline.name='reflection-projection';outline.position.copy(point.position);outline.quaternion.copy(point.quaternion);outline.userData.surface=path.surface;outline.userData.objectId=path.objectId;outline.visible=false;outline.renderOrder=31;group.add(outline);
  if(settings.paths){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([path.source,path.point,path.receiver]),new THREE.LineBasicMaterial({color:path.color,transparent:true,opacity:0.6}));line.name='reflection-path';line.userData.surface=path.surface;group.add(line);}
 }
 return {group,paths,dispose(){const geometries=new Set(),allMaterials=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)allMaterials.add(o.material);});for(const g of geometries)g.dispose();for(const m of allMaterials)m.dispose();}};
}
