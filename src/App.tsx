import { Pause, Play, RotateCcw } from "lucide-react";

function App() {
  return (
    <main className="lumora-app">
      <div className="bg-glow glow-purple"></div>
      <div className="bg-glow glow-blue"></div>

      <section className="widget">
        <div className="reflection reflection-1"></div>
        <div className="reflection reflection-2"></div>

        <div className="widget-header">
          <span className="session-pill">Deep Work</span>
        </div>

        <div className="ring-wrapper">
          <svg className="progress-ring" viewBox="0 0 240 240">
            <circle
              className="ring-track"
              cx="120"
              cy="120"
              r="100"
            />

            <circle
              className="ring-progress"
              cx="120"
              cy="120"
              r="100"
            />
          </svg>

          <div className="timer-display">
            <div className="timer-label">Focus Session</div>
            <div className="timer-value">25:00</div>
          </div>
        </div>

        <div className="controls">
          <button className="glass-btn primary">
            <Play size={18} />
          </button>

          <button className="glass-btn">
            <Pause size={18} />
          </button>

          <button className="glass-btn">
            <RotateCcw size={18} />
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;