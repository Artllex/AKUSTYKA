import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocument} from './src/model.js';
import {createSeatedListener} from './src/listener-view.js';
import {createStudioMonitor} from './src/monitor-view.js';
import {createReflectionView} from './src/reflection-view.js';
import {updateReflectionVisibility} from './src/reflection-visibility.js';

test('projection with objects shows one-pixel contours only at first reflections on selected surface',()=>{
 const doc=createDocument(),listener=createSeatedListener(doc.objects[0]);
 const monitors=doc.objects.filter(o=>o.type==='studio-monitor').map(createStudioMonitor);
 const view=createReflectionView(monitors,listener,doc.room,doc.reflections);
 const outlines=view.group.children.filter(o=>o.name==='reflection-projection');
 assert.equal(outlines.length,view.paths.length);
 assert.ok(outlines.every(o=>o.material.linewidth===1&&!o.visible));
 updateReflectionVisibility(view,{surfaceName:'wall-left'},false);
 assert.ok(view.group.children.every(o=>!o.visible));
 updateReflectionVisibility(view,{surfaceName:'wall-left'},true);
 assert.equal(outlines.filter(o=>o.visible).length,view.paths.filter(p=>p.surface==='wall-left').length);
 assert.ok(outlines.some(o=>o.userData.surface!=='wall-left'&&!o.visible));
 assert.ok(view.group.children.filter(o=>o.name.startsWith('reflection-')&&o.name!=='reflection-projection').every(o=>!o.visible));
 updateReflectionVisibility(view,null,false);
 assert.ok(outlines.every(o=>!o.visible));
 assert.ok(view.group.children.some(o=>o.name.startsWith('reflection-L-')&&o.visible));
 view.dispose();listener.dispose();monitors.forEach(m=>m.dispose());
});
