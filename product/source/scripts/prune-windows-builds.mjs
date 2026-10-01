import {readdir,realpath,rm} from 'node:fs/promises';
import {basename,dirname,join,resolve} from 'node:path';

const versionPattern=/^windows-(\d+)\.(\d+)\.(\d+)$/;

export async function pruneWindowsBuilds(buildRoot,currentVersion,keepCount=2){
 if(basename(resolve(buildRoot))!=='builds'||!versionPattern.test(`windows-${currentVersion}`)||!Number.isInteger(keepCount)||keepCount<2)throw new Error('Nieprawidłowe parametry czyszczenia buildów.');
 const root=await realpath(buildRoot);
 const entries=(await readdir(root,{withFileTypes:true})).filter(entry=>entry.isDirectory()&&versionPattern.test(entry.name));
 if(!entries.some(entry=>entry.name===`windows-${currentVersion}`))throw new Error('Brakuje bieżącego buildu; starszych paczek nie usunięto.');
 const compare=(a,b)=>{const av=versionPattern.exec(a.name).slice(1).map(Number),bv=versionPattern.exec(b.name).slice(1).map(Number);for(let i=0;i<3;i++)if(av[i]!==bv[i])return bv[i]-av[i];return 0;};
 const ordered=entries.sort(compare),keep=new Set([`windows-${currentVersion}`]);
 for(const entry of ordered)if(keep.size<keepCount)keep.add(entry.name);
 const removed=[];
 for(const entry of ordered){
  if(keep.has(entry.name))continue;
  const target=join(root,entry.name);
  if(dirname(await realpath(target))!==root)throw new Error(`Build poza katalogiem projektu: ${target}`);
  await rm(target,{recursive:true});removed.push(entry.name);
 }
 return {kept:[...keep],removed};
}
