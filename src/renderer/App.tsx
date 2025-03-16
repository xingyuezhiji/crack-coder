import React, { useState } from 'react';
import './App.css';

declare global {
  interface Window {
    electron: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
  }
}

const App: React.FC = () => {
  const [count, setCount] = useState(0);

  const handleMinimize = () => {
    if (window.electron) window.electron.minimize();
  };

  const handleClose = () => {
    if (window.electron) window.electron.close();
  };

  return (
    <div className="app">
      <div className="window-controls">
        <button className="control minimize" onClick={handleMinimize} title="Minimize">−</button>
        <button className="control close" onClick={handleClose} title="Close">×</button>
      </div>
      <h1>Welcome to Your Electron React App!</h1>
      <div className="card">
        <button onClick={() => setCount(count + 1)}>
          Count is {count}
        </button>
        <p>
          Edit <code>src/renderer/App.tsx</code> and save to test HMR
        </p>
      </div>
    </div>
  );
};

export default App; 