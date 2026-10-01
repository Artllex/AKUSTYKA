import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readdir,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {pruneWindowsBuilds} from './scripts/prune-windows-builds.mjs';

test('successful packaging retains current and previous Windows builds only',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'akustyka-prune-')),root=join(temp,'builds');
 try{
  await mkdir(root);
  for(const name of ['windows-0.9.0','windows-0.57.0','windows-0.58.0','windows-0.59.0','releases']){await mkdir(join(root,name));await writeFile(join(root,name,'marker'),'keep or delete');}
  await assert.rejects(pruneWindowsBuilds(root,'0.60.0'));
  assert.equal((await readdir(root)).length,5);
  const result=await pruneWindowsBuilds(root,'0.59.0');
  assert.deepEqual(result.kept.sort(),['windows-0.58.0','windows-0.59.0']);
  assert.deepEqual((await readdir(root)).sort(),['releases','windows-0.58.0','windows-0.59.0']);
 }finally{await rm(temp,{recursive:true,force:true});}
});
