"use client";

import React, { useEffect, useState } from "react";

export const Loader = () => {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lightsOut, setLightsOut] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [visible, setVisible] = useState(true);
  const [rpm, setRpm] = useState(0);
  const [gear, setGear] = useState("N");

  useEffect(() => {
    setMounted(true);

    // Check if the user has already seen the loader in this session
    const hasSeen = sessionStorage.getItem("hasSeenLoader");
    if (hasSeen === "true") {
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

    return () => clearInterval(timer);
  }, []);

  // Update RPM, gear, and lights out status based on progress
  useEffect(() => {
    if (!mounted || progress >= 100) {
      if (progress === 100) {
        setRpm(13500); // Rev limiter
        setGear("1");
        
        // Wait 600ms with all lights red, then trigger LIGHTS OUT
        const lightsOutTimer = setTimeout(() => {
          setLightsOut(true);
          sessionStorage.setItem("hasSeenLoader", "true");
          
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
      return;
    }

    // Scale RPM from 0 to 13000
    if (progress < 85) {
      setRpm(Math.floor(progress * 135));
      setGear("N");
    } else {
      // Shift to 1st gear near launch
      setRpm(Math.floor(11000 + (progress - 85) * 150));
      setGear("1");
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
          justifyContent: "center"
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
    if (lightsOut) return "LIGHTS OUT AND AWAY WE GO!";
    if (progress >= 100) return "CLUTCH DEPLOYED. READY TO LAUNCH...";
    if (progress >= 90) return "ENGINE AT MAXIMUM RPM. WATCH THE LIGHTS...";
    if (progress >= 75) return "CALIBRATING DRS & HYBRID SYSTEMS...";
    if (progress >= 55) return "MONITORING BRAKE & TYRE TEMPERATURES...";
    if (progress >= 35) return "AERODYNAMICS SYNCED. TELEMETRY UP...";
    if (progress >= 15) return "V6 TURBOCHARGED HYBRID SYSTEM RUNNING...";
    return "INITIALIZING ENGINE SYSTEMS...";
  };

  return (
    <div className={`f1-loader-overlay ${fadeOut ? "fade-out" : ""}`}>
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
                <span className="hud-value font-mono">
                  {rpm.toLocaleString()}
                </span>
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
