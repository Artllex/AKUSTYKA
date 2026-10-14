import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {COMBODESK_88} from './desk-model.js';
import {MODUL_DESK_ID,MODUL_STUDIO_DESK} from './modul-desk-model.js';

// Dell Alienware AW3423DWF at the stand's lowest setting; dimensions in metres.
export const AW3423DWF=Object.freeze({width:.81525,height:.41557,depth:.30571,curveRadius:1.8,panelHeight:.352});
const SEGMENTS=64;

export function displayPlacement(desk){
 const modul=desk.id===MODUL_DESK_ID;
 const top=modul?MODUL_STUDIO_DESK.height:COMBODESK_88.worktop.top;
 const rear=modul?MODUL_STUDIO_DESK.top.frontZ-MODUL_STUDIO_DESK.top.depth:(COMBODESK_88.depth-COMBODESK_88.worktop.depth)/2-COMBODESK_88.worktop.depth/2;
 return {x:0,y:top,z:rear+.241};
}

function sag(x){return AW3423DWF.curveRadius-Math.sqrt(AW3423DWF.curveRadius**2-x*x);}
function rearSurface(x){return -.199+sag(x);}

// Rear emblems are decals on the curved housing, not raised spheres or tubes.
function rearDecalEllipse(cx,cy,rx,ry,offset){
 const p=[cx,cy,rearSurface(cx)-offset],faces=[];
 for(let i=0;i<=32;i++){
  const angle=i*Math.PI/16,x=cx+rx*Math.cos(angle);
  p.push(x,cy+ry*Math.sin(angle),rearSurface(x)-offset);
  if(i>0)faces.push(0,i,i+1);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 geometry.setIndex(faces);geometry.computeVertexNormals();return geometry;
}

function rearDecalStroke(points,originX,originY,width){
 const curve=new THREE.CatmullRomCurve3(points.map(([x,y])=>new THREE.Vector3(x,y,0)),false,'centripetal');
 const p=[],faces=[],steps=points.length*5;
 for(let i=0;i<=steps;i++){
  const t=i/steps,point=curve.getPoint(t),tangent=curve.getTangent(t),length=Math.hypot(tangent.x,tangent.y)||1;
  const dx=-tangent.y/length*width/2,dy=tangent.x/length*width/2;
  for(const side of [-1,1]){
   const x=originX-(point.x+side*dx);
   p.push(x,originY+point.y+side*dy,rearSurface(x)-.0004);
  }
  if(i>0){const a=(i-1)*2,b=i*2;faces.push(a,b,a+1,a+1,b,b+1);}
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 geometry.setIndex(faces);geometry.computeVertexNormals();return geometry;
}

// The display is a bent, closed slab. Each edge has its own quads, so the top
// and bottom cannot become a large diagonal sheet when seen from above.
function bentSlab(width,height,front,back,corner=0){
 const p=[],uv=[],faces=[];
 for(let i=0;i<=SEGMENTS;i++){
  const u=i/SEGMENTS,x=(u-.5)*width,s=sag(x),round=Math.max(0,Math.abs(x)-(width/2-corner));
  const halfHeight=corner?height/2-corner+Math.sqrt(Math.max(0,corner*corner-round*round)):height/2;
  p.push(x,-halfHeight,front+s,x,halfHeight,front+s,x,-halfHeight,back+s,x,halfHeight,back+s);
  uv.push(u,0,u,1,u,0,u,1);
 }
 const quad=(a,b,c,d)=>faces.push(a,b,c,a,c,d);
 for(let i=0;i<SEGMENTS;i++){
  const a=i*4,b=(i+1)*4;
  quad(a,b,b+1,a+1);       // face towards the listener
  quad(a+2,a+3,b+3,b+2); // rear
  quad(a+1,b+1,b+3,a+3); // top
  quad(a+2,b+2,b,a);     // bottom
 }
 quad(0,1,3,2);
 const last=SEGMENTS*4;quad(last+2,last+3,last+1,last);
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geometry.setIndex(faces);geometry.computeVertexNormals();return geometry;
}

function bentFace(width,height){
 const p=[],uv=[],faces=[];
 for(let i=0;i<=SEGMENTS;i++){
  const u=i/SEGMENTS,x=(u-.5)*width,z=sag(x);
  p.push(x,-height/2,z,x,height/2,z);uv.push(u,0,u,1);
 }
 for(let i=0;i<SEGMENTS;i++){const a=i*2,b=a+2;faces.push(a,b,b+1,a,b+1,a+1);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(faces);geometry.computeVertexNormals();return geometry;
}

// Eight-sided rounded-rectangle sections make the upright a single solid:
// broad at the foot, slimmer at the top, with a distinct front and rear face.
function columnGeometry(){
 const sections=[
  {y:.020,w:.047,front:-.211,rear:-.284},
  {y:.060,w:.045,front:-.221,rear:-.282},
  {y:.337,w:.034,front:-.228,rear:-.270},
  {y:.378,w:.031,front:-.228,rear:-.265}
 ];
 const p=[],faces=[];
 for(const {y,w,front,rear} of sections){
  const r=.009;
  for(const [x,z] of [[-w+r,front],[w-r,front],[w,front-r],[w,rear+r],[w-r,rear],[-w+r,rear],[-w,rear+r],[-w,front-r]])p.push(x,y,z);
 }
 for(let row=0;row<sections.length-1;row++)for(let i=0;i<8;i++){
  const a=row*8+i,b=row*8+(i+1)%8,c=b+8,d=a+8;faces.push(a,b,c,a,c,d);
 }
 for(let i=1;i<7;i++)faces.push(0,i+1,i,24,24+i,24+i+1);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 geometry.setIndex(faces);geometry.computeVertexNormals();return geometry;
}

function vFootGeometry(side){
 const outline=[[0,-.238],[.046,-.235],[.254,-.158],[.265,-.149],[.252,-.145],[.038,-.210],[0,-.215]];
 const p=[],faces=[],n=outline.length;
 for(const [x,z] of outline){const t=Math.min(1,x/.265);p.push(side*x,.003+.017*(1-t),z);}
 for(const [x,z] of outline){const t=Math.min(1,x/.265);p.push(side*x,.013+.027*(1-t),z);}
 for(let i=1;i<n-1;i++){
  if(side>0)faces.push(0,i+1,i,n,n+i,n+i+1);
  else faces.push(0,i,i+1,n,n+i+1,n+i);
 }
 for(let i=0;i<n;i++){
  const j=(i+1)%n;
  if(side>0)faces.push(i,j,n+j,i,n+j,n+i);
  else faces.push(j,i,n+i,j,n+i,n+j);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 geometry.setIndex(faces);geometry.computeVertexNormals();return geometry;
}

function scenicTexture(){
 const width=640,height=268,data=new Uint8Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/width,v=1-y/height,i=(y*width+x)*4;
  const mountains=.49+.055*Math.sin(u*10)+.026*Math.sin(u*31);
  const ridge=.65+.032*Math.sin(u*17+2)+.015*Math.sin(u*57);
  const cloud=Math.max(0,Math.sin(u*19+Math.sin(v*25)*.8)*Math.sin(v*42+u*7));
  let r,g,b;
  if(v<mountains){const haze=Math.max(0,1-Math.abs(v-.28)*4);r=31+72*v+95*cloud*haze;g=111+71*v+58*cloud*haze;b=137+61*v+30*cloud*haze;}
  else if(v<ridge){r=20+45*(v-mountains);g=65+24*u;b=64+26*u;}
  else {const grass=Math.sin(u*135+Math.sin(v*21))*7;r=57+grass+70*(v-.65);g=85+grass+38*(v-.65);b=36+11*u;}
  data[i]=r;data[i+1]=g;data[i+2]=b;data[i+3]=255;
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}

export function createAlienwareDisplay(desk){
 const group=new THREE.Group();group.name='computer-display-aw3423dwf';group.userData.collision=false;
 const placement=displayPlacement(desk);group.position.set(placement.x,placement.y,placement.z);
 const body=new THREE.MeshStandardMaterial({color:0x20252b,roughness:.64,metalness:.12});
 const bezel=new THREE.MeshStandardMaterial({color:0x090b0d,roughness:.52});
 const stand=new THREE.MeshStandardMaterial({color:0x292e34,roughness:.43,metalness:.28});
 const ventMaterial=new THREE.MeshStandardMaterial({color:0x101318,roughness:.68});
 const turquoise=new THREE.MeshBasicMaterial({color:0x26dcd9,side:THREE.DoubleSide});
 const ledDark=new THREE.MeshBasicMaterial({color:0x090b0d,side:THREE.DoubleSide});
 const texture=scenicTexture(),screen=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
 const materials=[body,bezel,stand,ventMaterial,turquoise,ledDark,screen],geometries=[];
 function mesh(name,geometry,material,x=0,y=0,z=0){const item=new THREE.Mesh(geometry,material);item.name=name;item.position.set(x,y,z);group.add(item);geometries.push(geometry);return item;}

 const d=AW3423DWF,panelY=d.height-d.panelHeight/2,panelBottom=panelY-d.panelHeight/2;
 mesh('curved-rear-shell-1800r',bentSlab(d.width,d.panelHeight,-.145,-.159,.005),bezel,0,panelY);
 mesh('curved-oled-screen',bentFace(d.width-.018,d.panelHeight-.030),screen,0,panelY+.007,-.1437);
 mesh('lower-chin',bentSlab(d.width-.002,.016,-.141,-.144),stand,0,panelBottom+.008);

 // The smaller equipment pod follows the screen's arc, leaving the outer rim exposed.
 mesh('rear-equipment-housing',bentSlab(.690,.294,-.160,-.199,.018),body,0,.242);
 mesh('top-rear-vent-band',bentSlab(.730,.010,-.164,-.176),ventMaterial,0,.398);
 const finGeometry=new THREE.BoxGeometry(.0032,.009,.004),fins=new THREE.InstancedMesh(finGeometry,bezel,69),finPose=new THREE.Object3D();
 fins.name='top-rear-vent-fins';
 for(let i=-34;i<=34;i++){
  const x=i*.0104;finPose.position.set(x,.398,-.178+sag(x));finPose.updateMatrix();fins.setMatrixAt(i+34,finPose.matrix);
 }
 group.add(fins);geometries.push(finGeometry);
 const vent=mesh('rear-vent',new THREE.TorusGeometry(.042,.0045,8,48),ventMaterial,0,.270,-.201);vent.scale.y=2.15;
 mesh('rear-alien-mark',rearDecalEllipse(.205,.260,.016,.021,.0004),turquoise);
 for(const x of [.199,.211])mesh('rear-alien-eye',rearDecalEllipse(x,.260,.0035,.0035,.0007),ledDark);
 const label=new THREE.Group();label.name='rear-34-mark';group.add(label);
 for(const points of [
  [[-.045,.021],[-.021,.021],[-.015,.016],[-.015,.005],[-.023,0],[-.015,-.005],[-.015,-.016],[-.021,-.021],[-.045,-.021]],
  [[.013,.021],[.013,-.003],[.044,-.003]],[[.037,.021],[.037,-.021]]
 ]){
  const geometry=rearDecalStroke(points,-.205,.260,.0054);
  const stroke=new THREE.Mesh(geometry,turquoise);label.add(stroke);geometries.push(geometry);
 }

 // Only the short horizontal pivot connects the hanging panel to the upright.
 mesh('mounting-arm',new RoundedBoxGeometry(.056,.044,.057,3,.006),stand,0,.275,-.215);
 const pivot=mesh('stand-pivot',new THREE.CylinderGeometry(.022,.022,.015,24),ventMaterial,0,.275,-.234);
 pivot.rotation.x=Math.PI/2;
 mesh('stand-column',columnGeometry(),stand);
 mesh('stand-foot-joint',new RoundedBoxGeometry(.100,.027,.041,3,.007),stand,0,.019,-.219);
 for(const side of [-1,1])mesh('v-foot',vFootGeometry(side),stand);

 group.userData.dimensions={width:d.width,height:d.height,depth:d.depth,curveRadius:d.curveRadius};
 return {group,dispose(){for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();texture.dispose();}};
}
