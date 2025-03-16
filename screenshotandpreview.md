# Screenshot, Preview and Reset System

## 1. Taking Screenshots

The app uses a global shortcut (Cmd/Ctrl + S) to capture screenshots. The screenshot process is handled by the `ScreenshotHelper` class.

### Screenshot Capture Code
```typescript
// In shortcuts.ts
globalShortcut.register("CommandOrControl+S", async () => {
  const mainWindow = this.appState.getMainWindow()
  if (mainWindow) {
    console.log("Taking screenshot...")
    try {
      const screenshotPath = await this.appState.takeScreenshot()
      const preview = await this.appState.getImagePreview(screenshotPath)
      mainWindow.webContents.send("screenshot-taken", {
        path: screenshotPath,
        preview
      })
    } catch (error) {
      console.error("Error capturing screenshot:", error)
    }
  }
})
```

### Platform-Specific Screenshot Implementation
```typescript
// In ScreenshotHelper.ts
private async captureScreenshotMac(): Promise<Buffer> {
  const tmpPath = path.join(app.getPath("temp"), `${uuidv4()}.png`)
  await execFileAsync("screencapture", ["-x", tmpPath])
  const buffer = await fs.promises.readFile(tmpPath)
  await fs.promises.unlink(tmpPath)
  return buffer
}

private async captureScreenshotWindows(): Promise<Buffer> {
  const tmpPath = path.join(app.getPath("temp"), `${uuidv4()}.png`)
  const script = `
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $screen = [System.Windows.Forms.Screen]::PrimaryScreen
    $bitmap = New-Object System.Drawing.Bitmap $screen.Bounds.Width, $screen.Bounds.Height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($screen.Bounds.X, $screen.Bounds.Y, 0, 0, $bitmap.Size)
    $bitmap.Save('${tmpPath.replace(/\\/g, "\\\\")}')
    $graphics.Dispose()
    $bitmap.Dispose()
  `
  await execFileAsync("powershell", ["-command", script])
  const buffer = await fs.promises.readFile(tmpPath)
  await fs.promises.unlink(tmpPath)
  return buffer
}
```

## 2. Screenshot Queue System

The app maintains two separate queues for screenshots:
1. `screenshotQueue`: For initial screenshots (max 5)
2. `extraScreenshotQueue`: For additional screenshots in solution mode

### Queue Management Code
```typescript
// In ScreenshotHelper.ts
public async takeScreenshot(
  hideMainWindow: () => void,
  showMainWindow: () => void
): Promise<string> {
  hideMainWindow()
  await new Promise((resolve) => setTimeout(resolve, 100))

  let screenshotPath = ""
  try {
    const screenshotBuffer =
      process.platform === "darwin"
        ? await this.captureScreenshotMac()
        : await this.captureScreenshotWindows()

    // Save and manage the screenshot based on current view
    if (this.view === "queue") {
      screenshotPath = path.join(this.screenshotDir, `${uuidv4()}.png`)
      await fs.promises.writeFile(screenshotPath, screenshotBuffer)

      this.screenshotQueue.push(screenshotPath)
      if (this.screenshotQueue.length > this.MAX_SCREENSHOTS) {
        const removedPath = this.screenshotQueue.shift()
        if (removedPath) {
          try {
            await fs.promises.unlink(removedPath)
          } catch (error) {
            console.error("Error removing old screenshot:", error)
          }
        }
      }
    } else {
      // Handle extra screenshots queue
      screenshotPath = path.join(this.extraScreenshotDir, `${uuidv4()}.png`)
      await fs.promises.writeFile(screenshotPath, screenshotBuffer)
      this.extraScreenshotQueue.push(screenshotPath)
      // Similar max screenshot handling...
    }
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 50))
    showMainWindow()
  }

  return screenshotPath
}
```

## 3. Preview System

Screenshots are previewed using base64-encoded data URLs. The system converts PNG files to base64 strings for display in the UI.

### Preview Generation Code
```typescript
// In ScreenshotHelper.ts
public async getImagePreview(filepath: string): Promise<string> {
  try {
    const data = await fs.promises.readFile(filepath)
    return `data:image/png;base64,${data.toString("base64")}`
  } catch (error) {
    console.error("Error reading image:", error)
    throw error
  }
}

// In ipcHandlers.ts - Getting all previews
ipcMain.handle("get-screenshots", async () => {
  try {
    let previews = []
    if (appState.getView() === "queue") {
      previews = await Promise.all(
        appState.getScreenshotQueue().map(async (path) => ({
          path,
          preview: await appState.getImagePreview(path)
        }))
      )
    } else {
      previews = await Promise.all(
        appState.getExtraScreenshotQueue().map(async (path) => ({
          path,
          preview: await appState.getImagePreview(path)
        }))
      )
    }
    return previews
  } catch (error) {
    console.error("Error getting screenshots:", error)
    throw error
  }
})
```

## 4. Reset System (Cmd/Ctrl + R)

The reset functionality clears all queues and returns the app to its initial state.

### Reset Implementation Code
```typescript
// In shortcuts.ts
globalShortcut.register("CommandOrControl+R", () => {
  console.log("Command + R pressed. Canceling requests and resetting queues...")

  // Cancel ongoing API requests
  this.appState.processingHelper.cancelOngoingRequests()

  // Clear both screenshot queues
  this.appState.clearQueues()

  // Update the view state to 'queue'
  this.appState.setView("queue")

  // Notify renderer process
  const mainWindow = this.appState.getMainWindow()
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("reset-view")
  }
})

// In ScreenshotHelper.ts
public clearQueues(): void {
  // Clear screenshotQueue
  this.screenshotQueue.forEach((screenshotPath) => {
    fs.unlink(screenshotPath, (err) => {
      if (err) console.error(`Error deleting screenshot at ${screenshotPath}:`, err)
    })
  })
  this.screenshotQueue = []

  // Clear extraScreenshotQueue
  this.extraScreenshotQueue.forEach((screenshotPath) => {
    fs.unlink(screenshotPath, (err) => {
      if (err) console.error(`Error deleting extra screenshot at ${screenshotPath}:`, err)
    })
  })
  this.extraScreenshotQueue = []
}
```

## Communication Flow

The system uses Electron's IPC (Inter-Process Communication) to coordinate between the main process and renderer process:

1. Main Process → Renderer:
   - `screenshot-taken`: Notifies when a new screenshot is captured
   - `reset-view`: Signals UI to reset when Cmd/Ctrl + R is pressed

2. Renderer → Main:
   - `take-screenshot`: Requests a new screenshot
   - `get-screenshots`: Requests current screenshot previews
   - `delete-screenshot`: Requests deletion of a specific screenshot
