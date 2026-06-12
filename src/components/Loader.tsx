"use client";

import React, { useEffect, useState, useRef } from "react";

// Web Audio API Sound Synthesizer for F1 Gantry Lights and Engine
class F1EngineSynth {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private mainGain: GainNode | null = null;
  private revLimiterInterval: any = null;
  private isMuted: boolean = true;
  private isRunning: boolean = false;

  constructor() {
    // Lazy initialization
  }

  public init() {
    if (this.ctx) return;
    try {
      if (typeof window !== "undefined") {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public startEngine() {
    this.init();
    if (this.isRunning || !this.ctx || this.isMuted) return;

    if (this.ctx.state === "suspended") {
      return;
    }

    this.isRunning = true;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    this.osc1 = ctx.createOscillator();
    this.osc2 = ctx.createOscillator();
    this.filter = ctx.createBiquadFilter();
    this.mainGain = ctx.createGain();

    this.osc1.type = "sawtooth";
    this.osc1.frequency.setValueAtTime(70, now);

    this.osc2.type = "sawtooth";
    this.osc2.frequency.setValueAtTime(70.5, now);

    this.filter.type = "lowpass";
    this.filter.frequency.setValueAtTime(500, now);
    this.filter.Q.setValueAtTime(1.5, now);

    this.mainGain.gain.setValueAtTime(0.0, now);
    this.mainGain.gain.linearRampToValueAtTime(0.08, now + 0.3);

    this.osc1.connect(this.filter);
    this.osc2.connect(this.filter);
    this.filter.connect(this.mainGain);
    this.mainGain.connect(ctx.destination);

    this.osc1.start(now);
    this.osc2.start(now);
  }

  public updateRPM(rpm: number) {
    this.init();
    if (this.isMuted) return;

    if (!this.isRunning && this.ctx && this.ctx.state === "running") {
      this.startEngine();
    }

    if (!this.isRunning || !this.osc1 || !this.osc2 || !this.filter || !this.mainGain || !this.ctx)
      return;

    const now = this.ctx.currentTime;
    const baseFreq = 70 + (rpm / 13500) * 530;

    this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
    this.osc2.frequency.setTargetAtTime(baseFreq * 1.008, now, 0.05);

    const filterCutoff = 500 + (rpm / 13500) * 1500;
    this.filter.frequency.setTargetAtTime(filterCutoff, now, 0.05);

    const baseGain = 0.06 + (rpm / 13500) * 0.08;
    this.mainGain.gain.setTargetAtTime(baseGain, now, 0.05);
  }

  public playLightBeep() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    if (this.ctx.state === "suspended") return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1100, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn("Failed to play light beep", e);
    }
  }

  public triggerRevLimiter() {
    if (this.isMuted) return;
    this.init();

    if (!this.isRunning && this.ctx && this.ctx.state === "running") {
      this.startEngine();
    }

    if (!this.isRunning || !this.mainGain || !this.ctx) return;
    if (this.revLimiterInterval) return;

    let high = true;
    this.revLimiterInterval = setInterval(() => {
      if (!this.mainGain || !this.ctx) return;
      const now = this.ctx.currentTime;

      const val = high ? 0.15 : 0.02;
      this.mainGain.gain.setValueAtTime(val, now);

      const freq = high ? 600 : 570;
      this.osc1?.frequency.setValueAtTime(freq, now);
      this.osc2?.frequency.setValueAtTime(freq * 1.008, now);

      high = !high;
    }, 45);
  }

  public triggerLaunch() {
    if (this.revLimiterInterval) {
      clearInterval(this.revLimiterInterval);
      this.revLimiterInterval = null;
    }

    if (this.isMuted) return;
    this.init();

    if (!this.isRunning || !this.osc1 || !this.osc2 || !this.mainGain || !this.ctx) return;

    const now = this.ctx.currentTime;

    this.osc1.frequency.setValueAtTime(600, now);
    this.osc1.frequency.linearRampToValueAtTime(450, now + 0.08);
    this.osc1.frequency.exponentialRampToValueAtTime(950, now + 0.9);

    this.osc2.frequency.setValueAtTime(605, now);
    this.osc2.frequency.linearRampToValueAtTime(453, now + 0.08);
    this.osc2.frequency.exponentialRampToValueAtTime(957, now + 0.9);

    if (this.filter) {
      this.filter.frequency.setValueAtTime(2000, now);
      this.filter.frequency.exponentialRampToValueAtTime(3800, now + 0.9);
    }

    this.mainGain.gain.setValueAtTime(0.15, now);
    this.mainGain.gain.setValueAtTime(0.15, now + 0.1);
    this.mainGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    setTimeout(() => {
      this.stop();
    }, 1300);
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    } else {
      this.resume();
      this.startEngine();
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.revLimiterInterval) {
      clearInterval(this.revLimiterInterval);
      this.revLimiterInterval = null;
    }
    try {
      if (this.osc1) {
        this.osc1.stop();
        this.osc1.disconnect();
        this.osc1 = null;
      }
      if (this.osc2) {
        this.osc2.stop();
        this.osc2.disconnect();
        this.osc2 = null;
      }
      if (this.filter) {
        this.filter.disconnect();
        this.filter = null;
      }
      if (this.mainGain) {
        this.mainGain.disconnect();
        this.mainGain = null;
      }
    } catch (e) {
      // Ignore
    }
  }
}

