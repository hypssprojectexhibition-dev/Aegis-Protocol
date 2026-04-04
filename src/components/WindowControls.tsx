import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X } from 'lucide-react';

const appWindow = getCurrentWindow();

export default function WindowControls() {
  const onMinimize = () => appWindow.minimize();
  const onMaximize = () => appWindow.toggleMaximize();
  const onClose = () => appWindow.close();

  return (
    <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
      <button 
        onClick={onMinimize}
        className="window-control-btn"
        title="Minimize"
      >
        <Minus size={16} />
      </button>
      <button 
        onClick={onMaximize}
        className="window-control-btn"
        title="Maximize"
      >
        <Square size={14} />
      </button>
      <button 
        onClick={onClose}
        className="window-control-btn close"
        title="Close"
      >
        <X size={16} />
      </button>
      <style>{`
        .window-control-btn {
          width: 48px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: var(--text-primary);
          opacity: 0.6;
          cursor: pointer;
          transition: all 0.2s;
        }
        .window-control-btn:hover {
          opacity: 1;
          background: rgba(128, 128, 128, 0.1);
        }
        .window-control-btn.close:hover {
          background: #e81123;
          color: white;
        }
      `}</style>
    </div>
  );
}
