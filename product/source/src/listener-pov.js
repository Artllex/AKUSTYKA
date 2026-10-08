import * as THREE from 'three';

// Approximate the combined peripheral field of two forward-looking eyes.
// One camera at their midpoint gives a single, undoubled scene image.
export const BINOCULAR_FIELD=Object.freeze({horizontal:200,vertical:130});

export function panoramaDirection(u,v){
 const yaw=(u-0.5)*THREE.MathUtils.degToRad(BINOCULAR_FIELD.horizontal);
 const pitch=(v-0.5)*THREE.MathUtils.degToRad(BINOCULAR_FIELD.vertical);
 return new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)).normalize();
}

export function createListenerPov(renderer,scene){
 const target=new THREE.WebGLCubeRenderTarget(768,{generateMipmaps:false,minFilter:THREE.LinearFilter});
 const cubeCamera=new THREE.CubeCamera(0.01,200,target);scene.add(cubeCamera);
 const material=new THREE.ShaderMaterial({uniforms:{panorama:{value:target.texture}},depthTest:false,depthWrite:false,
  vertexShader:'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.0,1.0);}',
  fragmentShader:`uniform samplerCube panorama; varying vec2 vUv;
   void main(){
    float yaw=(vUv.x-0.5)*radians(${BINOCULAR_FIELD.horizontal.toFixed(1)});
    float pitch=(vUv.y-0.5)*radians(${BINOCULAR_FIELD.vertical.toFixed(1)});
    vec3 direction=normalize(vec3(sin(yaw)*cos(pitch),sin(pitch),-cos(yaw)*cos(pitch)));
    vec3 color=textureCube(panorama,direction).rgb;
    float radius=length((vUv-0.5)*2.0);
    color*=1.0-0.17*smoothstep(0.72,1.25,radius);
    gl_FragColor=vec4(color,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
 const screen=new THREE.Scene(),quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);
 screen.add(quad);const flatCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 let lastCapture=-Infinity;
 return {render(pose,hidden=[]){
  cubeCamera.position.copy(pose.position);cubeCamera.quaternion.copy(pose.quaternion);cubeCamera.updateMatrixWorld(true);
  const now=performance.now();
  if(now-lastCapture>=75){
   const before=hidden.map(object=>object.visible);hidden.forEach(object=>object.visible=false);
   try{cubeCamera.update(renderer,scene);}finally{hidden.forEach((object,i)=>object.visible=before[i]);}
   lastCapture=now;
  }
  renderer.render(screen,flatCamera);
 },invalidate(){lastCapture=-Infinity;},dispose(){scene.remove(cubeCamera);target.dispose();quad.geometry.dispose();material.dispose();}};
}
