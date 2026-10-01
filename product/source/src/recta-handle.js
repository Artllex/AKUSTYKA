import * as THREE from 'three';

// Millimetres from the supplied RECTA drawing, converted to model metres.
export const RECTA_HANDLE=Object.freeze({plateWidth:.052,plateHeight:.040,plateDepth:.006,reach:.137,projection:.057,tipHeight:.018,tipDepth:.011,lockDrop:.072});

function roundedPlate(withKeyhole){
 const w=.050,h=.038,r=.003,s=new THREE.Shape();
 s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
 s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
 s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
 s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
 if(withKeyhole){const opening=new THREE.Path();opening.absellipse(0,0,.0065,.014,0,Math.PI*2,true);s.holes.push(opening);}
 return new THREE.ExtrudeGeometry(s,{depth:.004,bevelEnabled:true,bevelThickness:.001,bevelSize:.001,bevelSegments:2,curveSegments:12});
}

function leverGeometry(outward){
 const stations=[[0,.019,.014,.013],[-.012,.032,.014,.012],[-.031,.046,.011,.009],[-.045,.050,.0095,.006],[-.085,.050,.009,.0055],[-.130,.050,.009,.0055],[-RECTA_HANDLE.reach,.050,.009,.0055]];
 const curve=new THREE.CatmullRomCurve3(stations.map(([x,z])=>new THREE.Vector3(x,0,outward*z)),false,'centripetal');
 const sides=16,steps=48,positions=[],indices=[];
 for(let i=0;i<=steps;i++){
  const t=i/steps,p=curve.getPoint(t),tangent=curve.getTangent(t),across=new THREE.Vector3(tangent.z,0,-tangent.x).normalize();
  const at=t*(stations.length-1),index=Math.min(stations.length-2,Math.floor(at)),fraction=at-index;
  const height=THREE.MathUtils.lerp(stations[index][2],stations[index+1][2],fraction),depth=THREE.MathUtils.lerp(stations[index][3],stations[index+1][3],fraction);
  for(let j=0;j<sides;j++){const angle=j*2*Math.PI/sides,point=p.clone().addScaledVector(across,Math.cos(angle)*depth);point.y+=Math.sin(angle)*height;positions.push(...point.toArray());}
 }
 for(let i=0;i<steps;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides,c=(i+1)*sides+j,d=(i+1)*sides+(j+1)%sides;indices.push(a,b,c,b,d,c);}
 for(const [end,reverse] of [[0,true],[steps,false]]){const center=curve.getPoint(end/steps),centerIndex=positions.length/3;positions.push(...center.toArray());for(let j=0;j<sides;j++){const a=end*sides+j,b=end*sides+(j+1)%sides;indices.push(...(reverse?[centerIndex,b,a]:[centerIndex,a,b]));}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

export function addRectaDoorHardware(group,material,openingMaterial,{x,y,doorFace,outward}){
 const suffix=outward>0?'-outside':'';
 for(const [kind,centerY,keyhole] of [['handle',y,false],['lock',y-RECTA_HANDLE.lockDrop,true]]){
  const plate=new THREE.Mesh(roundedPlate(keyhole),material);plate.name=`door-${kind}-plate${suffix}`;
  plate.position.set(x,centerY,doorFace+outward*.001);plate.rotation.y=outward<0?Math.PI:0;group.add(plate);
  if(keyhole){const opening=new THREE.Mesh(new THREE.CircleGeometry(1,32),openingMaterial);opening.name=`door-lock-opening${suffix}`;opening.scale.set(.0065,.014,1);opening.position.set(x,centerY,doorFace+outward*.0015);opening.rotation.y=outward<0?Math.PI:0;group.add(opening);}
 }
 const spindle=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.018,20),material);spindle.name=`door-handle-spindle${suffix}`;spindle.rotation.x=Math.PI/2;spindle.position.set(x,y,doorFace+outward*.015);group.add(spindle);
 const lever=new THREE.Mesh(leverGeometry(outward),material);lever.name=`door-handle${suffix}`;lever.position.set(x,y,doorFace);group.add(lever);
}
