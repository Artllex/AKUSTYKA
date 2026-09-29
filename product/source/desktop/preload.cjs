const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',Object.freeze({
 open:()=>ipcRenderer.invoke('room:open'),save:data=>ipcRenderer.invoke('room:save',data),exit:()=>ipcRenderer.send('room:exit'),toggleFullscreen:()=>ipcRenderer.send('window:toggle-fullscreen')
}));
