import React, { useState, useEffect } from 'react';
import './App.css';

interface Screenshot {
  id: number;
  preview: string;
  path: string;
}

interface ProcessedSolution {
  approach: string;
  code: string;
  timeComplexity: string;
  spaceComplexity: string;
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
      onProcessingStarted: (callback: () => void) => void;
      onQueueReset: (callback: () => void) => void;
    };
  }
}

const App: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessedSolution | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);

  useEffect(() => {
    console.log('Setting up event listeners...');

    // Listen for processing started events
    window.electron.onProcessingStarted(() => {
      console.log('Processing started');
      setIsProcessing(true);
      setResult(null);
    });

    // Keyboard event listener
    const handleKeyDown = async (event: KeyboardEvent) => {
      console.log('Key pressed:', event.key);
      
      // Check if Cmd/Ctrl is pressed
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;

      switch (event.key.toLowerCase()) {
        case 'h':
          console.log('Screenshot hotkey pressed');
          await handleTakeScreenshot();
          break;
        case 'enter':
          console.log('Process hotkey pressed');
          await handleProcess();
          break;
        case 'r':
          console.log('Reset hotkey pressed');
          await handleReset();
          break;
        case 'b':
          if (isCmdOrCtrl) {
            console.log('Toggle visibility hotkey pressed');
            // Toggle visibility logic here
          }
          break;
        case 'q':
          if (isCmdOrCtrl) {
            console.log('Quit hotkey pressed');
            handleQuit();
          }
          break;
      }
    };

    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown);

    // Listen for processing complete events
    window.electron.onProcessingComplete((resultStr) => {
      console.log('Processing complete. Result:', resultStr);
      try {
        const parsedResult = JSON.parse(resultStr) as ProcessedSolution;
        setResult(parsedResult);
      } catch (error) {
        console.error('Error parsing result:', error);
      }
      setIsProcessing(false);
    });

    // Listen for new screenshots
    window.electron.onScreenshotTaken((screenshot) => {
      console.log('New screenshot taken:', screenshot);
      setScreenshots(prev => {
        const newScreenshots = [...prev, screenshot];
        console.log('Updated screenshots array:', newScreenshots);
        return newScreenshots;
      });
    });

    // Listen for queue reset
    window.electron.onQueueReset(() => {
      console.log('Queue reset triggered');
      setScreenshots([]);
      setResult(null);
    });

    // Cleanup
    return () => {
      console.log('Cleaning up event listeners...');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleTakeScreenshot = async () => {
    console.log('Taking screenshot, current count:', screenshots.length);
    if (screenshots.length >= 4) {
      console.log('Maximum screenshots reached');
      return;
    }
    try {
      await window.electron.takeScreenshot();
      console.log('Screenshot taken successfully');
    } catch (error) {
      console.error('Error taking screenshot:', error);
    }
  };

  const handleProcess = async () => {
    console.log('Starting processing. Current screenshots:', screenshots);
    if (screenshots.length === 0) {
      console.log('No screenshots to process');
      return;
    }
    setIsProcessing(true);
    setResult(null);
    try {
      await window.electron.processScreenshots();
      console.log('Process request sent successfully');
    } catch (error) {
      console.error('Error processing screenshots:', error);
      setIsProcessing(false);
    }
  };

  const handleReset = async () => {
    console.log('Resetting queue...');
    await window.electron.resetQueue();
  };

  const handleQuit = () => {
    console.log('Quitting application...');
    window.electron.quit();
  };

  // Log state changes
  useEffect(() => {
    console.log('State update:', {
      isProcessing,
      result,
      screenshotCount: screenshots.length
    });
  }, [isProcessing, result, screenshots]);

  return (
    <div className="app">
      {/* Preview Row */}
      <div className="preview-row">
        {screenshots.map(screenshot => (
          <div key={screenshot.id} className="preview-item">
            <img src={screenshot.preview} alt="Screenshot preview" />
          </div>
        ))}
      </div>

      {/* Status Row */}
      <div className="status-row">
        {isProcessing ? (
          <div className="processing">Processing... ({screenshots.length} screenshots)</div>
        ) : result ? (
          <div className="result">
            <div className="solution-section">
              <h3>Approach</h3>
              <p>{result.approach}</p>
            </div>
            <div className="solution-section">
              <h3>Solution</h3>
              <pre><code>{result.code}</code></pre>
            </div>
            <div className="solution-section">
              <h3>Complexity Analysis</h3>
              <p>Time: {result.timeComplexity}</p>
              <p>Space: {result.spaceComplexity}</p>
            </div>
            <div className="hint">(Press R to reset)</div>
          </div>
        ) : (
          <div className="empty-status">
            {screenshots.length > 0 
              ? `Press Enter to process ${screenshots.length} screenshot${screenshots.length > 1 ? 's' : ''}`
              : 'Press H to take a screenshot'}
          </div>
        )}
      </div>

      {/* Shortcuts Row */}
      <div className="shortcuts-row">
        <div className="shortcut"><code>H</code> Screenshot</div>
        <div className="shortcut"><code>↵</code> Process</div>
        <div className="shortcut"><code>R</code> Reset</div>
        <div className="shortcut"><code>B</code> Toggle</div>
        <div className="shortcut"><code>Q</code> Quit</div>
      </div>
    </div>
  );
};

export default App; 