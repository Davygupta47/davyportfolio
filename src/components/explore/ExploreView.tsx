"use client";

import { useEffect, useRef, useState } from "react";
import { Flex, Row, Line } from "@once-ui-system/core";
import { PiCompassDuotone, PiGameControllerDuotone, PiCameraDuotone, PiCameraSlashDuotone, PiKeyReturnDuotone, PiSpeakerSimpleHighDuotone, PiSpeakerSimpleSlashDuotone } from "react-icons/pi";
import styles from "./ExploreView.module.scss";

// Declare global types for MediaPipe variables loaded via CDN
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

interface SnakeSegment {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

interface Bubble {
  id: number;
  x: number;
  y: number;
  radius: number;
  speedY: number;
  color: string;
  popped: boolean;
}

interface HighScore {
  name: string;
  score: number;
  date: string;
}

interface ScoreBoard {
  snake: HighScore[];
  bubble: HighScore[];
}

// Audio Synth Utility
let audioCtx: AudioContext | null = null;
const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
};

const playSynthSound = (type: "eat" | "pop" | "crash" | "start", muted: boolean) => {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "eat") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "pop") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1500, now + 0.07);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === "crash") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(30, now + 0.35);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "start") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(261.63, now); // C4
      osc.frequency.setValueAtTime(329.63, now + 0.08); // E4
      osc.frequency.setValueAtTime(392.00, now + 0.16); // G4
      osc.frequency.setValueAtTime(523.25, now + 0.24); // C5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.setValueAtTime(0.08, now + 0.24);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (err) {
    console.warn("Synth Audio blocked or failed:", err);
  }
};

const DEFAULT_SCORES: ScoreBoard = {
  snake: [
    { name: "Davy (Dev)", score: 280, date: "2026-06-04" },
    { name: "MediaPipeBot", score: 180, date: "2026-06-04" },
    { name: "AI Subagent", score: 120, date: "2026-06-04" },
  ],
  bubble: [
    { name: "Davy (Dev)", score: 450, date: "2026-06-04" },
    { name: "LaserFinger", score: 320, date: "2026-06-04" },
    { name: "BubbleSlayer", score: 210, date: "2026-06-04" },
  ],
};

const BUBBLE_COLORS = ["#00f3ff", "#ff007f", "#9d00ff", "#00ff66", "#ffb700"];

