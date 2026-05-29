import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

const FOCUS_TIME = 25 * 60;
const CIRCUMFERENCE = 2 * Math.PI * 100;

function App() {
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const progress = timeLeft / FOCUS_TIME;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(FOCUS_TIME);
  };

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
              style={{
                strokeDasharray: CIRCUMFERENCE,
                strokeDashoffset: dashOffset,
              }}
            />
          </svg>

          <div className="timer-display">
            <div className="timer-label">Focus Session</div>

            <div className="timer-value">
              {String(minutes).padStart(2, "0")}:
              {String(seconds).padStart(2, "0")}
            </div>
          </div>
        </div>

        <div className="controls">
          <button
            className="glass-btn primary"
            onClick={handleStart}
          >
            <Play size={18} />
          </button>

          <button
            className="glass-btn"
            onClick={handlePause}
          >
            <Pause size={18} />
          </button>

          <button
            className="glass-btn"
            onClick={handleReset}
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;