"use client";

import { useEffect, useRef, useState } from "react";
import { Flex, Row, Line } from "@once-ui-system/core";
import { PiCompassDuotone, PiGameControllerDuotone, PiCameraDuotone, PiCameraSlashDuotone, PiSpeakerSimpleHighDuotone, PiSpeakerSimpleSlashDuotone } from "react-icons/pi";
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

// Scoreboard types represent active session scores
interface ScoreBoard {
  snake: number[];
  bubble: number[];
  patches: number[];
}

// Patches Game Interfaces
interface PatchesClue {
  col: number;
  row: number;
  size: number;
  type: "square" | "wide" | "tall" | "any";
}

interface PatchesLevel {
  gridSize: number;
  clues: PatchesClue[];
  tray: Array<{ id: number; width: number; height: number; color: string }>;
}

const PATCHES_LEVELS: Record<number, PatchesLevel> = {
  1: {
    gridSize: 4,
    clues: [
      { col: 0, row: 0, size: 4, type: "square" }, // Needs 2x2
      { col: 2, row: 0, size: 2, type: "tall" },   // Needs 1x2
      { col: 3, row: 0, size: 2, type: "tall" },   // Needs 1x2
      { col: 0, row: 2, size: 2, type: "wide" },   // Needs 2x1
      { col: 0, row: 3, size: 2, type: "wide" },   // Needs 2x1
      { col: 2, row: 2, size: 4, type: "square" }, // Needs 2x2
    ],
    tray: [
      { id: 1, width: 2, height: 2, color: "#00f3ff" }, // Cyan 2x2
      { id: 2, width: 1, height: 2, color: "#9d00ff" }, // Purple 1x2
      { id: 3, width: 1, height: 2, color: "#9d00ff" }, // Purple 1x2
      { id: 4, width: 2, height: 1, color: "#00ff66" }, // Green 2x1
      { id: 5, width: 2, height: 1, color: "#00ff66" }, // Green 2x1
      { id: 6, width: 2, height: 2, color: "#ff007f" }, // Pink 2x2
    ]
  },
  2: {
    gridSize: 5,
    clues: [
      { col: 0, row: 0, size: 6, type: "wide" },   // Needs 3x2
      { col: 3, row: 0, size: 6, type: "tall" },   // Needs 2x3
      { col: 0, row: 2, size: 4, type: "square" }, // Needs 2x2
      { col: 2, row: 2, size: 3, type: "tall" },   // Needs 1x3
      { col: 3, row: 3, size: 2, type: "wide" },   // Needs 2x1
      { col: 0, row: 4, size: 2, type: "wide" },   // Needs 2x1
      { col: 3, row: 4, size: 2, type: "wide" },   // Needs 2x1
    ],
    tray: [
      { id: 1, width: 3, height: 2, color: "#00f3ff" }, // Cyan 3x2
      { id: 2, width: 2, height: 3, color: "#9d00ff" }, // Purple 2x3
      { id: 3, width: 2, height: 2, color: "#ff007f" }, // Pink 2x2
      { id: 4, width: 1, height: 3, color: "#ffb700" }, // Yellow 1x3
      { id: 5, width: 2, height: 1, color: "#00ff66" }, // Green 2x1
      { id: 6, width: 2, height: 1, color: "#00ff66" }, // Green 2x1
      { id: 7, width: 2, height: 1, color: "#00f3ff" }, // Cyan 2x1
    ]
  },
  3: {
    gridSize: 6,
    clues: [
      { col: 0, row: 0, size: 9, type: "square" }, // Needs 3x3
      { col: 3, row: 0, size: 6, type: "wide" },   // Needs 3x2
      { col: 5, row: 2, size: 4, type: "tall" },   // Needs 1x4
      { col: 3, row: 2, size: 4, type: "square" }, // Needs 2x2
      { col: 0, row: 3, size: 3, type: "wide" },   // Needs 3x1
      { col: 0, row: 4, size: 4, type: "square" }, // Needs 2x2
      { col: 2, row: 4, size: 2, type: "tall" },   // Needs 1x2
      { col: 3, row: 4, size: 4, type: "square" }, // Needs 2x2
    ],
    tray: [
      { id: 1, width: 3, height: 3, color: "#00f3ff" }, // Cyan 3x3
      { id: 2, width: 3, height: 2, color: "#9d00ff" }, // Purple 3x2
      { id: 3, width: 1, height: 4, color: "#ffb700" }, // Yellow 1x4
      { id: 4, width: 2, height: 2, color: "#ff007f" }, // Pink 2x2
      { id: 5, width: 3, height: 1, color: "#00ff66" }, // Green 3x1
      { id: 6, width: 2, height: 2, color: "#ff007f" }, // Pink 2x2
      { id: 7, width: 1, height: 2, color: "#9d00ff" }, // Purple 1x2
      { id: 8, width: 2, height: 2, color: "#00f3ff" }, // Cyan 2x2
    ]
  }
};

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

