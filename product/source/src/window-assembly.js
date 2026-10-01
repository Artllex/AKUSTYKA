import * as THREE from 'three';

// The two clear openings are cut from one frame, so no separate stile or rail
// can leave a gap at a corner. Measurements are in metres at the default size.
const DESIGN={width:1.038,height:2.22,lowerWidth:.923,lowerHeight:.835,upperWidth:.831,upperHeight:.893,lowerBottom:.16,upperBottom:1.17};

function rectangle(x0,y0,x1,y1,clockwise=false){
 const path=clockwise?new THREE.Path():new THREE.Shape();
 if(clockwise){path.moveTo(x0,y0);path.lineTo(x0,y1);path.lineTo(x1,y1);path.lineTo(x1,y0);}
 else{path.moveTo(x0,y0);path.lineTo(x1,y0);path.lineTo(x1,y1);path.lineTo(x0,y1);}
 path.closePath();return path;
}

export function addTwoLevelWindow(view,opening){
 const sx=opening.width/DESIGN.width,sy=opening.height/DESIGN.height;
 const lower={width:DESIGN.lowerWidth*sx,height:DESIGN.lowerHeight*sy,bottom:DESIGN.lowerBottom*sy};
 const upper={width:DESIGN.upperWidth*sx,height:DESIGN.upperHeight*sy,bottom:DESIGN.upperBottom*sy};
 const frame=view.mat(0xe8e9e5,{roughness:.45,side:THREE.DoubleSide});
 const sash=view.mat(0xf3f4f1,{roughness:.4,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const glass=view.mat(0xcbdde1,{metalness:.12,roughness:.18,transparent:true,opacity:.91,side:THREE.DoubleSide});
 const hardware=view.mat(0xc4c8c5,{metalness:.55,roughness:.3});
 const rearZ=-opening.depth+.016,frameDepth=.024;
 const body=rectangle(-opening.width/2,0,opening.width/2,opening.height);
 for(const pane of [lower,upper])body.holes.push(rectangle(-pane.width/2,pane.bottom,pane.width/2,pane.bottom+pane.height,true));
 const frameMesh=new THREE.Mesh(new THREE.ExtrudeGeometry(body,{depth:frameDepth,bevelEnabled:false,curveSegments:1}),frame);
 frameMesh.name='window-continuous-frame';frameMesh.position.set(opening.center,opening.bottom,rearZ);view.group.add(frameMesh);
 for(const [name,pane] of [['window-lower-fixed-glass',lower],['window-upper-tilt-glass',upper]]){
  view.box(name,[pane.width,pane.height,.004],[opening.center,opening.bottom+pane.bottom+pane.height/2,rearZ+.006],glass);
 }
 const sashMarginX=.02*sx,sashMarginY=.012*sy;
 const sashShape=rectangle(-upper.width/2-sashMarginX,upper.bottom-sashMarginY,upper.width/2+sashMarginX,upper.bottom+upper.height+sashMarginY);
 sashShape.holes.push(rectangle(-upper.width/2,upper.bottom,upper.width/2,upper.bottom+upper.height,true));
 const sashMesh=new THREE.Mesh(new THREE.ShapeGeometry(sashShape),sash);
 sashMesh.name='window-upper-tilt-sash';sashMesh.position.set(opening.center,opening.bottom,rearZ+frameDepth);view.group.add(sashMesh);
 const handleX=opening.center-upper.width/2-.035*sx,handleY=opening.bottom+upper.bottom+upper.height*.47,handleZ=rearZ+frameDepth+.015;
 view.box('window-upper-handle-base',[.012*sx,.046*sy,.008],[handleX,handleY,handleZ],hardware);
 view.box('window-upper-handle',[.008*sx,.09*sy,.012],[handleX,handleY-.026*sy,handleZ+.008],hardware);
}