export default function ExploreView() {
  const [activeGame, setActiveGame] = useState<"snake" | "bubble">("snake");
  const [gameStatus, setGameStatus] = useState<"IDLE" | "PLAYING" | "PAUSED" | "GAME_OVER">("IDLE");
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState<ScoreBoard>(DEFAULT_SCORES);
  const [useWebcam, setUseWebcam] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [handActive, setHandActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [username, setUsername] = useState("Player");
  const [gameSpeed, setGameSpeed] = useState<"slow" | "normal" | "fast">("normal");

  // Debug position state
  const [trackedCoords, setTrackedCoords] = useState<{ x: number; y: number } | null>(null);
  const [activeGestureDirection, setActiveGestureDirection] = useState<Direction | null>(null);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const anchorRef = useRef<{ x: number; y: number } | null>(null);

  // Game engine refs (to avoid closure capture problems in loops)
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleRequestRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // Snake State
  const snakeRef = useRef<{
    snake: SnakeSegment[];
    dir: Direction;
    nextDir: Direction;
    food: SnakeSegment;
    gridSize: number;
    score: number;
  }>({
    snake: [],
    dir: "RIGHT",
    nextDir: "RIGHT",
    food: { x: 5, y: 5 },
    gridSize: 20,
    score: 0,
  });

  // Bubble State
  const bubbleRef = useRef<{
    bubbles: Bubble[];
    pointer: { x: number; y: number } | null;
    lastSpawn: number;
    bubbleId: number;
    score: number;
  }>({
    bubbles: [],
    pointer: null,
    lastSpawn: 0,
    bubbleId: 0,
    score: 0,
  });

  // 1. Load high scores from localstorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("davyportfolio_cv_scores");
      if (stored) {
        setHighScores(JSON.parse(stored));
      } else {
        localStorage.setItem("davyportfolio_cv_scores", JSON.stringify(DEFAULT_SCORES));
      }
    } catch (e) {
      console.warn("localStorage not accessible:", e);
    }
  }, []);

  // 2. Load MediaPipe scripts dynamically
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    
    const injectScripts = () => {
      if (window.Hands && window.Camera) {
        setScriptsLoaded(true);
        return;
      }

      // Check if scripts are already in document
      const existingCamera = document.getElementById("mp-camera-script");
      const existingHands = document.getElementById("mp-hands-script");

      if (!existingCamera) {
        const camScript = document.createElement("script");
        camScript.id = "mp-camera-script";
        camScript.src = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";
        camScript.async = true;
        document.head.appendChild(camScript);
      }

      if (!existingHands) {
        const handsScript = document.createElement("script");
        handsScript.id = "mp-hands-script";
        handsScript.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
        handsScript.async = true;
        document.head.appendChild(handsScript);
      }

      checkInterval = setInterval(() => {
        if (window.Hands && window.Camera) {
          clearInterval(checkInterval);
          setScriptsLoaded(true);
        }
      }, 200);
    };

    injectScripts();

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  // 3. Initialize MediaPipe and Webcam Stream
  useEffect(() => {
    if (!scriptsLoaded || !useWebcam) {
      cleanupCamera();
      return;
    }

    let active = true;
    let camera: any = null;
    let hands: any = null;

    const initCameraAndTracking = async () => {
      try {
        setCameraError("");
        const constraints = { video: { width: 320, height: 240, facingMode: "user" } };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        webcamStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Initialize MediaPipe Hands
        hands = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        hands.onResults((results: any) => {
          if (!active) return;
          processGestureResults(results);
        });

        // Setup MediaPipe camera helper
        if (videoRef.current) {
          camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && useWebcam && active) {
                await hands.send({ image: videoRef.current });
              }
            },
            width: 320,
            height: 240,
          });
          camera.start();
        }
      } catch (err: any) {
        console.error("Camera acquisition failed:", err);
        setCameraError(err.message || "Could not access camera. Please allow permission.");
        setUseWebcam(false);
      }
    };

    initCameraAndTracking();

    return () => {
      active = false;
      cleanupCamera();
      if (camera) camera.stop();
      if (hands) hands.close();
    };
  }, [scriptsLoaded, useWebcam]);

  const cleanupCamera = () => {
    setHandActive(false);
    setTrackedCoords(null);
    setActiveGestureDirection(null);
    anchorRef.current = null;
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    // Clear camera canvas
    const canvas = cameraCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // 4. Process Hand Landmarks and HUD Control
  const processGestureResults = (results: any) => {
    const video = videoRef.current;
    const canvas = cameraCanvasRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Sync canvas size with video streaming dimensions for perfect mobile scaling
    if (video.videoWidth && canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Detect hand
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHandActive(true);
      const landmarks = results.multiHandLandmarks[0];

      // Draw all hand knuckles (glowing dots)
      ctx.fillStyle = "rgba(0, 243, 255, 0.6)";
      ctx.shadowBlur = 4;
      ctx.shadowColor = "#00f3ff";
      for (let i = 0; i < landmarks.length; i++) {
        const lx = (1 - landmarks[i].x) * canvas.width; // Mirror horizontal
        const ly = landmarks[i].y * canvas.height;
        ctx.beginPath();
        ctx.arc(lx, ly, i === 8 ? 6 : 3, 0, 2 * Math.PI); // Larger dot for index finger tip
        ctx.fill();
      }

      // Draw skeleton connecting lines
      ctx.strokeStyle = "rgba(0, 243, 255, 0.25)";
      ctx.lineWidth = 1.5;
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [5, 9], [9, 10], [10, 11], [11, 12],
        [9, 13], [13, 14], [14, 15], [15, 16],
        [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
      ];
      connections.forEach(([start, end]) => {
        const sx = (1 - landmarks[start].x) * canvas.width;
        const sy = landmarks[start].y * canvas.height;
        const ex = (1 - landmarks[end].x) * canvas.width;
        const ey = landmarks[end].y * canvas.height;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      });

      // Calculate palm center (average of wrist 0, index knuckle 5, pinky knuckle 17)
      const w = landmarks[0];
      const iKnuckle = landmarks[5];
      const pKnuckle = landmarks[17];
      const px = ((1 - w.x) + (1 - iKnuckle.x) + (1 - pKnuckle.x)) / 3 * canvas.width;
      const py = (w.y + iKnuckle.y + pKnuckle.y) / 3 * canvas.height;

      // Index finger tip (landmark index 8)
      const indexTip = landmarks[8];
      const pointerX = (1 - indexTip.x) * canvas.width;
      const pointerY = indexTip.y * canvas.height;

      setTrackedCoords({ x: Math.round(pointerX), y: Math.round(pointerY) });

      // Initialize anchor if null
      if (!anchorRef.current) {
        anchorRef.current = { x: px, y: py };
      }

      const dx = px - anchorRef.current.x;
      const dy = py - anchorRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Slide/drift anchor if hand is moved too far
      const maxRadius = Math.min(canvas.width, canvas.height) * 0.22; // Dynamic outer radius based on camera size
      if (distance > maxRadius) {
        const angle = Math.atan2(dy, dx);
        anchorRef.current.x = px - Math.cos(angle) * maxRadius;
        anchorRef.current.y = py - Math.sin(angle) * maxRadius;
      }

      // If active game is Bubble Pop, send pointer position directly (normalized)
      if (activeGame === "bubble") {
        bubbleRef.current.pointer = { x: indexTip.x, y: indexTip.y };
      }

      // If active game is Snake, use floating D-pad Virtual Joystick HUD
      if (activeGame === "snake") {
        const innerRadius = Math.min(canvas.width, canvas.height) * 0.07; // Dead zone radius
        let detectedDir: Direction | null = null;
        
        if (distance > innerRadius) {
          const angle = Math.atan2(dy, dx); // range -PI to PI
          
          if (angle >= -Math.PI / 4 && angle <= Math.PI / 4) {
            detectedDir = "RIGHT";
          } else if (angle > Math.PI / 4 && angle < 3 * Math.PI / 4) {
            detectedDir = "DOWN";
          } else if (angle >= -3 * Math.PI / 4 && angle < -Math.PI / 4) {
            detectedDir = "UP";
          } else {
            detectedDir = "LEFT";
          }
        }

        setActiveGestureDirection(detectedDir);

        if (detectedDir && gameStatus === "PLAYING") {
          // Prevent standard 180-degree self-collisions in Snake
          const currentDir = snakeRef.current.dir;
          if (
            (detectedDir === "UP" && currentDir !== "DOWN") ||
            (detectedDir === "DOWN" && currentDir !== "UP") ||
            (detectedDir === "LEFT" && currentDir !== "RIGHT") ||
            (detectedDir === "RIGHT" && currentDir !== "LEFT")
          ) {
            snakeRef.current.nextDir = detectedDir;
          }
        }
      }
    } else {
      setHandActive(false);
      setTrackedCoords(null);
      setActiveGestureDirection(null);
      anchorRef.current = null; // Reset anchor so it re-centers next time the hand appears
      if (activeGame === "bubble") {
        bubbleRef.current.pointer = null;
      }
    }

    // Draw the Joystick D-Pad HUD overlays for Snake Game
    if (activeGame === "snake" && anchorRef.current) {
      const ax = anchorRef.current.x;
      const ay = anchorRef.current.y;
      const innerRadius = Math.min(canvas.width, canvas.height) * 0.07;
      const outerRadius = Math.min(canvas.width, canvas.height) * 0.22;

      ctx.save();
      
      // Draw tether line from anchor to palm
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const w = results.multiHandLandmarks[0][0];
        const iKnuckle = results.multiHandLandmarks[0][5];
        const pKnuckle = results.multiHandLandmarks[0][17];
        const px = ((1 - w.x) + (1 - iKnuckle.x) + (1 - pKnuckle.x)) / 3 * canvas.width;
        const py = (w.y + iKnuckle.y + pKnuckle.y) / 3 * canvas.height;

        ctx.strokeStyle = "rgba(0, 243, 255, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw small glowing dot on palm center
        ctx.fillStyle = "#ff007f";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#ff007f";
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Draw Neutral Zone
      ctx.strokeStyle = "rgba(0, 243, 255, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ax, ay, innerRadius, 0, 2 * Math.PI);
      ctx.stroke();

      // Outer boundary
      ctx.strokeStyle = "rgba(0, 243, 255, 0.05)";
      ctx.beginPath();
      ctx.arc(ax, ay, outerRadius, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw active quadrant highlight
      const drawArrow = (angle: number, label: string, active: boolean) => {
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(angle);

        // Arrow quadrant fill
        ctx.strokeStyle = active ? "#00f3ff" : "rgba(255, 255, 255, 0.12)";
        ctx.fillStyle = active ? "rgba(0, 243, 255, 0.2)" : "rgba(255, 255, 255, 0.01)";
        ctx.lineWidth = active ? 2.5 : 1;
        if (active) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#00f3ff";
        }

        ctx.beginPath();
        ctx.arc(0, 0, outerRadius, -Math.PI / 4, Math.PI / 4);
        ctx.lineTo(innerRadius * Math.cos(Math.PI / 4), innerRadius * Math.sin(Math.PI / 4));
        ctx.arc(0, 0, innerRadius, Math.PI / 4, -Math.PI / 4, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Icon text/arrow character
        ctx.fillStyle = active ? "#00f3ff" : "rgba(255, 255, 255, 0.25)";
        ctx.font = "bold 8px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, (innerRadius + outerRadius) / 2, 3);

        ctx.restore();
      };

      const act = activeGestureDirection;
      drawArrow(0, "▶ R", act === "RIGHT");
      drawArrow(Math.PI / 2, "▼ D", act === "DOWN");
      drawArrow(Math.PI, "◀ L", act === "LEFT");
      drawArrow(-Math.PI / 2, "▲ U", act === "UP");
      ctx.restore();
    }
  };

  // 5. Monitor Keyboard Controls (Fallback)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== "PLAYING") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          startGame();
        }
        return;
      }

      if (activeGame === "snake") {
        const currentDir = snakeRef.current.dir;
        let newDir: Direction | null = null;

        if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
          if (currentDir !== "DOWN") newDir = "UP";
        } else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
          if (currentDir !== "UP") newDir = "DOWN";
        } else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
          if (currentDir !== "RIGHT") newDir = "LEFT";
        } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
          if (currentDir !== "LEFT") newDir = "RIGHT";
        }

        if (newDir) {
          e.preventDefault();
          snakeRef.current.nextDir = newDir;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameStatus, activeGame]);

  // 6. Handle Mouse pointer controls (fallback for Bubble Pop)
  const handleGameCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!useWebcam && activeGame === "bubble" && gameStatus === "PLAYING") {
      const canvas = gameCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // Mouse X/Y relative to canvas bounds
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);
      // Store in normalized format
      bubbleRef.current.pointer = {
        x: 1 - (mx / canvas.width),
        y: my / canvas.height
      };
    }
  };

  const handleGameCanvasMouseLeave = () => {
    if (!useWebcam && activeGame === "bubble") {
      bubbleRef.current.pointer = null;
    }
  };

  // 7. Save high scores
  const saveHighScore = (finalScore: number) => {
    if (finalScore <= 0) return;
    
    const newEntry: HighScore = {
      name: username.substring(0, 15) || "Player",
      score: finalScore,
      date: new Date().toISOString().split("T")[0]
    };

    setHighScores(prev => {
      const currentList = [...prev[activeGame]];
      currentList.push(newEntry);
      // Sort descending, keep top 5
      currentList.sort((a, b) => b.score - a.score);
      const updated = {
        ...prev,
        [activeGame]: currentList.slice(0, 5)
      };
      
      try {
        localStorage.setItem("davyportfolio_cv_scores", JSON.stringify(updated));
      } catch (err) {
        console.warn("Failed to write scoreboard to localStorage:", err);
      }
      return updated;
    });
  };

  const getSpeedMs = () => {
    return gameSpeed === "slow" ? 220 : gameSpeed === "normal" ? 150 : 95;
  };

  // 7b. Adjust speed dynamically mid-game
  useEffect(() => {
    if (activeGame === "snake" && gameStatus === "PLAYING") {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = setInterval(snakeGameTick, getSpeedMs());
    }
  }, [gameSpeed]);

  // 8. Start Game Controller
  const startGame = () => {
    // Resume Audio Context on interaction
    getAudioContext();

    setGameStatus("PLAYING");
    setScore(0);
    playSynthSound("start", isMuted);
    
    // Reset explosion particles
    particlesRef.current = [];

    if (activeGame === "snake") {
      // Reset Snake
      const gridCount = 20;
      snakeRef.current = {
        snake: [
          { x: 10, y: 10 },
          { x: 10, y: 11 },
          { x: 10, y: 12 },
        ],
        dir: "UP",
        nextDir: "UP",
        food: generateSnakeFood(20, [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]),
        gridSize: gridCount,
        score: 0,
      };

      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = setInterval(snakeGameTick, getSpeedMs());
    } else {
      // Reset Bubble Game
      bubbleRef.current = {
        bubbles: [],
        pointer: null,
        lastSpawn: Date.now(),
        bubbleId: 0,
        score: 0,
      };

      if (bubbleRequestRef.current) cancelAnimationFrame(bubbleRequestRef.current);
      bubbleRequestRef.current = requestAnimationFrame(bubbleGameTick);
    }
  };

  // 9. Pause Game
  const pauseGame = () => {
    if (gameStatus === "PLAYING") {
      setGameStatus("PAUSED");
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      if (bubbleRequestRef.current) cancelAnimationFrame(bubbleRequestRef.current);
    } else if (gameStatus === "PAUSED") {
      setGameStatus("PLAYING");
      if (activeGame === "snake") {
        gameIntervalRef.current = setInterval(snakeGameTick, getSpeedMs());
      } else {
        bubbleRef.current.lastSpawn = Date.now(); // reset timer
        bubbleRequestRef.current = requestAnimationFrame(bubbleGameTick);
      }
    }
  };

  // 10. End Game
  const endGame = (finalScore: number) => {
    setGameStatus("GAME_OVER");
    playSynthSound("crash", isMuted);
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (bubbleRequestRef.current) cancelAnimationFrame(bubbleRequestRef.current);
    saveHighScore(finalScore);
  };

  // 11. Snake Game Logic Loop
  const snakeGameTick = () => {
    const sState = snakeRef.current;
    sState.dir = sState.nextDir;
    const head = { ...sState.snake[0] };

    switch (sState.dir) {
      case "UP": head.y -= 1; break;
      case "DOWN": head.y += 1; break;
      case "LEFT": head.x -= 1; break;
      case "RIGHT": head.x += 1; break;
    }

    // Bounding check (Game Over)
    if (head.x < 0 || head.x >= sState.gridSize || head.y < 0 || head.y >= sState.gridSize) {
      endGame(sState.score);
      return;
    }

    // Self-collision check
    for (let segment of sState.snake) {
      if (segment.x === head.x && segment.y === head.y) {
        endGame(sState.score);
        return;
      }
    }

    // Insert new head
    sState.snake.unshift(head);

    // Food collision check
    if (head.x === sState.food.x && head.y === sState.food.y) {
      sState.score += 10;
      setScore(sState.score);
      playSynthSound("eat", isMuted);

      // Create particle burst at eat position
      const pX = head.x * 25 + 12.5;
      const pY = head.y * 25 + 12.5;
      createExplosion(pX, pY, "#ff007f");

      sState.food = generateSnakeFood(sState.gridSize, sState.snake);
    } else {
      // Remove tail
      sState.snake.pop();
    }

    drawSnakeGame();
  };

  const generateSnakeFood = (gridSize: number, snake: SnakeSegment[]): SnakeSegment => {
    let food: SnakeSegment;
    let attempts = 0;
    do {
      food = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
      };
      attempts++;
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y) && attempts < 100);

    return food;
  };

  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color,
        alpha: 1.0,
      });
    }
  };

  const drawSnakeGame = () => {
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cellSize = canvas.width / snakeRef.current.gridSize; // 25px
    const sState = snakeRef.current;

    // Draw grid mesh
    ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvas.width; i += cellSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw food (pulsing glowing circle)
    const foodPulse = 1 + Math.sin(Date.now() / 120) * 0.12;
    const fx = sState.food.x * cellSize + cellSize / 2;
    const fy = sState.food.y * cellSize + cellSize / 2;
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff007f";
    ctx.fillStyle = "#ff007f";
    ctx.beginPath();
    ctx.arc(fx, fy, (cellSize / 2 - 3) * foodPulse, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Draw snake body
    sState.snake.forEach((seg, idx) => {
      const sx = seg.x * cellSize;
      const sy = seg.y * cellSize;

      ctx.save();
      if (idx === 0) {
        // Head (neon green/cyan with eyes)
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00f3ff";
        ctx.fillStyle = "#00f3ff";
        ctx.beginPath();
        ctx.roundRect(sx + 1, sy + 1, cellSize - 2, cellSize - 2, 6);
        ctx.fill();

        // Draw eyes
        ctx.fillStyle = "#fff";
        const eyeOffset = 6;
        const eyeRad = 2.5;
        let e1 = { x: 0, y: 0 };
        let e2 = { x: 0, y: 0 };

        if (sState.dir === "UP") {
          e1 = { x: sx + eyeOffset, y: sy + eyeOffset };
          e2 = { x: sx + cellSize - eyeOffset, y: sy + eyeOffset };
        } else if (sState.dir === "DOWN") {
          e1 = { x: sx + eyeOffset, y: sy + cellSize - eyeOffset };
          e2 = { x: sx + cellSize - eyeOffset, y: sy + cellSize - eyeOffset };
        } else if (sState.dir === "LEFT") {
          e1 = { x: sx + eyeOffset, y: sy + eyeOffset };
          e2 = { x: sx + eyeOffset, y: sy + cellSize - eyeOffset };
        } else {
          e1 = { x: sx + cellSize - eyeOffset, y: sy + eyeOffset };
          e2 = { x: sx + cellSize - eyeOffset, y: sy + cellSize - eyeOffset };
        }
        ctx.beginPath();
        ctx.arc(e1.x, e1.y, eyeRad, 0, 2 * Math.PI);
        ctx.arc(e2.x, e2.y, eyeRad, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        // Tail Gradient (neon blue to violet)
        const ratio = idx / sState.snake.length;
        const color = `hsl(${180 + ratio * 90}, 100%, 50%)`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = color;
        ctx.fillStyle = color;

        // Shrink segment size near tail
        const scale = Math.max(0.6, 1 - ratio * 0.45);
        const sSize = cellSize * scale;
        const offset = (cellSize - sSize) / 2;

        ctx.beginPath();
        ctx.roundRect(sx + offset, sy + offset, sSize, sSize, 4);
        ctx.fill();
      }
      ctx.restore();
    });

    // Update & draw food particles
    drawParticles(ctx);
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    const parts = particlesRef.current;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03;
      p.radius *= 0.96;

      if (p.alpha <= 0 || p.radius <= 0.5) {
        parts.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
  };

  // 12. Bubble Pop CV Game Logic Loop
  const bubbleGameTick = () => {
    const bState = bubbleRef.current;
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid details
    ctx.strokeStyle = "rgba(255, 255, 255, 0.01)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }

    // Spawn bubbles (every 800ms)
    const now = Date.now();
    if (now - bState.lastSpawn > 850) {
      const radius = 20 + Math.random() * 20;
      bState.bubbles.push({
        id: bState.bubbleId++,
        x: radius + Math.random() * (canvas.width - radius * 2),
        y: canvas.height + radius,
        radius,
        speedY: 1.2 + Math.random() * 2.2,
        color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
        popped: false,
      });
      bState.lastSpawn = now;
    }

    // Get pointer coords scaled to game canvas (500x500)
    let px: number | null = null;
    let py: number | null = null;
    if (bState.pointer) {
      px = (1 - bState.pointer.x) * canvas.width;
      py = bState.pointer.y * canvas.height;
    }

    // Update bubbles
    for (let i = bState.bubbles.length - 1; i >= 0; i--) {
      const b = bState.bubbles[i];
      b.y -= b.speedY;

      // Bounding check (reached top -> cost score penalty or game over)
      // For a fun arcade, let's deduct 5 points. If score goes below -30, Game Over!
      if (b.y < -b.radius) {
        bState.bubbles.splice(i, 1);
        bState.score = Math.max(0, bState.score - 5);
        setScore(bState.score);
        continue;
      }

      // Check hit intersection with pointer
      if (px !== null && py !== null) {
        const dx = b.x - px;
        const dy = b.y - py;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < b.radius + 8) { // Added padding for friendly collision tolerance
          b.popped = true;
          bState.score += 10;
          setScore(bState.score);
          playSynthSound("pop", isMuted);
          createExplosion(b.x, b.y, b.color);
          bState.bubbles.splice(i, 1);
          continue;
        }
      }

      // Draw beautiful bubble
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = b.color;
      
      // Radial glass gradient
      const grad = ctx.createRadialGradient(
        b.x - b.radius * 0.25,
        b.y - b.radius * 0.25,
        b.radius * 0.05,
        b.x,
        b.y,
        b.radius
      );
      const rgb = hexToRgb(b.color);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
      grad.addColorStop(0.3, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`);
      grad.addColorStop(0.8, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
      grad.addColorStop(1, b.color);
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, 2 * Math.PI);
      ctx.fill();

      // High light crescent reflect
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.beginPath();
      ctx.arc(b.x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.22, 0, 2 * Math.PI);
      ctx.fill();

      ctx.restore();
    }

    // Draw particle explosions
    drawParticles(ctx);

    // Draw pointer tracking circle in canvas
    if (px !== null && py !== null) {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00f3ff";
      ctx.strokeStyle = "#00f3ff";
      ctx.lineWidth = 2.5;

      // Outer targeting spinning ring
      ctx.beginPath();
      ctx.arc(px, py, 18, Date.now() / 150, Date.now() / 150 + Math.PI * 1.6);
      ctx.stroke();

      // Inner dot
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    if (gameStatus === "PLAYING") {
      bubbleRequestRef.current = requestAnimationFrame(bubbleGameTick);
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 243, b: 255 };
  };

  // Helper cleanups on change games
  const selectGame = (game: "snake" | "bubble") => {
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (bubbleRequestRef.current) cancelAnimationFrame(bubbleRequestRef.current);
    setActiveGame(game);
    setGameStatus("IDLE");
    setScore(0);
    
    // Immediate canvas clear
    const canvas = gameCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      if (bubbleRequestRef.current) cancelAnimationFrame(bubbleRequestRef.current);
    };
  }, []);

  return (
    <div className={styles.exploreContainer}>
      <div className={styles.titleArea}>
        <h1>Explore CV Playground</h1>
        <p>Experiment with real-time browser-based computer vision gaming powered by your hand gestures.</p>
      </div>

      <div className={styles.arcadeGrid}>
        
        {/* Left Side: Camera Console & Controller settings */}
        <div className={styles.consoleCard}>
          <div className={styles.cardHeader}>
            <h2>
              <PiCameraDuotone />
              <span>Gesture Engine</span>
            </h2>
            <div className={`${styles.statusIndicator} ${useWebcam ? (handActive ? styles.detecting : styles.ready) : styles.off}`}>
              {useWebcam ? (handActive ? "Detecting Hand" : "Camera Live") : "Camera Off"}
            </div>
          </div>

          {/* Video Stream & Overlay Canvas */}
          <div className={styles.webcamWrapper}>
            {useWebcam && <div className={styles.scanningEffect} />}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ display: useWebcam ? "block" : "none" }}
            />
            <canvas
              ref={cameraCanvasRef}
              width={320}
              height={240}
              style={{ display: useWebcam ? "block" : "none" }}
            />

            {!useWebcam && (
              <div className={styles.cameraFallback}>
                <PiCameraSlashDuotone />
                <p>Webcam feedback is disabled or unavailable. Using Keyboard/Mouse controls fallback.</p>
                <button
                  className={`${styles.btn} ${styles.primary}`}
                  onClick={() => setUseWebcam(true)}
                  disabled={!scriptsLoaded}
                >
                  Activate Cam
                </button>
              </div>
            )}
            
            {useWebcam && cameraError && (
              <div className={styles.cameraFallback}>
                <p style={{ color: "#ef4444" }}>{cameraError}</p>
              </div>
            )}
          </div>

          {/* Coordinates Debug HUD */}
          {useWebcam && handActive && trackedCoords && (
            <div className={styles.debugCoordinates}>
              <span>X: {trackedCoords.x}px</span>
              <span>Y: {trackedCoords.y}px</span>
              {activeGame === "snake" && activeGestureDirection && (
                <span style={{ fontWeight: 700 }}>DIR: {activeGestureDirection}</span>
              )}
            </div>
          )}

          {/* Controller Info and Switches */}
          <div className={styles.controlGroup}>
            <div className={styles.controlRow}>
              <label>Input Control Mode</label>
              <button
                className={styles.btn}
                onClick={() => setUseWebcam(!useWebcam)}
              >
                {useWebcam ? "Switch to Manual" : "Switch to Webcam"}
              </button>
            </div>
          </div>

          {/* Game Speed Settings */}
          <div className={styles.controlGroup}>
            <div className={styles.controlRow}>
              <label>Simulation Speed</label>
              <div style={{ display: "flex", gap: "4px" }}>
                {(["slow", "normal", "fast"] as const).map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setGameSpeed(speed)}
                    className={`${styles.btn} ${gameSpeed === speed ? styles.primary : ""}`}
                    style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                  >
                    {speed}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Line background="neutral-alpha-weak" />

          {/* Instructions Panel */}
          <div className={styles.controlGroup}>
            <label>Controls & calibration</label>
            <ul className={styles.instructionList}>
              {activeGame === "snake" ? (
                <>
                  <li><strong>Gesture Mode</strong>: Hold your hand up in front of the lens. Move your index finger up, down, left, or right relative to the center ring. The active HUD direction lights up to guide the snake.</li>
                  <li><strong>Manual Mode</strong>: Disable webcam, then use <strong>Arrow Keys</strong> or <strong>W, A, S, D</strong> keys to navigate.</li>
                </>
              ) : (
                <>
                  <li><strong>Gesture Mode</strong>: Wave your hand in front of the lens. Guide the blue targeting crosshair with your index finger to pop the bubbles!</li>
                  <li><strong>Manual Mode</strong>: Disable webcam, then steer your cursor over the game screen to pop bubbles with your mouse.</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Right Side: Arcade Screen and Dashboard */}
        <div className={styles.arcadeConsole}>
          
          {/* Game Selection Tabs */}
          <div className={styles.gameSelectionArea}>
            <button
              onClick={() => selectGame("snake")}
              className={`${styles.gameCard} ${activeGame === "snake" ? styles.active : ""}`}
            >
              <h3>Snake CV</h3>
              <p>Steer the snake via index finger tilt joystick. Avoid walls and self-collision.</p>
            </button>
            
            <button
              onClick={() => selectGame("bubble")}
              className={`${styles.gameCard} ${activeGame === "bubble" ? styles.active : ""}`}
            >
              <h3>Bubble Pop CV</h3>
              <p>Pop floating bubbles using your index finger as a laser cursor. Fast reactive fun.</p>
            </button>
          </div>

          {/* Retro Arcade CRT Monitor Screen */}
          <div className={`${styles.screenOuter} ${gameStatus === "PLAYING" ? styles.activePlay : ""}`}>
            
            {/* Game Canvas Top HUD bar */}
            <div className={styles.hudBar}>
              <span>
                GAME: <strong>{activeGame === "snake" ? "SNAKE CV" : "BUBBLE POP CV"}</strong>
              </span>
              <span>
                SCORE: <strong>{score}</strong>
              </span>
            </div>

            {/* Screen Container and Canvas */}
            <div className={styles.gameScreenWrapper}>
              <canvas
                ref={gameCanvasRef}
                width={500}
                height={500}
                onMouseMove={handleGameCanvasMouseMove}
                onMouseLeave={handleGameCanvasMouseLeave}
              />

              {/* Game Over / Idle State Screens */}
              {gameStatus === "IDLE" && (
                <div className={styles.screenOverlay}>
                  <PiGameControllerDuotone style={{ fontSize: "3rem", color: "#00f3ff" }} />
                  <div>
                    <h3>Ready to Play?</h3>
                    <p style={{ marginTop: "0.5rem" }}>
                      {activeGame === "snake"
                        ? "Steer the snake and eat glowing snacks. Control via gestures or arrow keys."
                        : "Hover your hand or mouse to pop glowing bubbles before they drift off screen."}
                    </p>
                  </div>
                  <button className={`${styles.btn} ${styles.primary}`} onClick={startGame}>
                    Insert Coin & Start
                  </button>
                </div>
              )}

              {gameStatus === "PAUSED" && (
                <div className={styles.screenOverlay}>
                  <h3>Game Paused</h3>
                  <p>Hold tight! Press resume to return to the simulation.</p>
                  <button className={`${styles.btn} ${styles.primary}`} onClick={pauseGame}>
                    Resume Simulation
                  </button>
                </div>
              )}

              {gameStatus === "GAME_OVER" && (
                <div className={styles.screenOverlay}>
                  <h3 style={{ color: "#ef4444" }}>Simulation Over</h3>
                  <div className={styles.overlayStats}>
                    <div className={styles.statItem}>
                      <span className={styles.val}>{score}</span>
                      <span className={styles.lbl}>Final Score</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", width: "100%", justifyContent: "center" }}>
                    <input
                      type="text"
                      placeholder="Enter name"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      maxLength={15}
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: "#fff",
                        padding: "0.5rem",
                        borderRadius: "var(--radius-s)",
                        textAlign: "center",
                        width: "120px"
                      }}
                    />
                    <button className={`${styles.btn} ${styles.primary}`} onClick={startGame}>
                      Replay
                    </button>
                  </div>
                </div>
              )}

              {/* Scripts loading overlay */}
              {!scriptsLoaded && (
                <div className={styles.screenOverlay}>
                  <div className={styles.loaderOverlay}>
                    <div className={styles.spinner} />
                    <p>Initializing CV Models via CDN...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Screen Controls Toolbar */}
            <div className={styles.arcadeControlsRow}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className={`${styles.btn} ${gameStatus === "PLAYING" ? "" : styles.primary}`}
                  onClick={startGame}
                  disabled={!scriptsLoaded}
                >
                  {gameStatus === "GAME_OVER" ? "Restart" : gameStatus === "PLAYING" ? "Reset" : "Play"}
                </button>
                {gameStatus === "PLAYING" && (
                  <button className={styles.btn} onClick={pauseGame}>
                    Pause
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className={`${styles.btn} ${styles.iconOnly}`}
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? "Unmute sound" : "Mute sound"}
                >
                  {isMuted ? <PiSpeakerSimpleSlashDuotone /> : <PiSpeakerSimpleHighDuotone />}
                </button>
              </div>
            </div>
          </div>

          {/* High Scores Leaderboard */}
          <div className={styles.consoleCard} style={{ flex: 1, marginTop: "0.5rem" }}>
            <div className={styles.cardHeader}>
              <h2>🏆 High Scores</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {highScores[activeGame]?.map((entry, index) => (
                <div key={index} className={styles.scoreRow}>
                  <span className={styles.rank}>#{index + 1}</span>
                  <span className={styles.name}>{entry.name}</span>
                  <span className={styles.val}>{entry.score} pts</span>
                </div>
              ))}
              {(!highScores[activeGame] || highScores[activeGame].length === 0) && (
                <div style={{ textAlign: "center", color: "var(--neutral-on-background-weak)", fontSize: "0.85rem", padding: "1rem" }}>
                  No scores recorded yet. Be the first!
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
