import { Play, Pause, RotateCcw } from "lucide-react";

function App() {
  return (
    <div className="app-shell">
      <div className="ambient-glow"></div>

      <div className="widget-card">
        <div className="widget-header">
          <span className="badge">Focus Session</span>
        </div>

        <div className="timer-section">
          <div className="timer-ring">
            <div className="timer-value">25:00</div>
          </div>
        </div>

        <div className="controls">
          <button className="control-btn primary">
            <Play size={18} />
            Start
          </button>

          <button className="control-btn">
            <Pause size={18} />
            Pause
          </button>

          <button className="control-btn">
            <RotateCcw size={18} />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;