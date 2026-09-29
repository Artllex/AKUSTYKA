export function rotationPlaneAt(point,directions){
 if(!point||Math.hypot(point.x,point.y)<10)return null;
 const candidates=[];
 for(const plane of ['xy','xz','yz']){
  const a=directions[plane[0]],b=directions[plane[1]],det=a.x*b.y-a.y*b.x;
  if(Math.abs(det)<1e-5)continue;
  const u=(point.x*b.y-point.y*b.x)/det,v=(a.x*point.y-a.y*point.x)/det;
  if(u<0||v<0)continue;
  const cosine=(a.x*b.x+a.y*b.y)/(Math.hypot(a.x,a.y)*Math.hypot(b.x,b.y));
  candidates.push({plane,angle:Math.acos(Math.max(-1,Math.min(1,cosine)))});
 }
 candidates.sort((a,b)=>a.angle-b.angle);return candidates[0]?.plane??null;
}
