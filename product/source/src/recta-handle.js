import * as THREE from 'three';

// Millimetres from the supplied RECTA drawing, converted to model metres.
export const RECTA_HANDLE=Object.freeze({plateWidth:.052,plateHeight:.040,plateDepth:.006,reach:.137,pivotOffset:.016,projection:.063,projectionBeyondPlate:.057,tipHeight:.011,tipDepth:.018,lockDrop:.072});

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
 // Each station follows the side elevation: near/far depth, then half-width
 // from the top drawing. The thick portion belongs only to the short elbow.
 const p=RECTA_HANDLE.pivotOffset;
 const stations=[[p,.006,.045,.010],[p-.006,.008,.052,.011],[p-.012,.012,.060,.011],[p-.020,.022,.062,.0095],[p-.030,.033,.063,.0075],[p-.040,.041,.063,.0058],[p-.060,.043,.063,.0055],[p-.100,.044,.063,.0055],[p-RECTA_HANDLE.reach,.045,.063,.0055]];
 const sides=20,steps=64,positions=[],indices=[];
 for(let i=0;i<=steps;i++){
  const x=p-RECTA_HANDLE.reach*i/steps;
  let section=stations.length-2;
  for(let k=0;k<stations.length-1;k++)if(x>=stations[k+1][0]){section=k;break;}
  const a=stations[section],b=stations[section+1],fraction=(a[0]-x)/(a[0]-b[0]);
  const near=THREE.MathUtils.lerp(a[1],b[1],fraction),far=THREE.MathUtils.lerp(a[2],b[2],fraction),halfWidth=THREE.MathUtils.lerp(a[3],b[3],fraction),halfDepth=(far-near)/2,mid=(far+near)/2,radius=Math.min(halfWidth,halfDepth)*.25;
  for(let corner=0;corner<4;corner++)for(let q=0;q<5;q++){
   const angle=(corner+q/4)*Math.PI/2;
   const cy=(corner===0||corner===3?1:-1)*(halfWidth-radius);
   const cz=(corner<2?1:-1)*(halfDepth-radius);
   positions.push(x,cy+radius*Math.cos(angle),outward*(mid+cz+radius*Math.sin(angle)));
  }
 }
 for(let i=0;i<steps;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides,c=(i+1)*sides+j,d=(i+1)*sides+(j+1)%sides;indices.push(...(outward>0?[a,c,b,b,c,d]:[a,b,c,b,d,c]));}
 for(const [end,root] of [[0,true],[steps,false]]){
  const station=root?stations[0]:stations.at(-1),centerIndex=positions.length/3;
  positions.push(station[0],0,outward*(station[1]+station[2])/2);
  for(let j=0;j<sides;j++){const a=end*sides+j,b=end*sides+(j+1)%sides;indices.push(...((root===(outward>0))?[centerIndex,a,b]:[centerIndex,b,a]));}
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

export function addRectaDoorHardware(group,material,openingMaterial,{x,y,doorFace,outward}){
 const suffix=outward>0?'-outside':'';
 for(const [kind,centerY,keyhole] of [['handle',y,false],['lock',y-RECTA_HANDLE.lockDrop,true]]){
  const plate=new THREE.Mesh(roundedPlate(keyhole),material);plate.name=`door-${kind}-plate${suffix}`;
  plate.position.set(x,centerY,doorFace+outward*.001);plate.rotation.y=outward<0?Math.PI:0;group.add(plate);
  if(keyhole){const opening=new THREE.Mesh(new THREE.CircleGeometry(1,32),openingMaterial);opening.name=`door-lock-opening${suffix}`;opening.scale.set(.0065,.014,1);opening.position.set(x,centerY,doorFace+outward*.0015);opening.rotation.y=outward<0?Math.PI:0;group.add(opening);}
 }
 const lever=new THREE.Mesh(leverGeometry(outward),material);lever.name=`door-handle${suffix}`;lever.position.set(x,y,doorFace);group.add(lever);
}
