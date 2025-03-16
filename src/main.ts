import { app, BrowserWindow, ipcMain, contextBridge } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // Create the browser window with invisibility and transparency settings
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,           // Removes window chrome/frame
    transparent: true,      // Enables window transparency
    backgroundColor: "#00000000",  // Fully transparent background
    hasShadow: false,      // Removes window shadows
    alwaysOnTop: true,     // Keeps window above others
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
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS re-create a window when dock icon is clicked and no other windows are open
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle window control events
ipcMain.on('minimize-window', () => {
  mainWindow?.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow?.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('close-window', () => {
  mainWindow?.close();
}); 