import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),
  quit: () => ipcRenderer.send('quit-app'),
  
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
  processScreenshots: () => ipcRenderer.invoke('process-screenshots'),
  resetQueue: () => ipcRenderer.invoke('reset-queue'),
  
  toggleVisibility: () => ipcRenderer.send('toggle-visibility'),
  
  onProcessingComplete: (callback: (result: string) => void) => {
    ipcRenderer.on('processing-complete', (_event, result) => callback(result));
  },
  onScreenshotTaken: (callback: (data: { preview: string }) => void) => {
    ipcRenderer.on('screenshot-taken', (_event, data) => callback(data));
  },
  onQueueReset: (callback: () => void) => {
    ipcRenderer.on('queue-reset', callback);
  }
}); 