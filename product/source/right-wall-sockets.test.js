import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {DEFAULT_ROOM} from './src/model.js';
import {RIGHT_WALL_SOCKETS,createRightWallSockets} from './src/right-wall-sockets.js';

test('right wall has one row of four square double-EU sockets at the measured position',()=>{
 const view=createRightWallSockets(DEFAULT_ROOM),parts=view.group.children;
 const modules=parts.filter(part=>/^socket-module-\d-\d$/.test(part.name));
 const cups=parts.filter(part=>part.name.endsWith('-cup'));
 const holes=parts.filter(part=>part.name.endsWith('-hole'));
 const bounds=new THREE.Box3().setFromObject(view.group);
 const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} ≠ ${expected}`);
 assert.equal(modules.length,4);
 assert.equal(cups.length,8);
 assert.equal(holes.length,16);
 close(view.side,(.92-.623)/4);
 close(bounds.min.x,DEFAULT_ROOM.width-.02);
 close(bounds.max.x,DEFAULT_ROOM.width);
 close(bounds.min.y,.31-view.side);
 close(bounds.max.y,.31);
 close(bounds.min.z,.623);
 close(bounds.max.z,.92);
 for(let row=1;row<=1;row++)for(let column=1;column<=4;column++){
  const module=view.group.getObjectByName(`socket-module-${row}-${column}`);
  const upper=view.group.getObjectByName(`socket-${row}-${column}-1-cup`);
  const lower=view.group.getObjectByName(`socket-${row}-${column}-2-cup`);
  close(upper.position.z,module.position.z);
  close(lower.position.z,module.position.z);
  assert.ok(upper.position.y>lower.position.y);
 }
 view.dispose();
});

test('socket bank does not extend beyond an undersized room',()=>{
 assert.equal(createRightWallSockets({...DEFAULT_ROOM,length:.8}),null);
 assert.equal(createRightWallSockets({...DEFAULT_ROOM,height:.2}),null);
});
