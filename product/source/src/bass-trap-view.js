import * as THREE from 'three';
import {bassTrapPlacement} from './bass-trap-model.js';

function triangleGeometry(points,y){
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(points.flatMap(([x,z])=>[x,y,z]),3));
 geometry.setIndex([0,1,2]);
 geometry.computeVertexNormals();
 return geometry;
}

function sideGeometry(a,b,bottom,top){
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([
  a[0],bottom,a[1],a[0],top,a[1],b[0],bottom,b[1],b[0],top,b[1]
 ],3));
 geometry.setIndex([0,1,2,2,1,3]);
 geometry.computeVertexNormals();
 return geometry;
}

export function createBassTrapView(record,room){
 const placement=bassTrapPlacement(record,room),group=new THREE.Group();
 group.name=record.id;group.userData.recordId=record.id;
 const fabric=new THREE.MeshStandardMaterial({color:0xfffff0,roughness:1,side:THREE.DoubleSide});
 const wood=new THREE.MeshStandardMaterial({color:0x302b29,roughness:.82,side:THREE.DoubleSide});
 const lid=new THREE.MeshStandardMaterial({color:0xe5e2d7,roughness:.82,side:THREE.DoubleSide});
 const geometries=[];
 const add=(name,geometry,material,physical=true)=>{
  const mesh=new THREE.Mesh(geometry,material);mesh.name=name;
  if(!physical)mesh.userData.collision=false;
  geometries.push(geometry);group.add(mesh);return mesh;
 };
 const [corner,first,second]=placement.triangle;
 add('fabric-diagonal',sideGeometry(first,second,placement.bottom,placement.top),fabric);
 add('wall-backing-a',sideGeometry(corner,first,placement.bottom,placement.top),wood,false);
 add('wall-backing-b',sideGeometry(second,corner,placement.bottom,placement.top),wood,false);
 add('cap-bottom',triangleGeometry(placement.triangle,placement.bottom),wood);
 add('cap-top',triangleGeometry(placement.triangle,placement.top),lid);
 return {group,placement,dispose(){for(const geometry of geometries)geometry.dispose();fabric.dispose();wood.dispose();lid.dispose();}};
}
