"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    minimize: () => electron_1.ipcRenderer.send('minimize-window'),
    maximize: () => electron_1.ipcRenderer.send('maximize-window'),
    close: () => electron_1.ipcRenderer.send('close-window'),
});
