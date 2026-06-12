"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, memo } from "react";

/**
 * F1RacingTrack — A persistent SVG racing circuit visible across all pages.
 * The track flows as a continuous element, giving the feel of the F1 car
 * driving along a circuit as you navigate between pages.
 */
const F1RacingTrack = memo(() => {
  const pathname = usePathname();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
      setScrollProgress(Math.min(1, Math.max(0, scrollY / maxScroll)));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  if (pathname === "/" || pathname === "/about") {
    return null;
  }

  // The track "segment" changes per page, but the visual style is consistent
  // Home → Starting grid / pit lane feel
  // About → Long straight / chicane
  // Work → Full circuit overview
  const dashOffset = scrollProgress * 2000;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          {/* Track gradient for dark mode */}
          <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--f1-track-color, rgba(225, 6, 0, 0.12))" />
            <stop offset="50%" stopColor="var(--f1-track-mid, rgba(168, 85, 247, 0.08))" />
            <stop offset="100%" stopColor="var(--f1-track-color, rgba(225, 6, 0, 0.12))" />
          </linearGradient>

          {/* Animated dashed racing line */}
          <linearGradient id="racingLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(225, 6, 0, 0.6)" />
            <stop offset="50%" stopColor="rgba(168, 85, 247, 0.5)" />
            <stop offset="100%" stopColor="rgba(225, 6, 0, 0.6)" />
          </linearGradient>

          {/* Glow filter for the racing line */}
          <filter id="trackGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Checkered pattern */}
          <pattern id="checkered" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect
              x="0"
              y="0"
              width="10"
              height="10"
              fill="var(--f1-checker-a, rgba(255,255,255,0.03))"
            />
            <rect
              x="10"
              y="10"
              width="10"
              height="10"
              fill="var(--f1-checker-a, rgba(255,255,255,0.03))"
            />
            <rect
              x="10"
              y="0"
              width="10"
              height="10"
              fill="var(--f1-checker-b, rgba(0,0,0,0.02))"
            />
            <rect
              x="0"
              y="10"
              width="10"
              height="10"
              fill="var(--f1-checker-b, rgba(0,0,0,0.02))"
            />
          </pattern>
        </defs>

        {/* ===== Main F1 Track Circuit ===== */}
        {/* The track path flows from top-right, curves through the viewport, and exits bottom-left — 
            this creates a sense of continuation between pages */}

        {/* Track surface (wide) */}
        <path
          d="M 2100 200 C 1600 200, 1400 100, 1100 300 
             S 800 600, 600 500 
             S 200 200, 100 400 
             S -100 700, 200 800 
             S 600 900, 900 750 
             S 1300 500, 1500 700 
             S 1800 1000, 2100 900"
          fill="none"
          stroke="url(#trackGradient)"
          strokeWidth="60"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
        />

        {/* Track border outer */}
        <path
          d="M 2100 200 C 1600 200, 1400 100, 1100 300 
             S 800 600, 600 500 
             S 200 200, 100 400 
             S -100 700, 200 800 
             S 600 900, 900 750 
             S 1300 500, 1500 700 
             S 1800 1000, 2100 900"
          fill="none"
          stroke="var(--f1-track-border, rgba(255, 255, 255, 0.04))"
          strokeWidth="62"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />

        {/* Racing line (center, animated dash) */}
        <path
          d="M 2100 200 C 1600 200, 1400 100, 1100 300 
             S 800 600, 600 500 
             S 200 200, 100 400 
             S -100 700, 200 800 
             S 600 900, 900 750 
             S 1300 500, 1500 700 
             S 1800 1000, 2100 900"
          fill="none"
          stroke="url(#racingLineGrad)"
          strokeWidth="2"
          strokeDasharray="12 20"
          strokeDashoffset={-dashOffset}
          strokeLinecap="round"
          filter="url(#trackGlow)"
          opacity="0.7"
          style={{
            transition: "stroke-dashoffset 0.1s linear",
            animation: "dashMove 20s linear infinite",
          }}
        />

        <style>
          {`
            @keyframes dashMove {
              to { stroke-dashoffset: -2000; }
            }
          `}
        </style>

        {/* Kerb markers — red/white curbing at key corners */}
        {/* Corner 1 — top right approach */}
        <circle cx="1100" cy="300" r="6" fill="var(--f1-red, #E10600)" opacity="0.25" />
        <circle
          cx="1100"
          cy="300"
          r="3"
          fill="var(--f1-kerb-inner, rgba(255,255,255,0.4))"
          opacity="0.3"
        />

        {/* Corner 2 — mid left chicane */}
        <circle cx="100" cy="400" r="6" fill="var(--f1-red, #E10600)" opacity="0.25" />
        <circle
          cx="100"
          cy="400"
          r="3"
          fill="var(--f1-kerb-inner, rgba(255,255,255,0.4))"
          opacity="0.3"
        />

        {/* Corner 3 — bottom right hairpin */}
        <circle cx="900" cy="750" r="6" fill="var(--f1-red, #E10600)" opacity="0.25" />
        <circle
          cx="900"
          cy="750"
          r="3"
          fill="var(--f1-kerb-inner, rgba(255,255,255,0.4))"
          opacity="0.3"
        />

        {/* Checkered flag zone at bottom */}
        <rect x="0" y="1040" width="1920" height="40" fill="url(#checkered)" opacity="0.5" />

        {/* DRS Detection zone markers */}
        <line
          x1="1400"
          y1="100"
          x2="1400"
          y2="180"
          stroke="var(--f1-red, #E10600)"
          strokeWidth="2"
          opacity="0.15"
        />
        <line
          x1="1410"
          y1="100"
          x2="1410"
          y2="180"
          stroke="var(--f1-red, #E10600)"
          strokeWidth="2"
          opacity="0.15"
        />

        {/* Sector markers */}
        <text
          x="1600"
          y="180"
          fill="var(--f1-sector-text, rgba(255,255,255,0.06))"
          fontSize="11"
          fontWeight="700"
          fontFamily="monospace"
          letterSpacing="0.1em"
        >
          SECTOR 1
        </text>
        <text
          x="200"
          y="350"
          fill="var(--f1-sector-text, rgba(255,255,255,0.06))"
          fontSize="11"
          fontWeight="700"
          fontFamily="monospace"
          letterSpacing="0.1em"
        >
          SECTOR 2
        </text>
        <text
          x="1200"
          y="850"
          fill="var(--f1-sector-text, rgba(255,255,255,0.06))"
          fontSize="11"
          fontWeight="700"
          fontFamily="monospace"
          letterSpacing="0.1em"
        >
          SECTOR 3
        </text>
      </svg>

      {/* Ambient glow effects */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          right: "-5%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--f1-glow-a, rgba(225, 6, 0, 0.04)) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "-5%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--f1-glow-b, rgba(168, 85, 247, 0.035)) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
    </div>
  );
});

F1RacingTrack.displayName = "F1RacingTrack";

export default F1RacingTrack;
