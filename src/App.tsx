import { useEffect, useState, useRef } from "react";
import { Pause, Play, RotateCcw, Settings, } from "lucide-react";
import whaleSound from "./assets/Whale.mp3";
import deepSound from "./assets/174_Hz.mp3";
import focusSound from "./assets/528_Hz.mp3";
import silentSound from "./assets/Silence.mp3";
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
import {
  enable,
  disable,
  isEnabled,
} from "@tauri-apps/plugin-autostart";


const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;
const INACTIVITY_RESET_HOURS = 5;

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

  const [sessionsToday, setSessionsToday] =
    useState(0);

  const [focusSecondsToday, setFocusSecondsToday] =
    useState(0);

  const [showSettings, setShowSettings] =
    useState(false);

  const settingsRef =
    useRef<HTMLDivElement>(null);
    
  const [theme, setTheme] =
    useState("purple");

  const [sound, setSound] =
    useState("whale");
  const [activeDropdown, setActiveDropdown] =
    useState<
      "theme" |
      "sound" |
      null
    >(null);

  const [showAboutModal, setShowAboutModal] =
    useState(false);

  const [showResetModal, setShowResetModal] =
    useState(false);

  const [launchOnStartup, setLaunchOnStartup] =
    useState(false);
  const dragStartRef =
    useRef<{ x: number; y: number } | null>(
      null
    );

  useEffect(() => {
    const initializeApp = async () => {
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

        const storedTheme =
          (await store.get<string>(
            "theme"
          ))  ?? "purple";

        const storedSound =
          (await store.get<string>(
            "sound"
          )) ?? "whale";

        try {
          const enabled =
            await isEnabled();

          setLaunchOnStartup(
            enabled
          );
        } catch (err) {
          console.error(
            "Autostart check failed:",
            err
          );
        }

        const storedSessions =
          (await store.get<number>(
            "sessions_today"
          )) ?? 0;

        const storedFocusSeconds =
          (await store.get<number>(
            "focus_seconds_today"
          )) ?? 0;

        const lastActivity =
          (await store.get<number>(
            "last_activity_timestamp"
          )) ?? Date.now();

        const now = Date.now();

        const inactivityHours =
          (now - lastActivity) /
          (1000 * 60 * 60);

        const lastDate =
          new Date(lastActivity)
            .toDateString();

        const currentDate =
          new Date(now)
            .toDateString();

        if (
          lastDate !== currentDate &&
          inactivityHours >
            INACTIVITY_RESET_HOURS
        ) {
          await store.set(
            "sessions_yesterday",
            storedSessions
          );

          await store.set(
            "focus_seconds_yesterday",
            storedFocusSeconds
          );

          await store.set(
            "sessions_today",
            0
          );

          await store.set(
            "focus_seconds_today",
            0
          );

          await store.save();

          setSessionsToday(0);
          setFocusSecondsToday(0);
        } else {
          setSessionsToday(
            storedSessions
          );

          setFocusSecondsToday(
            storedFocusSeconds
          );

        }
        setTheme(storedTheme);
        setSound(storedSound);
      }catch (err) {
        console.error(
          "Initialization failed:",
          err
        );
      }
    };
    

    initializeApp();
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
            const selectedSound =
              sound === "whale"
              ? whaleSound
              : sound === "174"
              ? deepSound
              : sound === "528"
              ? focusSound
              : silentSound;

            if (sound !== "silent") {
              const audio =
                new Audio(
                  selectedSound
                );

              audio.volume = 0.5;

              audio.play();
            }
          } catch (err) {
            console.error(err);
          }

          if (sessionType === "focus") {
            const nextCount =
              completedFocusSessions + 1;

            setCompletedFocusSessions(
              nextCount
            );

            const updatedSessions =
              sessionsToday + 1;

            const updatedSeconds =
              focusSecondsToday +
              FOCUS_TIME;

            setSessionsToday(
              updatedSessions
            );

            setFocusSecondsToday(
              updatedSeconds
            );

            saveStats(
              updatedSessions,
              updatedSeconds
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
    sessionsToday,
    focusSecondsToday,
    sound
  ]);

  const minutes = Math.floor(
    timeLeft / 60
  );

  const seconds = timeLeft % 60;

  const focusMinutesToday =
    Math.floor(
      focusSecondsToday / 60
    );

  const statsText =
    sessionsToday === 0
      ? "Ready to Focus"
      : `${sessionsToday} ${
          sessionsToday === 1
            ? "Session"
            : "Sessions"
        } • ${focusMinutesToday}m Today`;

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

  const saveStats = async (
    sessions: number,
    seconds: number
  ) => {
    try {
      const store = await load(
        "lumora-settings.json"
      );

      await store.set(
        "sessions_today",
        sessions
      );

      await store.set(
        "focus_seconds_today",
        seconds
      );

      await store.set(
        "last_activity_timestamp",
        Date.now()
      );

      await store.save();
    } catch (err) {
      console.error(
        "Save stats failed:",
        err
      );
    }
  };

  const saveTheme = async (
    selectedTheme: string
  ) => {
    try {
      const store = await load(
        "lumora-settings.json"
      );

      await store.set(
        "theme",
        selectedTheme
      );

      await store.save();
    } catch (err) {
      console.error(
        "Save theme failed:",
        err
      );
    }
  };

  const saveSound = async (
    selectedSound: string
  ) => {
    try {
      const store = await load(
        "lumora-settings.json"
      );

      await store.set(
        "sound",
        selectedSound
      );

      await store.save();
    } catch (err) {
      console.error(
        "Save sound failed:",
        err
      );
    }
  };

  const saveLaunchOnStartup = async (
    enabled: boolean
  ) => {
    try {
      if (enabled) {
        await enable();
      } else {
        await disable();
      }

      const store = await load(
        "lumora-settings.json"
      );

      await store.set(
        "launch_on_startup",
        enabled
      );

      await store.save();

      setLaunchOnStartup(
        enabled
      );
    } catch (err) {
      console.error(
        "Autostart update failed:",
        err
      );
    }
  };

  const handleThemeChange = (
    selectedTheme: string
  ) => {
    setTheme(selectedTheme);

    saveTheme(selectedTheme);
  };

  const handleSoundChange = (
    selectedSound: string
  ) => {
    setSound(selectedSound);

    saveSound(selectedSound);
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

  const handleStart = async () => {
    try {
      const store = await load(
        "lumora-settings.json"
      );

      await store.set(
        "last_activity_timestamp",
        Date.now()
      );

      await store.save();
    } catch {}

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

  const handleResetStats = async () => {
    try {
      const store = await load(
        "lumora-settings.json"
      );

      await store.set(
        "sessions_today",
        0
      );

      await store.set(
        "focus_seconds_today",
        0
      );

      await store.save();

      setSessionsToday(0);
      setFocusSecondsToday(0);

      setShowSettings(false);
    } catch (err) {
      console.error(
        "Reset stats failed:",
        err
      );
    }
  };

  return (
    <main 
      className="lumora-app"
      style={{
        ["--accent" as any]:
          theme === "purple"
            ? "#9f6fff"
            : theme === "blue"
            ? "#4da6ff"
            : theme === "green"
            ? "#43d17a"
            : "#d0d0d0"
      }}
    >
      <div className="bg-glow glow-purple"></div>
      <div className="bg-glow glow-blue"></div>

      <section
        className="widget"
        onClick={() => {
          if (showSettings) {
            setShowSettings(false);
            setActiveDropdown(null);
          }
        }}
        onMouseDown={(e) => {
          const target =
            e.target as HTMLElement;

            if (
              target.closest("button")
            ) {
              return;
            }

            dragStartRef.current = {
              x: e.clientX,
              y: e.clientY,
            };
          }}
          onMouseMove={(e) => {
            if (!dragStartRef.current) {
              return;
            }

            const dx = Math.abs(
              e.clientX -
                dragStartRef.current.x
            );

            const dy = Math.abs(
              e.clientY -
                dragStartRef.current.y
            );

            if (dx > 5 || dy > 5) {
              dragStartRef.current =
                null;

              startDrag();
            }
          }}
          onMouseUp={() => {
            dragStartRef.current =
              null;
          }}
        >
        <div className="reflection reflection-1"></div>
        <div className="reflection reflection-2"></div>

      {showSettings && (
        <div 
          ref={settingsRef} 
          className="settings-menu"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <div className="settings-top-row">

            
            <button
              onClick={() =>
                setActiveDropdown(
                  activeDropdown === "theme"
                    ? null
                    : "theme"
                )
              }
            >
              Theme ▼
            </button>


            <button
              onClick={() =>
                setActiveDropdown(
                  activeDropdown === "sound"
                    ? null
                    : "sound"
                )
              }
            >
              Sound: {sound} ▼
            </button>
            


          </div>

          <div className="settings-dropdown-area">

            {(
              activeDropdown === "theme"
            ) && (
              <>
                <button onClick={() => {
                  handleThemeChange("purple");
                  setActiveDropdown(null);

                }}>
                  Purple  
                </button>

                <button onClick={() => {
                  handleThemeChange("blue");
                  setActiveDropdown(null);
                }}>
                  Blue
                </button>

                <button onClick={() => {
                  handleThemeChange("green");
                  setActiveDropdown(null);
                }}>
                  Green
                </button>

                <button onClick={() => {
                  handleThemeChange("mono");
                  setActiveDropdown(null);
                }}>
                  Monochrome
                </button>
              </>
            )}

            {(
              activeDropdown === "sound"
            )&& (
              <>
                <button onClick={() => {
                  handleSoundChange("whale");
                  setActiveDropdown(null);
                }}>
                  Whale Song
                </button>

                <button onClick={() => {
                  handleSoundChange("174");
                  setActiveDropdown(null);
                }}>
                  Deep Frequency
                </button>

                <button onClick={() => {
                  handleSoundChange("528");
                  setActiveDropdown(null);
                }}>
                  Focus Frequency
                </button>

                <button onClick={() => {
                  handleSoundChange("silent");
                  setActiveDropdown(null);
                }}>
                  Silent
                </button>
              </>
            )}

          </div>

          <div className="settings-bottom-row">

            <button
              onClick={() =>
                saveLaunchOnStartup(  
                  !launchOnStartup
                )
              }
            >
              {launchOnStartup  
                ? "✓ Startup"
                : "Startup"}
            </button>

            <button
              className="settings-danger"
              onClick={() =>
                setShowResetModal(true)
              }
            >
              Reset Stats
            </button>

            <button
              className="settings-info"
              onClick={() =>
                setShowAboutModal(true) 
              }
            >
              About
            </button>

          </div>
        </div>
      )}
        
      

      
        <div className="widget-header">

          <button
            className= "settings-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(
                !showSettings
              );  
            }}
            >
             <Settings size={16} /> 
            </button>
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

        <div 
          className="ring-wrapper"
          onClick={() =>{
            if (showSettings){
              setShowSettings(false);
            }
          }}>
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

        <div
          className="stats-line"
          onClick={() => {
            if (showSettings) {
              setShowSettings(false);
            }
          }}
        >
          {statsText} 
        </div>

        <div
          className="controls"
          onClick={() => {
            if (showSettings) {
              setShowSettings(false);
            }
          }}
        >
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
      

      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-card">

            <h3>Reset Statistics</h3>

            <p>
              Reset today's sessions
              and focus time?
            </p>

            <div className="modal-actions">

              <button
                className="modal-btn"
                onClick={() =>
                  setShowResetModal(false)
                }
              >
                Cancel
              </button>

              <button
                className="modal-btn danger"
                onClick={() => {
                  handleResetStats();
                  setShowResetModal(false);
                }}
              >
                Reset
              </button>

            </div>
          </div>
        </div>
      )}

        {showAboutModal && (
          <div className="modal-overlay">
            <div className="modal-card">

              <h3>Lumora</h3>

              <p>
                Version 1.0
              </p>

              <p>
                Minimal focus widget
                built with Tauri.
              </p>

              <div className="modal-actions">

                <button
                  className="modal-btn"
                  onClick={() =>
                    setShowAboutModal(false)
                  }
                >
                  Close
                </button>

              </div>
            </div>
            </div>
        )}
      </section>
    </main>
  );
}

export default App;