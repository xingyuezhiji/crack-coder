"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    minimize: () => electron_1.ipcRenderer.send('minimize-window'),
    maximize: () => electron_1.ipcRenderer.send('maximize-window'),
    close: () => electron_1.ipcRenderer.send('close-window'),
    quit: () => electron_1.ipcRenderer.send('quit-app'),
    takeScreenshot: () => electron_1.ipcRenderer.invoke('take-screenshot'),
    processScreenshots: () => electron_1.ipcRenderer.invoke('process-screenshots'),
    resetQueue: () => electron_1.ipcRenderer.invoke('reset-queue'),
    toggleVisibility: () => electron_1.ipcRenderer.send('toggle-visibility'),
    onProcessingComplete: (callback) => {
        electron_1.ipcRenderer.on('processing-complete', (_event, result) => callback(result));
    },
    onScreenshotTaken: (callback) => {
        electron_1.ipcRenderer.on('screenshot-taken', (_event, data) => callback(data));
    },
    onProcessingStarted: (callback) => {
        electron_1.ipcRenderer.on('processing-started', callback);
    },
    onQueueReset: (callback) => {
        electron_1.ipcRenderer.on('queue-reset', callback);
    }
});
