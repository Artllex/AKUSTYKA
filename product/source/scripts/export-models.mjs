import {createServer} from 'vite';
import {spawn} from 'node:child_process';
import electron from 'electron';

const server=await createServer({configFile:'vite.config.js',server:{host:'127.0.0.1',port:0}});
try{
 await server.listen();
 const address=server.httpServer.address();
 const url=`http://127.0.0.1:${address.port}/model-export.html`;
 await new Promise((resolve,reject)=>{
  const child=spawn(electron,['scripts/export-models-electron.cjs'],{
   cwd:process.cwd(),stdio:'inherit',env:{...process.env,AKUSTYKA_EXPORT_URL:url}
  });
  child.on('error',reject);
  child.on('exit',code=>code===0?resolve():reject(new Error(`Export exited with code ${code}`)));
 });
}finally{await server.close();}
