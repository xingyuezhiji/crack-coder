import React, { useState, useEffect } from 'react';
import './App.css';

interface Screenshot {
  id: number;
  preview: string;
  path: string;
}

declare global {
  interface Window {
    electron: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      quit: () => void;
      takeScreenshot: () => Promise<void>;
      processScreenshots: () => Promise<void>;
      resetQueue: () => Promise<void>;
      onProcessingComplete: (callback: (result: string) => void) => void;
      onScreenshotTaken: (callback: (data: Screenshot) => void) => void;
      onQueueReset: (callback: () => void) => void;
    };
  }
}

const App: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);

  useEffect(() => {
    // Listen for processing complete events
    window.electron.onProcessingComplete((result) => {
      setResult(result);
      setIsProcessing(false);
    });

    // Listen for new screenshots
    window.electron.onScreenshotTaken((screenshot) => {
      setScreenshots(prev => [...prev, screenshot]);
    });

    // Listen for queue reset
    window.electron.onQueueReset(() => {
      setScreenshots([]);
    });
  }, []);

  const handleMinimize = () => {
    if (window.electron) window.electron.minimize();
  };

  const handleClose = () => {
    if (window.electron) window.electron.close();
  };

  const handleTakeScreenshot = async () => {
    if (screenshots.length >= 4) return;
    await window.electron.takeScreenshot();
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setResult(null);
    await window.electron.processScreenshots();
  };

  const handleReset = async () => {
    await window.electron.resetQueue();
  };

  const handleQuit = () => {
    window.electron.quit();
  };

  return (
    <div className="app">
      <div className="window-controls">
        <button className="control minimize" onClick={handleMinimize} title="Minimize">−</button>
        <button className="control close" onClick={handleClose} title="Close">×</button>
      </div>
      
      <h1>Screenshot Processor</h1>
      
      <div className="card">
        <div className="shortcuts-info">
          <p><code>Cmd/Ctrl + H</code> - Take Screenshot</p>
          <p><code>Cmd/Ctrl + Enter</code> - Process Queue</p>
          <p><code>Cmd/Ctrl + R</code> - Reset Queue</p>
          <p><code>Cmd/Ctrl + B</code> - Toggle Window</p>
          <p><code>Cmd/Ctrl + Q</code> - Quit App</p>
        </div>

        <div className="status">
          <p>Screenshots in queue: {screenshots.length}/4</p>
          {isProcessing && <p className="processing">Processing...</p>}
          {result && <div className="result">{result}</div>}
        </div>

        {screenshots.length > 0 && (
          <div className="preview-grid">
            {screenshots.map(screenshot => (
              <div key={screenshot.id} className="preview-item">
                <img src={screenshot.preview} alt="Screenshot preview" />
              </div>
            ))}
          </div>
        )}

        <div className="actions">
          <button 
            onClick={handleTakeScreenshot} 
            disabled={isProcessing || screenshots.length >= 4}
          >
            Take Screenshot
          </button>
          <button 
            onClick={handleProcess} 
            disabled={isProcessing || screenshots.length === 0}
          >
            Process Queue
          </button>
          <button 
            onClick={handleReset} 
            disabled={isProcessing && screenshots.length === 0}
          >
            Reset
          </button>
          <button onClick={handleQuit}>
            Quit
          </button>
        </div>
      </div>
    </div>
  );
};

export default App; 