export const Loader = () => {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lightsOut, setLightsOut] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [visible, setVisible] = useState(true);
  const [rpm, setRpm] = useState(0);
  const [gear, setGear] = useState("N");
  const [isMuted, setIsMuted] = useState(true);

  const synthRef = useRef<F1EngineSynth | null>(null);
  const beepedRef = useRef<boolean[]>([false, false, false, false, false]);
  const isFirstTime = useRef(true);

  useEffect(() => {
    setMounted(true);
    synthRef.current = new F1EngineSynth();

    // Check if the user has already seen the loader in this session
    const hasSeen = sessionStorage.getItem("hasSeenLoader");
    if (hasSeen === "true") {
      isFirstTime.current = false;
      // Fast fade out for repeat actions
      setProgress(100);
      setLightsOut(true);
      const timer = setTimeout(() => {
        setFadeOut(true);
        const hideTimer = setTimeout(() => setVisible(false), 400);
        return () => clearTimeout(hideTimer);
      }, 100);
      return () => clearTimeout(timer);
    }

    // First time visitor sequence
    const duration = 2500; // 2.5 seconds total
    const intervalTime = 16; // ~60fps
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step * (0.8 + Math.random() * 0.4); // slightly variable speed
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => {
      clearInterval(timer);
      synthRef.current?.stop();
    };
  }, []);

  // Update RPM, gear, and lights out status based on progress
  useEffect(() => {
    if (!mounted) return;

    // Trigger light beeps as progress crosses thresholds
    if (isFirstTime.current) {
      const thresholds = [15, 35, 55, 75, 90];
      thresholds.forEach((threshold, index) => {
        if (progress >= threshold && !beepedRef.current[index]) {
          beepedRef.current[index] = true;
          synthRef.current?.playLightBeep();
        }
      });
    }

    if (progress >= 100) {
      setRpm(13500); // Rev limiter
      setGear("1");

      if (isFirstTime.current) {
        synthRef.current?.triggerRevLimiter();
      }

      // Wait 600ms with all lights red, then trigger LIGHTS OUT
      const lightsOutTimer = setTimeout(() => {
        setLightsOut(true);
        sessionStorage.setItem("hasSeenLoader", "true");

        if (isFirstTime.current) {
          synthRef.current?.triggerLaunch();
        }

        // Fade out the overlay 800ms after lights out
        const fadeTimer = setTimeout(() => {
          setFadeOut(true);
          const hideTimer = setTimeout(() => setVisible(false), 600);
          return () => clearTimeout(hideTimer);
        }, 800);

        return () => clearTimeout(fadeTimer);
      }, 600);

      return () => clearTimeout(lightsOutTimer);
    }

    // Scale RPM from 0 to 13000
    let currentRpm = 0;
    if (progress < 85) {
      currentRpm = Math.floor(progress * 135);
      setRpm(currentRpm);
      setGear("N");
    } else {
      // Shift to 1st gear near launch
      currentRpm = Math.floor(11000 + (progress - 85) * 150);
      setRpm(currentRpm);
      setGear("1");
    }

    if (isFirstTime.current) {
      synthRef.current?.updateRPM(currentRpm);
    }
  }, [progress, mounted]);

  if (!visible) return null;

  // Render a full-screen placeholder during SSR to avoid layout shift
  if (!mounted) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#0d0d0d",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    );
  }

  // Determine which lights should be lit
  const isLightLit = (index: number) => {
    if (lightsOut) return false;
    if (progress >= 100) return true;
    const thresholds = [15, 35, 55, 75, 90];
    return progress >= thresholds[index];
  };

  // Get current telemetry status text
  const getTelemetryText = () => {
    if (isMuted && isFirstTime.current && !lightsOut) {
      if (progress < 40) return "AUDIO OFFLINE. CLICK SCREEN TO ACTIVATE V6 HYBRID SOUND...";
      if (progress < 85) return "SYSTEM MUTE. TAP ANYWHERE TO UNLEASH ENGINE ROAR...";
    }
    if (lightsOut) return "LIGHTS OUT AND AWAY WE GO!";
    if (progress >= 100) return "CLUTCH DEPLOYED. READY TO LAUNCH...";
    if (progress >= 90) return "ENGINE AT MAXIMUM RPM. WATCH THE LIGHTS...";
    if (progress >= 75) return "CALIBRATING DRS & HYBRID SYSTEMS...";
    if (progress >= 55) return "MONITORING BRAKE & TYRE TEMPERATURES...";
    if (progress >= 35) return "AERODYNAMICS SYNCED. TELEMETRY UP...";
    if (progress >= 15) return "V6 TURBOCHARGED HYBRID SYSTEM RUNNING...";
    return "INITIALIZING ENGINE SYSTEMS...";
  };

  const handleOverlayClick = () => {
    if (isMuted && isFirstTime.current && !lightsOut) {
      setIsMuted(false);
      synthRef.current?.setMute(false);
      synthRef.current?.updateRPM(rpm);
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isFirstTime.current || lightsOut) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    synthRef.current?.setMute(nextMuted);
    if (!nextMuted) {
      synthRef.current?.updateRPM(rpm);
    }
  };

  return (
    <div
      className={`f1-loader-overlay ${fadeOut ? "fade-out" : ""}`}
      onClick={handleOverlayClick}
      style={{ cursor: isMuted && isFirstTime.current && !lightsOut ? "pointer" : "default" }}
    >
      {/* Audio Toggle Button */}
      {isFirstTime.current && !lightsOut && (
        <button
          className={`f1-audio-toggle ${isMuted ? "muted" : "unmuted"}`}
          onClick={handleToggleMute}
          title={isMuted ? "Unmute Engine Sound" : "Mute Engine Sound"}
        >
          <span className="audio-icon">{isMuted ? "🔇" : "🔊"}</span>
          <span className="audio-text">{isMuted ? "SOUND OFF" : "SOUND ON"}</span>
        </button>
      )}
      <div className="f1-loader-content">
        {/* Header Title */}
        <div className="f1-loader-header">
          <span className="f1-loader-title">DWAIPAYAN DASGUPTA</span>
          <span className="f1-loader-subtitle">PORTFOLIO ENGINE v3.0</span>
        </div>

        {/* F1 Gantry Lights */}
        <div className="f1-gantry-structure">
          <div className="f1-gantry-truss" />
          <div className="f1-gantry">
            {[0, 1, 2, 3, 4].map((index) => {
              const lit = isLightLit(index);
              return (
                <div key={index} className="f1-light-column">
                  <div className={`f1-light-bulb ${lit ? "lit" : ""}`} />
                  <div className={`f1-light-bulb ${lit ? "lit" : ""}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Dash HUD Display */}
        <div className="f1-dash-hud">
          {/* LED Shift Indicator */}
          <div className="f1-led-strip">
            {Array.from({ length: 15 }).map((_, i) => {
              const percentage = (i / 14) * 100;
              const active = progress >= percentage;
              let colorClass = "";
              if (active) {
                if (i < 5) colorClass = "green";
                else if (i < 10) colorClass = "yellow";
                else colorClass = "red";
              }
              return (
                <div
                  key={i}
                  className={`f1-led-dot ${active ? "active" : ""} ${colorClass} ${progress >= 95 ? "blink" : ""}`}
                />
              );
            })}
          </div>

          <div className="f1-telemetry-row">
            {/* Gear Indicator */}
            <div className="f1-hud-item gear-box">
              <span className="hud-label">GEAR</span>
              <span className={`hud-value gear-val ${gear === "1" ? "gear-active" : ""}`}>
                {gear}
              </span>
            </div>

            {/* Speed/RPM Display */}
            <div className="f1-hud-item numeric-box">
              <div className="hud-group">
                <span className="hud-label">RPM</span>
                <span className="hud-value font-mono">{rpm.toLocaleString()}</span>
              </div>
              <div className="hud-group">
                <span className="hud-label">LAUNCH</span>
                <span className="hud-value font-mono text-purple">
                  {Math.min(100, Math.floor(progress))}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Console */}
        <div className="f1-telemetry-console">
          <div className="console-line">
            <span className="console-prompt">&gt;</span>{" "}
            <span className={`console-text ${lightsOut ? "launch-text" : ""}`}>
              {getTelemetryText()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
