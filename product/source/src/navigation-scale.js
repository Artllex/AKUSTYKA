export function navigationSpan(camera,target){
 if(camera.isOrthographicCamera)return (camera.top-camera.bottom)/camera.zoom;
 return camera.position.distanceTo(target);
}

export function panSpeedForSpan(span,referenceSpan){
 return Number.isFinite(span)&&span>0&&referenceSpan>0?referenceSpan/span:1;
}

export function zoomScaleForSpan(delta,span,referenceSpan){
 if(!Number.isFinite(span)||span<=0||!Number.isFinite(referenceSpan)||referenceSpan<=0)return Math.pow(0.95,Math.abs(delta)*0.01);
 const step=referenceSpan*(1-Math.pow(0.95,Math.abs(delta)*0.01));
 return delta<0?Math.max(0.0001,1-step/span):span/(span+step);
}
