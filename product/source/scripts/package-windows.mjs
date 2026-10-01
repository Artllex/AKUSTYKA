import {packager} from '@electron/packager';
import {pruneWindowsBuilds} from './prune-windows-builds.mjs';
import {mkdir,copyFile,writeFile,readFile,rm} from 'node:fs/promises';
import {basename,dirname,resolve} from 'node:path';
const metadata=JSON.parse(await readFile('package.json','utf8'));
await mkdir('../builds/staging/desktop',{recursive:true});
await copyFile('desktop/main.cjs','../builds/staging/desktop/main.cjs');
await copyFile('desktop/preload.cjs','../builds/staging/desktop/preload.cjs');
const {cp}=await import('node:fs/promises');await cp('dist','../builds/staging/dist',{recursive:true});
await writeFile('../builds/staging/package.json',JSON.stringify({name:'akustyka',productName:'AKUSTYKA',version:metadata.version,main:'desktop/main.cjs'}));
const paths=await packager({dir:'../builds/staging',name:'AKUSTYKA',platform:'win32',arch:'x64',out:'../builds/windows-'+metadata.version,overwrite:true,asar:true,prune:false,electronVersion:JSON.parse(await (await import('node:fs/promises')).readFile('node_modules/electron/package.json','utf8')).version,win32metadata:{CompanyName:'AKUSTYKA',FileDescription:'AKUSTYKA — projektowanie pomieszczenia',ProductName:'AKUSTYKA'}});
console.log(paths.join('\n'));
const stagingRoot=resolve('../builds/staging'),buildRoot=resolve('../builds');
if(dirname(stagingRoot)!==buildRoot||basename(stagingRoot)!=='staging')throw new Error('Nieprawidłowy katalog pośredni buildu.');
await rm(stagingRoot,{recursive:true,force:true});
const retention=await pruneWindowsBuilds('../builds',metadata.version);
console.log(`Buildy Windows: zachowano ${retention.kept.join(', ')}; usunięto ${retention.removed.length} starszych.`);





