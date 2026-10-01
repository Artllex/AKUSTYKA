export function edgeFraction(text,lengthMeters){
 const raw=String(text).trim().replace(',', '.');
 const match=raw.match(/^([+]?(?:\d+(?:\.\d*)?|\.\d+))\s*(%|cm)?$/i);
 if(!match||!Number.isFinite(lengthMeters)||lengthMeters<=0)return null;
 const value=Number(match[1]),fraction=match[2]==='%'?value/100:value/(lengthMeters*100);
 return Number.isFinite(fraction)&&fraction>0&&fraction<1&&Math.min(fraction,1-fraction)*lengthMeters>=.002-1e-9?fraction:null;
}

export function nearestAdjacentEdge(mesh,start,projected,pointer,radius=16){
 let best=null;
 for(const [index,pair] of mesh.edges.entries()){
  if(!pair.includes(start))continue;
  const other=pair[0]===start?pair[1]:pair[0],a=projected[start],b=projected[other];
  if(!a?.visible||!b?.visible)continue;
  const dx=b.x-a.x,dy=b.y-a.y,denominator=dx*dx+dy*dy;
  if(denominator<64)continue;
  const fraction=Math.max(0,Math.min(1,((pointer.x-a.x)*dx+(pointer.y-a.y)*dy)/denominator));
  const distance=Math.hypot(pointer.x-a.x-fraction*dx,pointer.y-a.y-fraction*dy);
  if(distance<=radius&&(!best||distance<best.distance))best={index,pair,fraction,distance};
 }
 return best;
}
