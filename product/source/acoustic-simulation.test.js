import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDocument} from './src/model.js';
import {parseRoomDocument} from './src/bench.js';
import {objectReflectingFaces} from './src/object-reflections.js';
import {OCTAVE_BANDS,ACOUSTIC_MATERIALS,defaultAcousticSettings,normalizeAcousticSettings,pathAcoustics,roomModes} from './src/acoustic-simulation.js';

test('settings migrate and exclude hidden equipment by default',()=>{
 const document=createDocument();
 assert.equal(document.acoustics.includeHiddenRack,false);
 assert.equal(document.acoustics.includeHiddenDeskEquipment,false);
 assert.deepEqual(parseRoomDocument(JSON.stringify(document)).acoustics,document.acoustics);
 const legacy={...document};delete legacy.acoustics;
 assert.deepEqual(parseRoomDocument(JSON.stringify(legacy)).acoustics,defaultAcousticSettings());
 assert.throws(()=>normalizeAcousticSettings({...document.acoustics,band:730}));
});

test('first path delay and level use geometric length and material',()=>{
 const settings=defaultAcousticSettings(),path={surface:'niche-back',length:4};
 const result=pathAcoustics(path,2,settings),band=OCTAVE_BANDS.indexOf(1000);
 assert.equal(result.category,'window');
 assert.ok(Math.abs(result.delayMs-2000/343.2)<1e-9);
 assert.ok(Math.abs(result.relativeLevelDb[band]-(20*Math.log10(.5)+10*Math.log10(1-ACOUSTIC_MATERIALS.glass.absorption[band])))<1e-9);
 assert.ok(pathAcoustics(path,2,{...settings,materials:{...settings.materials,window:'absorber'}}).relativeLevelDb[band]<result.relativeLevelDb[band]);
});

test('rectangular room modes return axial, tangential and oblique frequencies',()=>{
 const modes=roomModes({width:2,height:3,length:4});
 assert.ok(Math.abs(modes.find(mode=>mode.indices.join(',')==='1,0,0').frequency-85.8)<1e-9);
 assert.equal(modes.find(mode=>mode.indices.join(',')==='1,1,0').kind,'styczny');
 assert.equal(modes.find(mode=>mode.indices.join(',')==='1,1,1').kind,'skośny');
 assert.ok(modes.every(mode=>mode.frequency<=200));
});

test('hidden desk attachment is excluded while physical worktop remains',()=>{
 const desk=new THREE.Group();desk.name='desk-combodesk-88';
 const top=new THREE.Mesh(new THREE.BoxGeometry(1,.05,.5));desk.add(top);
 const attachment=new THREE.Group();attachment.visible=false;desk.add(attachment);
 const screen=new THREE.Mesh(new THREE.BoxGeometry(.8,.5,.05));attachment.add(screen);
 const visibleMesh=(mesh,root)=>{for(let node=mesh;node&&node!==root;node=node.parent)if(!node.visible)return false;return true;};
 const faces=objectReflectingFaces([desk],visibleMesh).faces;
 assert.ok(faces.some(face=>face.mesh===top));
 assert.ok(faces.every(face=>face.mesh!==screen));
 assert.ok(objectReflectingFaces([desk]).faces.some(face=>face.mesh===screen));
 top.geometry.dispose();screen.geometry.dispose();
});
