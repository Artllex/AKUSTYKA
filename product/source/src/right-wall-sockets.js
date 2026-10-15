import * as THREE from 'three';

export const RIGHT_WALL_SOCKETS=Object.freeze({
 front:.623,back:.92,top:.31,columns:4,rows:2,projection:.02
});

export function createRightWallSockets(room){
 const spec=RIGHT_WALL_SOCKETS;
 const side=(spec.back-spec.front)/spec.columns;
 if(room.width<spec.projection||room.length<spec.back||room.height<spec.top)return null;
 const group=new THREE.Group();
 group.name='right-wall-sockets';
 group.userData.recordId=group.name;
 group.userData.collision=false;
 const materials={
  plate:new THREE.MeshStandardMaterial({color:0xf5f5f2,roughness:.42}),
  seam:new THREE.LineBasicMaterial({color:0xc4c7c4}),
  rim:new THREE.MeshStandardMaterial({color:0xd5d6d3,roughness:.52,side:THREE.DoubleSide}),
  recess:new THREE.MeshStandardMaterial({color:0x757875,roughness:.86,side:THREE.DoubleSide}),
  cup:new THREE.MeshStandardMaterial({color:0xe6e7e3,roughness:.68,side:THREE.DoubleSide}),
  hole:new THREE.MeshStandardMaterial({color:0x171a1b,roughness:1,side:THREE.DoubleSide}),
  earth:new THREE.MeshStandardMaterial({color:0x92999d,metalness:.45,roughness:.4,side:THREE.DoubleSide})
 };
 const geometries={
  plate:new THREE.BoxGeometry(spec.projection-.0002,side,side),
  rim:new THREE.CircleGeometry(.0153,32),
  recess:new THREE.CircleGeometry(.0138,32),
  cup:new THREE.CircleGeometry(.0118,32),
  hole:new THREE.CircleGeometry(.00225,16),
  earth:new THREE.CircleGeometry(.0015,12)
 };
 geometries.seam=new THREE.EdgesGeometry(geometries.plate);
 function face(name,kind,x,y,z){
  const mesh=new THREE.Mesh(geometries[kind],materials[kind]);
  mesh.name=name;mesh.position.set(x,y,z);mesh.rotation.y=-Math.PI/2;
  mesh.userData.collision=false;group.add(mesh);
 }
 const socketOffset=side*.24;
 for(let row=0;row<spec.rows;row++)for(let column=0;column<spec.columns;column++){
  const y=spec.top-(row+.5)*side,z=spec.front+(column+.5)*side;
  const plate=new THREE.Mesh(geometries.plate,materials.plate);
  plate.name=`socket-module-${row+1}-${column+1}`;
  plate.position.set(room.width-(spec.projection-.0002)/2,y,z);
  plate.userData.collision=false;group.add(plate);
  const outline=new THREE.LineSegments(geometries.seam,materials.seam);
  outline.name=`socket-module-outline-${row+1}-${column+1}`;
  outline.position.copy(plate.position);outline.userData.collision=false;group.add(outline);
  for(const [socketIndex,sign] of [[1,1],[2,-1]]){
   const centerY=y+sign*socketOffset,prefix=`socket-${row+1}-${column+1}-${socketIndex}`;
   face(`${prefix}-rim`,'rim',room.width-.01984,centerY,z);
   face(`${prefix}-recess`,'recess',room.width-.01988,centerY,z);
   face(`${prefix}-cup`,'cup',room.width-.01992,centerY,z);
   for(const holeSign of [-1,1])face(`${prefix}-hole`,'hole',room.width-.02,centerY,z+holeSign*.0055);
   for(const earthSign of [-1,1])face(`${prefix}-earth`,'earth',room.width-.02,centerY+earthSign*.009,z);
  }
 }
 return {group,side,dispose(){for(const geometry of Object.values(geometries))geometry.dispose();for(const material of Object.values(materials))material.dispose();}};
}
