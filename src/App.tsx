import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import ghostSound from "./assets/Ghost Laughing.mp3";
import {
  getCurrentWindow,
  PhysicalPosition,
} from "@tauri-apps/api/window";
import { load } from "@tauri-apps/plugin-store";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;

const CIRCUMFERENCE = 2 * Math.PI * 100;

type SessionType =
  | "focus"
  | "break"
  | "longBreak";

function App() {
  const [sessionType, setSessionType] =
    useState<SessionType>("focus");

  const [timeLeft, setTimeLeft] =
    useState(FOCUS_TIME);

  const [isRunning, setIsRunning] =
    useState(false);

  const [completedFocusSessions, setCompletedFocusSessions] =
    useState(0);

  useEffect(() => {
    const restorePosition = async () => {
      try {
        const store = await load(
          "lumora-settings.json"
        );

        const x =
          await store.get<number>("window_x");

        const y =
          await store.get<number>("window_y");

        if (
          typeof x === "number" &&
          typeof y === "number"
        ) {
          await getCurrentWindow().setPosition(
            new PhysicalPosition(x, y)
          );
        }
      } catch (err) {
        console.error(
          "Restore position failed:",
          err
        );
      }
    };

    restorePosition();
  }, []);

  useEffect(() => {
    const requestNotificationAccess =
      async () => {
        let permissionGranted =
          await isPermissionGranted();

        if (!permissionGranted) {
          const permission =
            await requestPermission();

          permissionGranted =
            permission === "granted";
        }
      };

    requestNotificationAccess();
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);

          try {
            const audio = new Audio(
              ghostSound
            );

            audio.volume = 0.5;
            audio.play();
          } catch (err) {
            console.error(err);
          }

          if (sessionType === "focus") {
            const nextCount =
              completedFocusSessions + 1;

            setCompletedFocusSessions(
              nextCount
            );

            const isLongBreak =
              nextCount % 4 === 0;

            sendNotification({
              title:
                "Focus Session Complete",
              body: isLongBreak
                ? "Long break is ready."
                : "Break session is ready.",
            });

            if (isLongBreak) {
              setSessionType(
                "longBreak"
              );

              setTimeLeft(
                LONG_BREAK_TIME
              );
            } else {
              setSessionType(
                "break"
              );

              setTimeLeft(
                BREAK_TIME
              );
            }
          } else {
            sendNotification({
              title:
                sessionType ===
                "longBreak"
                  ? "Long Break Complete"
                  : "Break Complete",

              body:
                "Focus session is ready.",
            });

            setSessionType(
              "focus"
            );

            setTimeLeft(
              FOCUS_TIME
            );
          }

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isRunning,
    sessionType,
    completedFocusSessions,
  ]);

  const minutes = Math.floor(
    timeLeft / 60
  );

  const seconds = timeLeft % 60;

  const maxTime =
    sessionType === "focus"
      ? FOCUS_TIME
      : sessionType === "break"
      ? BREAK_TIME
      : LONG_BREAK_TIME;

  const progress =
    timeLeft / maxTime;

  const dashOffset =
    CIRCUMFERENCE *
    (1 - progress);

  const savePosition = async () => {
    try {
      const store = await load(
        "lumora-settings.json"
      );

      const position =
        await getCurrentWindow().outerPosition();

      await store.set(
        "window_x",
        position.x
      );

      await store.set(
        "window_y",
        position.y
      );

      await store.save();
    } catch (err) {
      console.error(
        "Save position failed:",
        err
      );
    }
  };

  const startDrag = async () => {
    try {
      const window =
        getCurrentWindow();

      await window.startDragging();

      setTimeout(() => {
        savePosition();
      }, 300);
    } catch (err) {
      console.error(
        "Drag failed:",
        err
      );
    }
  };

  const switchSession = () => {
    setIsRunning(false);

    if (
      sessionType === "focus"
    ) {
      setSessionType(
        "break"
      );

      setTimeLeft(
        BREAK_TIME
      );
    } else {
      setSessionType(
        "focus"
      );

      setTimeLeft(
        FOCUS_TIME
      );
    }
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);

    if (
      sessionType === "focus"
    ) {
      setTimeLeft(
        FOCUS_TIME
      );
    } else if (
      sessionType === "break"
    ) {
      setTimeLeft(
        BREAK_TIME
      );
    } else {
      setTimeLeft(
        LONG_BREAK_TIME
      );
    }
  };

  return (
    <main className="lumora-app">
      <div className="bg-glow glow-purple"></div>
      <div className="bg-glow glow-blue"></div>

      <section
        className="widget"
        onMouseDown={(e) => {
          const target =
            e.target as HTMLElement;

          if (
            target.closest(
              "button"
            )
          ) {
            return;
          }

          startDrag();
        }}
      >
        <div className="reflection reflection-1"></div>
        <div className="reflection reflection-2"></div>

        <div className="widget-header">
          <button
            className="session-pill"
            onClick={
              switchSession
            }
          >
            {sessionType ===
            "focus"
              ? "Deep Work"
              : sessionType ===
                "break"
              ? "Break Time"
              : "Long Break"}
          </button>
        </div>

        <div className="ring-wrapper">
          <svg
            className="progress-ring"
            viewBox="0 0 240 240"
          >
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
                strokeDasharray:
                  CIRCUMFERENCE,
                strokeDashoffset:
                  dashOffset,
              }}
            />
          </svg>

          <div className="timer-display">
            <div className="timer-label">
              {sessionType ===
              "focus"
                ? "Focus Session"
                : sessionType ===
                  "break"
                ? "Break Session"
                : "Long Break"}
            </div>

            <div className="timer-value">
              {String(
                minutes
              ).padStart(
                2,
                "0"
              )}
              :
              {String(
                seconds
              ).padStart(
                2,
                "0"
              )}
            </div>
          </div>
        </div>

        <div className="controls">
          <button
            className="glass-btn primary"
            onClick={
              handleStart
            }
          >
            <Play size={18} />
          </button>

          <button
            className="glass-btn"
            onClick={
              handlePause
            }
          >
            <Pause size={18} />
          </button>

          <button
            className="glass-btn"
            onClick={
              handleReset
            }
          >
            <RotateCcw
              size={18}
            />
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;