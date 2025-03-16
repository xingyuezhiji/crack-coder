"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
let mainWindow = null;
function createWindow() {
    // Create the browser window with invisibility and transparency settings
    mainWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        frame: false, // Removes window chrome/frame
        transparent: true, // Enables window transparency
        backgroundColor: "#00000000", // Fully transparent background
        hasShadow: false, // Removes window shadows
        alwaysOnTop: true, // Keeps window above others
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    // Enable content protection to prevent screen capture
    mainWindow.setContentProtection(true);
    // Platform specific enhancements for macOS
    if (process.platform === 'darwin') {
        mainWindow.setHiddenInMissionControl(true);
        mainWindow.setVisibleOnAllWorkspaces(true, {
            visibleOnFullScreen: true
        });
        mainWindow.setAlwaysOnTop(true, "floating");
    }
    // Load the index.html file from the dist directory
    mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'));
    // Open the DevTools in development
    // mainWindow.webContents.openDevTools();
}
// This method will be called when Electron has finished initialization
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', function () {
        // On macOS re-create a window when dock icon is clicked and no other windows are open
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
// Quit when all windows are closed.
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
// Handle window control events
electron_1.ipcMain.on('minimize-window', () => {
    mainWindow?.minimize();
});
electron_1.ipcMain.on('maximize-window', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow?.unmaximize();
    }
    else {
        mainWindow?.maximize();
    }
});
electron_1.ipcMain.on('close-window', () => {
    mainWindow?.close();
});
