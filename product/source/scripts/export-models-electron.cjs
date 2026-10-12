const {app,BrowserWindow}=require('electron');
const {mkdir,writeFile}=require('node:fs/promises');
const path=require('node:path');

app.whenReady().then(async()=>{
 const window=new BrowserWindow({show:false,webPreferences:{offscreen:true,backgroundThrottling:false,nodeIntegration:false,contextIsolation:true}});
 try{
  await window.loadURL(process.env.AKUSTYKA_EXPORT_URL);
  const models=await window.webContents.executeJavaScript('window.exportModels()');
  const folder=path.resolve(__dirname,'../public/models');
  await mkdir(folder,{recursive:true});
  for(const {name,data} of models){
   const bytes=Buffer.from(data,'base64');
   if(bytes.toString('ascii',0,4)!=='glTF')throw new Error(`Invalid GLB: ${name}`);
   await writeFile(path.join(folder,`${name}.glb`),bytes);
   console.log(`${name}.glb ${bytes.length} bytes`);
  }
 }catch(error){console.error(error);process.exitCode=1;}
 finally{window.destroy();app.quit();}
});