// Session scores are calculated in real time dynamically

const BUBBLE_COLORS = ["#00f3ff", "#ff007f", "#9d00ff", "#00ff66", "#ffb700"];

export default function ExploreView() {
  const [activeGame, setActiveGame] = useState<"snake" | "bubble" | "patches">("snake");
  const [gameStatus, setGameStatus] = useState<"IDLE" | "PLAYING" | "PAUSED" | "GAME_OVER">("IDLE");
  const [score, setScore] = useState(0);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const [useWebcam, setUseWebcam] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [handActive, setHandActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [patchesLevel, setPatchesLevel] = useState<number>(1);

  // Debug position state
  const [trackedCoords, setTrackedCoords] = useState<{ x: number; y: number } | null>(null);
  const [activeGestureDirection, setActiveGestureDirection] = useState<Direction | null>(null);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const anchorRef = useRef<{ x: number; y: number } | null>(null);
  const smoothedPointerRef = useRef<{ x: number; y: number } | null>(null);

  // Refs for tracking React state inside external MediaPipe callbacks
  const activeGameRef = useRef(activeGame);
  const gameStatusRef = useRef(gameStatus);

  useEffect(() => {
    activeGameRef.current = activeGame;
  }, [activeGame]);

  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);

  // Game engine refs
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

  // Patches State
  const patchesRef = useRef<{
    level: number;
    placedPatches: Array<{
      id: number;
      col: number;
      row: number;
      width: number;
      height: number;
      color: string;
    }>;
    trayPatches: Array<{
      id: number;
      width: number;
      height: number;
      color: string;
      placed: boolean;
    }>;
    selectedPatch: {
      id: number;
      width: number;
      height: number;
      color: string;
      isFromGrid: boolean;
      col?: number;
      row?: number;
    } | null;
    pointer: { x: number; y: number } | null;
    hoverStart: number;
    hoverTarget: {
      type: "tray" | "grid";
      id?: number;
      col?: number;
      row?: number;
    } | null;
    solved: boolean;
  }>({
    level: 1,
    placedPatches: [],
    trayPatches: [],
    selectedPatch: null,
    pointer: null,
    hoverStart: 0,
    hoverTarget: null,
    solved: false,
  });

  // LocalStorage score sync is removed to rely on live session calculations

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
      if (activeGameRef.current === "bubble") {
        bubbleRef.current.pointer = { x: indexTip.x, y: indexTip.y };
      }

      // If active game is Patches, send pointer position directly (normalized)
      if (activeGameRef.current === "patches") {
        patchesRef.current.pointer = { x: indexTip.x, y: indexTip.y };
      }

      // If active game is Snake, use floating D-pad Virtual Joystick HUD
      if (activeGameRef.current === "snake") {
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

        if (detectedDir && gameStatusRef.current === "PLAYING") {
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
      if (activeGameRef.current === "bubble") {
        bubbleRef.current.pointer = null;
      }
      if (activeGameRef.current === "patches") {
        patchesRef.current.pointer = null;
      }
    }

    // Draw the Joystick D-Pad HUD overlays for Snake Game
    if (activeGameRef.current === "snake" && anchorRef.current) {
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

  // 6. Handle Mouse pointer controls (fallback for Bubble Pop & Patches)
  const handleGameCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = gameCanvasRef.current;
    if (!canvas || gameStatus !== "PLAYING") return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (!useWebcam) {
      if (activeGame === "bubble") {
        bubbleRef.current.pointer = {
          x: 1 - (mx / canvas.width),
          y: my / canvas.height
        };
      } else if (activeGame === "patches") {
        patchesRef.current.pointer = {
          x: 1 - (mx / canvas.width),
          y: my / canvas.height
        };
      }
    }
  };

  const handleGameCanvasMouseLeave = () => {
    if (!useWebcam) {
      if (activeGame === "bubble") {
        bubbleRef.current.pointer = null;
      } else if (activeGame === "patches") {
        patchesRef.current.pointer = null;
      }
    }
  };

  // Patches action handler (Click or Gesture triggers)
  const handlePatchesAction = (target: { type: "tray" | "grid"; id?: number; col?: number; row?: number }) => {
    const pState = patchesRef.current;

    if (target.type === "tray" && target.id) {
      // Pick up from tray
      const patch = pState.trayPatches.find(p => p.id === target.id);
      if (patch && !patch.placed) {
        pState.selectedPatch = {
          id: patch.id,
          width: patch.width,
          height: patch.height,
          color: patch.color,
          isFromGrid: false
        };
        patch.placed = true;
        playSynthSound("pop", isMuted);
      }
    } else if (target.type === "grid") {
      if (pState.selectedPatch) {
        // Try placing patch
        const col = target.col ?? 0;
        const row = target.row ?? 0;
        const levelData = PATCHES_LEVELS[pState.level];

        // Center patch relative to grid cell
        const startCol = Math.max(0, Math.min(levelData.gridSize - pState.selectedPatch.width, col - Math.floor(pState.selectedPatch.width / 2)));
        const startRow = Math.max(0, Math.min(levelData.gridSize - pState.selectedPatch.height, row - Math.floor(pState.selectedPatch.height / 2)));

        // Check if overlaps with existing placed patches
        let overlaps = false;
        for (const existing of pState.placedPatches) {
          const hOverlaps = Math.max(startCol, existing.col) < Math.min(startCol + pState.selectedPatch.width, existing.col + existing.width);
          const vOverlaps = Math.max(startRow, existing.row) < Math.min(startRow + pState.selectedPatch.height, existing.row + existing.height);
          if (hOverlaps && vOverlaps) {
            overlaps = true;
            break;
          }
        }

        if (!overlaps) {
          // Place it
          pState.placedPatches.push({
            id: pState.selectedPatch.id,
            col: startCol,
            row: startRow,
            width: pState.selectedPatch.width,
            height: pState.selectedPatch.height,
            color: pState.selectedPatch.color
          });
          pState.selectedPatch = null;
          playSynthSound("eat", isMuted);

          // Check level solved
          if (checkPatchesSolved()) {
            pState.solved = true;
            setScore(100); // 100 points for solving the puzzle!
            playSynthSound("start", isMuted);
            endGame(100);
          }
        } else {
          // Return to tray if overlaps
          const trayPatch = pState.trayPatches.find(p => p.id === pState.selectedPatch!.id);
          if (trayPatch) trayPatch.placed = false;
          pState.selectedPatch = null;
          playSynthSound("crash", isMuted);
        }
      } else if (target.id) {
        // Pick up placed patch back into selected state
        const idx = pState.placedPatches.findIndex(p => p.id === target.id);
        if (idx !== -1) {
          const placed = pState.placedPatches[idx];
          pState.selectedPatch = {
            id: placed.id,
            width: placed.width,
            height: placed.height,
            color: placed.color,
            isFromGrid: true,
            col: placed.col,
            row: placed.row
          };
          pState.placedPatches.splice(idx, 1);
          playSynthSound("pop", isMuted);
        }
      }
    }
  };

  const handleGameCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only process click fallbacks when camera is OFF (manual mode)
    if (!useWebcam && activeGame === "patches" && gameStatus === "PLAYING") {
      const canvas = gameCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);

      const pState = patchesRef.current;
      const gridStart = 50;
      const gridWidth = 400;
      const trayY = 460;
      const trayWidth = 400;
      const slotWidth = trayWidth / pState.trayPatches.length;

      // 1. Click tray
      if (my >= trayY - 30 && my <= trayY + 30 && mx >= gridStart && mx <= gridStart + trayWidth) {
        const index = Math.floor((mx - gridStart) / slotWidth);
        if (index >= 0 && index < pState.trayPatches.length) {
          handlePatchesAction({ type: "tray", id: pState.trayPatches[index].id });
        }
      }
      // 2. Click grid
      else if (mx >= gridStart && mx <= gridStart + gridWidth && my >= gridStart && my <= gridStart + gridWidth) {
        const levelData = PATCHES_LEVELS[pState.level];
        const cellSize = gridWidth / levelData.gridSize;
        const col = Math.floor((mx - gridStart) / cellSize);
        const row = Math.floor((my - gridStart) / cellSize);

        if (pState.selectedPatch) {
          handlePatchesAction({ type: "grid", col, row });
        } else {
          // Try picking up patch
          const patch = pState.placedPatches.find(p =>
            col >= p.col && col < p.col + p.width &&
            row >= p.row && row < p.row + p.height
          );
          if (patch) {
            handlePatchesAction({ type: "grid", id: patch.id });
          }
        }
      } else {
        // Clicked outside bounds: if a patch is selected, return to tray
        if (pState.selectedPatch) {
          const trayPatch = pState.trayPatches.find(p => p.id === pState.selectedPatch!.id);
          if (trayPatch) trayPatch.placed = false;
          pState.selectedPatch = null;
          playSynthSound("crash", isMuted);
        }
      }
    }
  };

  // Shikaku patches game rules validator
  const checkPatchesSolved = () => {
    const pState = patchesRef.current;
    const levelData = PATCHES_LEVELS[pState.level];
    const { gridSize, clues } = levelData;

    // 1. Create occupancy grid
    const occupied = Array(gridSize).fill(0).map(() => Array(gridSize).fill(false));

    // 2. Mark cells occupied by placed patches
    for (const patch of pState.placedPatches) {
      for (let c = 0; c < patch.width; c++) {
        for (let r = 0; r < patch.height; r++) {
          const col = patch.col + c;
          const row = patch.row + r;
          if (col < 0 || col >= gridSize || row < 0 || row >= gridSize) {
            return false; // Out of bounds patch!
          }
          if (occupied[col][row]) {
            return false; // Overlap!
          }
          occupied[col][row] = true;
        }
      }
    }

    // 3. Verify all grid cells are covered
    for (let c = 0; c < gridSize; c++) {
      for (let r = 0; r < gridSize; r++) {
        if (!occupied[c][r]) return false; // Gap found!
      }
    }

    // 4. Verify clues match placed patches
    for (const clue of clues) {
      // Find the patch covering this clue cell
      const patch = pState.placedPatches.find(p =>
        clue.col >= p.col && clue.col < p.col + p.width &&
        clue.row >= p.row && clue.row < p.row + p.height
      );

      if (!patch) return false; // Clue not covered!

      // Check size matches clue size
      if (patch.width * patch.height !== clue.size) return false;

      // Check shape type
      if (clue.type === "square" && patch.width !== patch.height) return false;
      if (clue.type === "wide" && patch.width <= patch.height) return false;
      if (clue.type === "tall" && patch.height <= patch.width) return false;

      // Check that this patch covers EXACTLY one clue
      const cluesCovered = clues.filter(c =>
        c.col >= patch.col && c.col < patch.col + patch.width &&
        c.row >= patch.row && c.row < patch.row + patch.height
      );
      if (cluesCovered.length !== 1) return false; // Must contain exactly one clue
    }

    return true; // Solved!
  };

  // 7. Save session scores
  const saveHighScore = (finalScore: number) => {
    if (finalScore <= 0) return;
    setSessionScores(prev => [finalScore, ...prev]);
  };

  // Snake game runs exclusively at a smooth, slow tick rate of 220ms for optimal accessibility

  // Patches Level Initializer
  const initPatchesLevel = (levelNum: number) => {
    const levelData = PATCHES_LEVELS[levelNum] || PATCHES_LEVELS[1];

    const tray = levelData.tray.map(p => ({
      ...p,
      placed: false
    }));

    patchesRef.current = {
      level: levelNum,
      placedPatches: [],
      trayPatches: tray,
      selectedPatch: null,
      pointer: null,
      hoverStart: 0,
      hoverTarget: null,
      solved: false,
    };

    setScore(0);
    setPatchesLevel(levelNum);
  };

  // 8. Start Game Controller
  const startGame = () => {
    getAudioContext();

    setGameStatus("PLAYING");
    setScore(0);
    playSynthSound("start", isMuted);

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
      gameIntervalRef.current = setInterval(snakeGameTick, 220);
    } else if (activeGame === "bubble") {
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
    } else if (activeGame === "patches") {
      // Reset Patches Game
      initPatchesLevel(patchesLevel);
      if (bubbleRequestRef.current) cancelAnimationFrame(bubbleRequestRef.current);
      bubbleRequestRef.current = requestAnimationFrame(patchesGameTick);
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
        gameIntervalRef.current = setInterval(snakeGameTick, 220);
      } else if (activeGame === "bubble") {
        bubbleRef.current.lastSpawn = Date.now();
        bubbleRequestRef.current = requestAnimationFrame(bubbleGameTick);
      } else if (activeGame === "patches") {
        bubbleRequestRef.current = requestAnimationFrame(patchesGameTick);
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

    if (head.x < 0 || head.x >= sState.gridSize || head.y < 0 || head.y >= sState.gridSize) {
      endGame(sState.score);
      return;
    }

    for (let segment of sState.snake) {
      if (segment.x === head.x && segment.y === head.y) {
        endGame(sState.score);
        return;
      }
    }

    sState.snake.unshift(head);

    if (head.x === sState.food.x && head.y === sState.food.y) {
      sState.score += 10;
      setScore(sState.score);
      playSynthSound("eat", isMuted);

      const pX = head.x * 25 + 12.5;
      const pY = head.y * 25 + 12.5;
      createExplosion(pX, pY, "#ff007f");

      sState.food = generateSnakeFood(sState.gridSize, sState.snake);
    } else {
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

    sState.snake.forEach((seg, idx) => {
      const sx = seg.x * cellSize;
      const sy = seg.y * cellSize;

      ctx.save();
      if (idx === 0) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00f3ff";
        ctx.fillStyle = "#00f3ff";
        ctx.beginPath();
        ctx.roundRect(sx + 1, sy + 1, cellSize - 2, cellSize - 2, 6);
        ctx.fill();

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
        const ratio = idx / sState.snake.length;
        const color = `hsl(${180 + ratio * 90}, 100%, 50%)`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = color;
        ctx.fillStyle = color;

        const scale = Math.max(0.6, 1 - ratio * 0.45);
        const sSize = cellSize * scale;
        const offset = (cellSize - sSize) / 2;

        ctx.beginPath();
        ctx.roundRect(sx + offset, sy + offset, sSize, sSize, 4);
        ctx.fill();
      }
      ctx.restore();
    });

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
    if (activeGameRef.current !== "bubble") return;

    const bState = bubbleRef.current;
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.01)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }

    const now = Date.now();
    if (now - bState.lastSpawn > 850) {
      const radius = 20 + Math.random() * 20;
      bState.bubbles.push({
        id: bState.bubbleId++,
        x: radius + Math.random() * (canvas.width - radius * 2),
        y: canvas.height + radius,
        radius,
        speedY: 0.8 + Math.random() * 1.0, // Slow, elegant drift
        color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
        popped: false,
      });
      bState.lastSpawn = now;
    }

    let px: number | null = null;
    let py: number | null = null;
    if (bState.pointer) {
      const targetX = (1 - bState.pointer.x) * canvas.width;
      const targetY = bState.pointer.y * canvas.height;
      if (!useWebcam) {
        px = targetX;
        py = targetY;
      } else {
        if (!smoothedPointerRef.current) {
          smoothedPointerRef.current = { x: targetX, y: targetY };
        } else {
          smoothedPointerRef.current.x += 0.22 * (targetX - smoothedPointerRef.current.x);
          smoothedPointerRef.current.y += 0.22 * (targetY - smoothedPointerRef.current.y);
        }
        px = smoothedPointerRef.current.x;
        py = smoothedPointerRef.current.y;
      }
    } else {
      smoothedPointerRef.current = null;
    }

    for (let i = bState.bubbles.length - 1; i >= 0; i--) {
      const b = bState.bubbles[i];
      b.y -= b.speedY;

      if (b.y < -b.radius) {
        bState.bubbles.splice(i, 1);
        bState.score = Math.max(0, bState.score - 5);
        setScore(bState.score);
        continue;
      }

      if (px !== null && py !== null) {
        const dx = b.x - px;
        const dy = b.y - py;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < b.radius + 8) {
          b.popped = true;
          bState.score += 10;
          setScore(bState.score);
          playSynthSound("pop", isMuted);
          createExplosion(b.x, b.y, b.color);
          bState.bubbles.splice(i, 1);
          continue;
        }
      }

      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = b.color;

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

      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.beginPath();
      ctx.arc(b.x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.22, 0, 2 * Math.PI);
      ctx.fill();

      ctx.restore();
    }

    drawParticles(ctx);

    if (px !== null && py !== null) {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00f3ff";
      ctx.strokeStyle = "#00f3ff";
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.arc(px, py, 18, Date.now() / 150, Date.now() / 150 + Math.PI * 1.6);
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    if (gameStatusRef.current === "PLAYING") {
      bubbleRequestRef.current = requestAnimationFrame(bubbleGameTick);
    }
  };

  // 13. Patches CV Game Logic Loop (LinkedIn Style Shikaku Game)
  const patchesGameTick = () => {
    if (activeGameRef.current !== "patches") return;

    const pState = patchesRef.current;
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let px: number | null = null;
    let py: number | null = null;
    if (pState.pointer) {
      const targetX = (1 - pState.pointer.x) * canvas.width;
      const targetY = pState.pointer.y * canvas.height;
      if (!useWebcam) {
        px = targetX;
        py = targetY;
      } else {
        if (!smoothedPointerRef.current) {
          smoothedPointerRef.current = { x: targetX, y: targetY };
        } else {
          smoothedPointerRef.current.x += 0.22 * (targetX - smoothedPointerRef.current.x);
          smoothedPointerRef.current.y += 0.22 * (targetY - smoothedPointerRef.current.y);
        }
        px = smoothedPointerRef.current.x;
        py = smoothedPointerRef.current.y;
      }
    } else {
      smoothedPointerRef.current = null;
    }

    const levelData = PATCHES_LEVELS[pState.level];
    const { gridSize, clues } = levelData;
    const gridStart = 50;
    const gridWidth = 400;
    const cellSize = gridWidth / gridSize;

    // A. Draw board grids
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2;
    ctx.strokeRect(gridStart, gridStart, gridWidth, gridWidth);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 1; i < gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(gridStart + i * cellSize, gridStart);
      ctx.lineTo(gridStart + i * cellSize, gridStart + gridWidth);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(gridStart, gridStart + i * cellSize);
      ctx.lineTo(gridStart + gridWidth, gridStart + i * cellSize);
      ctx.stroke();
    }

    // B. Draw shape clues in cells
    clues.forEach(clue => {
      const cx = gridStart + clue.col * cellSize + cellSize / 2;
      const cy = gridStart + clue.row * cellSize + cellSize / 2;

      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(clue.size.toString(), cx, cy - 8);

      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1.5;

      const iconSize = 12;
      if (clue.type === "square") {
        ctx.strokeRect(cx - iconSize / 2, cy + 6, iconSize, iconSize);
      } else if (clue.type === "wide") {
        ctx.strokeRect(cx - iconSize, cy + 8, iconSize * 2, iconSize / 2);
      } else if (clue.type === "tall") {
        ctx.strokeRect(cx - iconSize / 4, cy + 4, iconSize / 2, iconSize * 1.5);
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy + 12, iconSize / 2, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });

    // C. Draw placed patches
    pState.placedPatches.forEach(patch => {
      const px = gridStart + patch.col * cellSize;
      const py = gridStart + patch.row * cellSize;
      const pW = patch.width * cellSize;
      const pH = patch.height * cellSize;

      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = patch.color;

      ctx.fillStyle = hexToRgba(patch.color, 0.22);
      ctx.beginPath();
      ctx.roundRect(px + 4, py + 4, pW - 8, pH - 8, 8);
      ctx.fill();

      ctx.strokeStyle = patch.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    });

    // D. Draw tray area
    const trayY = 460;
    const trayWidth = 400;
    const trayCellSize = 25;
    const slotWidth = trayWidth / pState.trayPatches.length;

    pState.trayPatches.forEach((patch, index) => {
      const slotX = gridStart + index * slotWidth;
      const centerX = slotX + slotWidth / 2;
      const centerY = trayY;
      const pW = patch.width * trayCellSize;
      const pH = patch.height * trayCellSize;

      ctx.save();
      if (patch.placed) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(centerX - pW / 2, centerY - pH / 2, pW, pH, 4);
        ctx.stroke();
      } else {
        let isHovered = false;
        if (px !== null && py !== null) {
          if (Math.abs(px - centerX) < slotWidth / 2 && Math.abs(py - centerY) < 30) {
            isHovered = true;
          }
        }

        ctx.shadowBlur = isHovered ? 12 : 5;
        ctx.shadowColor = patch.color;
        ctx.fillStyle = hexToRgba(patch.color, isHovered ? 0.35 : 0.15);
        ctx.strokeStyle = patch.color;
        ctx.lineWidth = isHovered ? 2.5 : 1.5;

        ctx.beginPath();
        ctx.roundRect(centerX - pW / 2, centerY - pH / 2, pW, pH, 4);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });

    // E. Gestures Hover select lock loader logic
    if (gameStatusRef.current === "PLAYING" && px !== null && py !== null) {
      let currentTarget: typeof pState.hoverTarget = null;

      if (py >= trayY - 30 && py <= trayY + 30 && px >= gridStart && px <= gridStart + trayWidth) {
        const index = Math.floor((px - gridStart) / slotWidth);
        if (index >= 0 && index < pState.trayPatches.length) {
          const patch = pState.trayPatches[index];
          if (!patch.placed && !pState.selectedPatch) {
            currentTarget = { type: "tray", id: patch.id };
          }
        }
      } else if (px >= gridStart && px <= gridStart + gridWidth && py >= gridStart && py <= gridStart + gridWidth) {
        const col = Math.floor((px - gridStart) / cellSize);
        const row = Math.floor((py - gridStart) / cellSize);

        if (pState.selectedPatch) {
          currentTarget = { type: "grid", col, row };
        } else {
          const patch = pState.placedPatches.find(p =>
            col >= p.col && col < p.col + p.width &&
            row >= p.row && row < p.row + p.height
          );
          if (patch) {
            currentTarget = { type: "grid", id: patch.id, col: patch.col, row: patch.row };
          }
        }
      }

      if (useWebcam && currentTarget) {
        const isSameTarget = pState.hoverTarget && (
          (pState.hoverTarget.type === currentTarget.type && pState.hoverTarget.id === currentTarget.id && pState.hoverTarget.col === currentTarget.col && pState.hoverTarget.row === currentTarget.row)
        );

        if (isSameTarget) {
          const elapsed = Date.now() - pState.hoverStart;
          const progress = Math.min(1, elapsed / 800); // 800ms hover select/drop trigger

          ctx.save();
          ctx.strokeStyle = "#ff007f";
          ctx.lineWidth = 3.5;
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#ff007f";
          ctx.beginPath();
          ctx.arc(px, py, 22, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          if (progress >= 1) {
            handlePatchesAction(currentTarget);
            pState.hoverTarget = null;
          }
        } else {
          pState.hoverTarget = currentTarget;
          pState.hoverStart = Date.now();
        }
      } else {
        pState.hoverTarget = null;
      }

      // F. Drag previews and outlines on canvas
      if (pState.selectedPatch && px >= gridStart && px <= gridStart + gridWidth && py >= gridStart && py <= gridStart + gridWidth) {
        const col = Math.floor((px - gridStart) / cellSize);
        const row = Math.floor((py - gridStart) / cellSize);

        const startCol = Math.max(0, Math.min(gridSize - pState.selectedPatch.width, col - Math.floor(pState.selectedPatch.width / 2)));
        const startRow = Math.max(0, Math.min(gridSize - pState.selectedPatch.height, row - Math.floor(pState.selectedPatch.height / 2)));

        const previewX = gridStart + startCol * cellSize;
        const previewY = gridStart + startRow * cellSize;
        const previewW = pState.selectedPatch.width * cellSize;
        const previewH = pState.selectedPatch.height * cellSize;

        ctx.save();
        ctx.fillStyle = hexToRgba(pState.selectedPatch.color, 0.15);
        ctx.strokeStyle = pState.selectedPatch.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.roundRect(previewX + 4, previewY + 4, previewW - 8, previewH - 8, 8);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      if (pState.selectedPatch) {
        const pW = pState.selectedPatch.width * cellSize;
        const pH = pState.selectedPatch.height * cellSize;

        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = pState.selectedPatch.color;
        ctx.fillStyle = hexToRgba(pState.selectedPatch.color, 0.45);
        ctx.strokeStyle = pState.selectedPatch.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(px - pW / 2, py - pH / 2, pW, pH, 8);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    if (px !== null && py !== null) {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#00f3ff";
      ctx.strokeStyle = "#00f3ff";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(px, py, 14, Date.now() / 150, Date.now() / 150 + Math.PI * 1.5);
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    if (gameStatusRef.current === "PLAYING") {
      bubbleRequestRef.current = requestAnimationFrame(patchesGameTick);
    }
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
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
  const selectGame = (game: "snake" | "bubble" | "patches") => {
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (bubbleRequestRef.current) cancelAnimationFrame(bubbleRequestRef.current);
    setActiveGame(game);
    setGameStatus("IDLE");
    setScore(0);
    setSessionScores([]); // Reset session scores list when shifting tabs

    if (game === "patches") {
      initPatchesLevel(1);
    }

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

          {/* Simulation speed is locked to slow for maximum accessibility */}

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
              ) : activeGame === "bubble" ? (
                <>
                  <li><strong>Gesture Mode</strong>: Wave your hand in front of the lens. Guide the blue targeting crosshair with your index finger to pop the bubbles!</li>
                  <li><strong>Manual Mode</strong>: Disable webcam, then steer your cursor over the game screen to pop bubbles with your mouse.</li>
                </>
              ) : (
                <>
                  <li><strong>Gesture Mode</strong>: Hover your index finger over a tray patch for 0.8s to select it, then drag it over the grid. Hover over the snapping preview cell for 0.8s to drop/place it. Hover over a placed patch for 0.8s to return it to the tray.</li>
                  <li><strong>Manual Mode</strong>: Disable webcam, then click to select, click to drop, and click placed patches to pick them up.</li>
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

            <button
              onClick={() => selectGame("patches")}
              className={`${styles.gameCard} ${activeGame === "patches" ? styles.active : ""}`}
            >
              <h3>Patches CV</h3>
              <p>Spatial logic puzzle like LinkedIn. Place grid patches satisfying region shape clues.</p>
            </button>
          </div>

          {/* Retro Arcade CRT Monitor Screen */}
          <div className={`${styles.screenOuter} ${gameStatus === "PLAYING" ? styles.activePlay : ""}`}>

            {/* Game Canvas Top HUD bar */}
            <div className={styles.hudBar}>
              <span>
                GAME: <strong>{activeGame === "snake" ? "SNAKE CV" : activeGame === "bubble" ? "BUBBLE POP CV" : "PATCHES CV"}</strong>
              </span>
              {activeGame === "patches" && (
                <span>
                  LEVEL:{" "}
                  {[1, 2, 3].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => {
                        initPatchesLevel(lvl);
                        setGameStatus("PLAYING");
                        if (bubbleRequestRef.current) cancelAnimationFrame(bubbleRequestRef.current);
                        bubbleRequestRef.current = requestAnimationFrame(patchesGameTick);
                      }}
                      style={{
                        background: patchesLevel === lvl ? "var(--brand-medium)" : "rgba(255,255,255,0.1)",
                        color: patchesLevel === lvl ? "#000" : "#fff",
                        border: "none",
                        padding: "0.15rem 0.4rem",
                        marginLeft: "0.25rem",
                        borderRadius: "3px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        fontWeight: 700
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </span>
              )}
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
                onClick={handleGameCanvasClick}
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
                        : activeGame === "bubble"
                          ? "Hover your hand or mouse to pop glowing bubbles before they drift off screen."
                          : "Drag colored patches from the bottom tray to cover the board matching the clue constraints."}
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
                  <h3 style={{ color: activeGame === "patches" && score === 100 ? "#00ff66" : "#ef4444" }}>
                    {activeGame === "patches" && score === 100 ? "Level Solved!" : "Simulation Over"}
                  </h3>
                  <div className={styles.overlayStats}>
                    <div className={styles.statItem}>
                      <span className={styles.val}>{score}</span>
                      <span className={styles.lbl}>Final Score</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", width: "100%", justifyContent: "center" }}>
                    <button className={`${styles.btn} ${styles.primary}`} onClick={startGame}>
                      {activeGame === "patches" && score === 100 ? "Play Again" : "Replay"}
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
                    {/* Realtime Session Stats Dashboard */}
          <div className={styles.consoleCard} style={{ flex: 1, marginTop: "0.5rem" }}>
            <div className={styles.cardHeader}>
              <h2>Live Session Stats</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Realtime score display */}
              <div style={{
                background: "rgba(0, 243, 255, 0.03)",
                border: "1px dashed rgba(0, 243, 255, 0.2)",
                borderRadius: "var(--radius-m)",
                padding: "1rem",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.25rem",
                boxShadow: "inset 0 0 15px rgba(0, 243, 255, 0.02)"
              }}>
                <span style={{ fontSize: "0.75rem", color: "var(--neutral-on-background-weak)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                  Realtime Score
                </span>
                <span style={{
                  fontSize: "2.75rem",
                  fontWeight: 800,
                  color: "#00f3ff",
                  fontFamily: "var(--font-code)",
                  textShadow: "0 0 10px rgba(0, 243, 255, 0.4)",
                  lineHeight: 1.1
                }}>
                  {score}
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--neutral-on-background-weak)" }}>
                  active game: {activeGame === "snake" ? "Snake CV" : activeGame === "bubble" ? "Bubble Pop CV" : "Patches CV"}
                </span>
              </div>

              {/* Best score in session */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem 0.75rem",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "var(--radius-s)",
                border: "1px solid rgba(255, 255, 255, 0.05)"
              }}>
                <span style={{ fontSize: "0.8rem", color: "var(--neutral-on-background-weak)" }}>Session Best</span>
                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#00ff66", fontFamily: "var(--font-code)" }}>
                  {Math.max(0, ...sessionScores, score)} pts
                </span>
              </div>

              {/* Session history / attempts list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--neutral-on-background-strong)" }}>
                  Recent Session Attempts
                </span>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxHeight: "150px", overflowY: "auto" }}>
                  {sessionScores.map((s, index) => (
                    <div key={index} className={styles.scoreRow}>
                      <span className={styles.rank}>#{sessionScores.length - index}</span>
                      <span className={styles.name}>Attempt Score</span>
                      <span className={styles.val}>{s} pts</span>
                    </div>
                  ))}
                  {sessionScores.length === 0 && (
                    <div style={{ textAlign: "center", color: "var(--neutral-on-background-weak)", fontSize: "0.8rem", padding: "0.75rem 0" }}>
                      No completed attempts in this session.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>  </div>

        </div>

      </div>
    </div>
  );
}
