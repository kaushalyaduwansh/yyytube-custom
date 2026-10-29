
import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  ExternalLink,
  LoaderCircle,
} from "lucide-react";

const VIDEO_ID = "k-5R_blzvd8";
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

// YouTube clamps the embed playback rate to at most 2x, so only the rates the
// player actually reports are offered (overridden at runtime by onReady).
const FALLBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const css = `
* { box-sizing: border-box; }
html { scrollbar-width: thin; scrollbar-color: #22d3ee #111827; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #111827; }
::-webkit-scrollbar-thumb { background: linear-gradient(#38bdf8, #0891b2); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: #22d3ee; }

.player-page {
  min-height: 100vh;
  padding: 32px 16px;
  background: #f4f5f7;
  color: #171717;
  font-family: Inter, system-ui, -apple-system, sans-serif;
}
.player-container { max-width: 1000px; margin: 0 auto; }
.player-heading { margin: 0 0 6px; font-size: 27px; font-weight: 750; }
.player-subtitle { margin: 0 0 24px; color: #737373; font-size: 14px; }

.video-shell {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #050505;
  border-radius: 18px;
  color: white;
  box-shadow: 0 20px 48px rgba(15,23,42,.16);
  isolation: isolate;
  transition: box-shadow .25s ease, transform .25s ease;
}
.video-shell:hover { box-shadow: 0 24px 60px rgba(15,23,42,.22); }
.video-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #080808;
  overflow: hidden;
}
.video-stage iframe {
position: absolute;
left: 0;
right: 0;
display: block;
pointer-events: none;
/* The iframe is taller than the stage and centered so the video's 16:9 area
   maps 1:1 onto the stage. YouTube letterboxes the video inside the iframe
   and paints its title, share button and logo into the outer black bars,
   which sit outside the clipped stage — no zoom, no crop, no chrome. */
top: -180px;
height: calc(100% + 360px);
}
.video-shell:fullscreen .video-stage iframe { top: -180px; height: calc(100% + 360px); }
.video-loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #080808;
  color: #e5e5e5;
  font-size: 13px;
}
.video-spinner { animation: player-spin 1s linear infinite; }
@keyframes player-spin { to { transform: rotate(360deg); } }

.video-error {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  background: #101010;
  text-align: center;
}
.video-error p { max-width: 430px; color: #d4d4d4; font-size: 14px; line-height: 1.6; }
.youtube-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 8px;
  background: #fff;
  color: #111;
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
}
.native-center-play-shield {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 3;
  width: 110px;
  height: 110px;
  transform: translate(-50%, -50%);
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, .78);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.video-controls {
  position: absolute;
  inset: auto 0 0;
  z-index: 5;
  padding: 34px 18px 14px;
  border-radius: 0;
  background: linear-gradient(180deg, transparent, rgba(0,0,0,.92));
  box-shadow: none;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity .22s ease, transform .22s ease;
}
.video-shell:hover .video-controls,
.video-shell:focus-within .video-controls { opacity: 1; transform: translateY(0); }
.video-shell:fullscreen { width: 100%; height: 100%; border-radius: 0; }
.video-shell:fullscreen .video-stage { height: 100%; aspect-ratio: auto; }
.video-shell:fullscreen .video-controls { padding: 18px 28px 20px; inset: auto 0 0; }

.seek-row { position: relative; padding: 8px 0; }
.seek-track {
  height: 4px;
  overflow: hidden;
  border-radius: 99px;
  background: rgba(255,255,255,.22);
  transition: height .18s ease;
}
.seek-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #38bdf8, #22d3ee); box-shadow: 0 0 12px rgba(34,211,238,.45); pointer-events: none; }
.seek-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}
.seek-row:hover .seek-track { height: 6px; }

.control-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.control-group { display: flex; align-items: center; gap: 12px; min-width: 0; }
.control-right { display: flex; align-items: center; gap: 12px; }
.player-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 34px;
  height: 34px;
  padding: 7px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: background .18s ease, transform .18s ease, color .18s ease;
}
.player-button:hover { background: rgba(255,255,255,.14); transform: translateY(-1px); }
.player-button:active { transform: scale(.94); }
.player-button:focus-visible { outline: 2px solid #fb7185; outline-offset: 2px; }
.video-time { color: #f5f5f5; font-size: 12px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.volume-slider { width: 72px; accent-color: #f43f5e; cursor: pointer; }
.speed-menu-wrap { position: relative; }
.speed-menu {
  position: absolute;
  right: 0;
  bottom: 44px;
  z-index: 10;
  width: 210px;
  padding: 8px;
  border: 1px solid #383838;
  border-radius: 12px;
  background: rgba(24,24,24,.96);
  box-shadow: 0 16px 44px rgba(0,0,0,.48);
  transform-origin: bottom right;
  animation: menu-in .16s ease-out;
}
@keyframes menu-in { from { opacity: 0; transform: scale(.94) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.speed-title { padding: 7px 9px; color: #a3a3a3; font-size: 12px; }
.speed-option {
  display: block;
  width: 100%;
  padding: 9px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: white;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
}
.speed-option:hover, .speed-option.active { background: #333; }
.speed-option.active { color: #fb7185; }
.speed-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
.speed-chip { text-align: center !important; padding-inline: 4px !important; }
.volume-slider { height: 3px; }

.player-hint { margin-top: 15px; color: #737373; font-size: 12px; line-height: 1.7; }

@media (max-width: 560px) {
  .player-page { padding: 22px 10px; }
  .player-heading { font-size: 22px; }
  .video-shell { border-radius: 9px; }
  .video-controls { padding: 30px 12px 10px; }
  .control-group, .control-right { gap: 5px; }
  .control-toolbar { gap: 5px; }
  .volume-slider { display: none; }
  .video-time { font-size: 10px; }
  .player-button { padding: 4px; }
  .video-shell .video-controls { opacity: 1; }
}
`;

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return "0:00";

  const seconds = Math.floor(value);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return h
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

function loadYouTubeAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);

  if (window.__youtubeApiPromise) return window.__youtubeApiPromise;

  window.__youtubeApiPromise = new Promise((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve(window.YT);
    };

    let script = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (!script) {
      script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        window.__youtubeApiPromise = null;
        reject(new Error("Unable to load the video player API."));
      };
      document.head.appendChild(script);
    }
  });

  return window.__youtubeApiPromise;
}

export default function App() {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    let player;

    const errorMessages = {
      2: "The video ID was rejected or a player parameter is invalid.",
      5: "This video could not be played by the embedded HTML5 player.",
      100: "This video is unavailable, private, or has been removed.",
      101: "The video owner does not allow playback on external websites.",
      150: "The video owner does not allow playback on external websites.",
      153: "The player did not receive the required referrer information. Check your preview origin and browser privacy settings.",
    };

    loadYouTubeAPI()
      .then((YT) => {
        if (cancelled || !hostRef.current) return;

        player = new YT.Player(hostRef.current, {
          width: "100%",
          height: "100%",
          videoId: VIDEO_ID,
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            rel: 0,
            cc_load_policy: 0,
            iv_load_policy: 3,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;

              playerRef.current = event.target;
              setReady(true);
              setErrorMessage("");
              event.target.setVolume(100);
              if (typeof event.target.unloadModule === "function") {
                event.target.unloadModule("captions");
              }
              if (typeof event.target.getAvailablePlaybackRates === "function") {
                const available = event.target.getAvailablePlaybackRates();
                if (Array.isArray(available) && available.length > 0) {
                  setRates([...available].sort((a, b) => a - b));
                }
              }
            },
            onStateChange: (event) => {
              if (cancelled) return;

              // On ENDED, jump back to the start so YouTube never paints its
              // related-videos end screen.
              if (event.data === YT.PlayerState.ENDED) {
                try {
                  event.target.pauseVideo();
                  event.target.seekTo(0, true);
                } catch {
                  // Ignore.
                }
                setPlaying(false);
                return;
              }

              setPlaying(event.data === YT.PlayerState.PLAYING);
            },
            onPlaybackRateChange: (event) => {
              if (!cancelled) setSpeed(event.data);
            },
            onError: (event) => {
              if (cancelled) return;

              setReady(false);
              setPlaying(false);
              setErrorMessage(
                errorMessages[event.data] ||
                  `The video could not be played (error ${event.data}).`
              );
            },
          },
        });

        playerRef.current = player;
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(error.message || "Unable to load the video.");
        }
      });

    intervalRef.current = window.setInterval(() => {
      const p = playerRef.current;
      if (!p || typeof p.getCurrentTime !== "function") return;

      try {
        const time = p.getCurrentTime();
        const total = p.getDuration();

        if (Number.isFinite(time)) setCurrentTime(time);
        if (Number.isFinite(total) && total > 0) setDuration(total);

        // Stay just ahead of the end screen.
        if (Number.isFinite(time) && Number.isFinite(total) && total > 0 && time >= total - 0.4) {
          try {
            p.pauseVideo();
            p.seekTo(0, true);
          } catch {
            // Ignore.
          }
          setPlaying(false);
        }

        if (typeof p.unloadModule === "function") {
          p.unloadModule("captions");
        }
      } catch {
        // The player may not be ready yet.
      }
    }, 500);

    const fullscreenHandler = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", fullscreenHandler);

    return () => {
      cancelled = true;

      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }

      document.removeEventListener("fullscreenchange", fullscreenHandler);

      try {
        player?.destroy();
      } catch {
        // Ignore cleanup errors.
      }

      playerRef.current = null;
    };
  }, []);

  const callPlayer = (method, ...args) => {
    const player = playerRef.current;
    if (typeof player?.[method] === "function") {
      try {
        player[method](...args);
      } catch (error) {
        console.warn(`Player ${method} failed`, error);
      }
    }
  };

  const startPlayback = () => callPlayer("playVideo");

  const seek = (value) => {
    const next = Math.max(0, Math.min(duration || 0, value));
    callPlayer("seekTo", next, true);
    setCurrentTime(next);
  };

  const toggleMute = () => {
    if (muted) {
      callPlayer("unMute");
      callPlayer("setVolume", volume);
      setMuted(false);
    } else {
      callPlayer("mute");
      setMuted(true);
    }
  };

  const changeVolume = (value) => {
    const next = Number(value);
    setVolume(next);
    callPlayer("setVolume", next);

    if (next === 0) {
      callPlayer("mute");
      setMuted(true);
    } else {
      callPlayer("unMute");
      setMuted(false);
    }
  };

  const changeSpeed = (rate) => {
    setSpeed(rate);
    callPlayer("setPlaybackRate", rate);
    setMenuOpen(false);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.querySelector(".video-shell")?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen is not available:", error);
    }
  };

  // Space toggles playback from anywhere on the page. Buttons and links keep
  // their native Space activation; inputs and the page body toggle here.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code !== "Space") return;

      const tag = event.target?.tagName;
      if (tag === "BUTTON" || tag === "A") return;
      if (!ready || errorMessage) return;

      event.preventDefault();
      if (playing) {
        callPlayer("pauseVideo");
      } else {
        startPlayback();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [playing, ready, errorMessage]);

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <style>{css}</style>

      <main className="player-page">
        <div className="player-container">
          <h1 className="player-heading">Custom Video Player</h1>
          <p className="player-subtitle">
            Your video, with a clean custom playback interface.
          </p>

          <section className="video-shell" aria-label="Video player">
            <div
              className="video-stage"
              onClick={() => {
                if (ready && !errorMessage) {
                  setMenuOpen(false);
                  if (playing) {
                    callPlayer("pauseVideo");
                  } else {
                    startPlayback();
                  }
                }
              }}
            >
              <div ref={hostRef} />

              {ready && !playing && !errorMessage && (
                <button
                  type="button"
                  className="native-center-play-shield"
                  aria-label="Play video"
                  onClick={(event) => {
                    event.stopPropagation();
                    startPlayback();
                  }}
                >
                  <Play size={44} fill="currentColor" />
                </button>
              )}

              {!ready && !errorMessage && (
                <div className="video-loading">
                  <LoaderCircle className="video-spinner" size={30} />
                  <span>Loading video…</span>
                </div>
              )}

              {errorMessage && (
                <div className="video-error">
                  <Play size={30} />
                  <p>{errorMessage}</p>
                  <a
                    className="youtube-link"
                    href={VIDEO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open original video <ExternalLink size={15} />
                  </a>
                </div>
              )}

              {ready && !errorMessage && (
                <div
                  className="video-controls"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="seek-row">
                    <div className="seek-track">
                      <div
                        className="seek-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <input
                      className="seek-input"
                      type="range"
                      aria-label="Seek video"
                      min="0"
                      max={duration || 1}
                      step="0.1"
                      value={Math.min(currentTime, duration || 1)}
                      onChange={(event) => seek(Number(event.target.value))}
                    />
                  </div>

                  <div className="control-toolbar">
                    <div className="control-group">
                      <button
                        className="player-button"
                        aria-label={playing ? "Pause" : "Play"}
                        onClick={() =>
                          playing ? callPlayer("pauseVideo") : startPlayback()
                        }
                      >
                        {playing ? (
                          <Pause size={21} fill="currentColor" />
                        ) : (
                          <Play size={21} fill="currentColor" />
                        )}
                      </button>

                      <button
                        className="player-button"
                        aria-label="Rewind 10 seconds"
                        onClick={() => seek(currentTime - 10)}
                      >
                        <RotateCcw size={18} />
                      </button>

                      <button
                        className="player-button"
                        aria-label="Forward 10 seconds"
                        onClick={() => seek(currentTime + 10)}
                      >
                        <RotateCw size={18} />
                      </button>

                      <span className="video-time">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="control-right">
                      <button
                        className="player-button"
                        aria-label={muted ? "Unmute" : "Mute"}
                        onClick={toggleMute}
                      >
                        {muted || volume === 0 ? (
                          <VolumeX size={20} />
                        ) : (
                          <Volume2 size={20} />
                        )}
                      </button>

                      <input
                        className="volume-slider"
                        type="range"
                        aria-label="Volume"
                        min="0"
                        max="100"
                        value={muted ? 0 : volume}
                        onChange={(event) => changeVolume(event.target.value)}
                      />

                      <div className="speed-menu-wrap">
                        <button
                          className="player-button"
                          aria-label="Player settings"
                          aria-expanded={menuOpen}
                          onClick={() => setMenuOpen((open) => !open)}
                        >
                          <SlidersHorizontal size={20} />
                        </button>

                        {menuOpen && (
                          <div className="speed-menu player-settings-menu">
                            <div className="speed-title">Playback speed</div>
                            <div className="speed-grid">
                              {rates.map((rate) => (
                                <button
                                  key={`speed-${rate}`}
                                  className={`speed-option speed-chip ${speed === rate ? "active" : ""}`}
                                  onClick={() => changeSpeed(rate)}
                                >
                                  {rate}x
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        className="player-button"
                        aria-label={
                          isFullscreen ? "Exit fullscreen" : "Fullscreen"
                        }
                        onClick={toggleFullscreen}
                      >
                        {isFullscreen ? (
                          <Minimize size={20} />
                        ) : (
                          <Maximize size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <p className="player-hint">
            Controls: Play/pause, skip 10 seconds, adjust volume, change speed,
            seek and fullscreen. Press Space to play or pause, or click the
            video to toggle.
          </p>
        </div>
      </main>
    </>
  );
}
