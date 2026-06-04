"use client";

import React, { useEffect, useRef } from "react";

interface DotFieldProps {
  dotRadius?: number;
  dotSpacing?: number;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
}

const DotField: React.FC<DotFieldProps> = ({
  dotRadius = 1.5,
  dotSpacing = 14,
  bulgeStrength = 67,
  glowRadius = 160,
  sparkle = false,
  waveAmplitude = 0,
  cursorRadius = 500,
  cursorForce = 0.1,
  bulgeOnly = true,
  gradientFrom = "#A855F7",
  gradientTo = "#B497CF",
  glowColor = "#120F17",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    let mouse = { x: width / 2, y: height / 2 };
    let isMouseHovering = false;

    // Build grid
    const dots: {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
    }[] = [];

    const cols = Math.floor(width / dotSpacing);
    const rows = Math.floor(height / dotSpacing);

    const xOffset = (width - cols * dotSpacing) / 2;
    const yOffset = (height - rows * dotSpacing) / 2;

    for (let i = 0; i <= cols; i++) {
      for (let j = 0; j <= rows; j++) {
        dots.push({
          x: xOffset + i * dotSpacing,
          y: yOffset + j * dotSpacing,
          baseX: xOffset + i * dotSpacing,
          baseY: yOffset + j * dotSpacing,
          size: dotRadius,
        });
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      isMouseHovering = true;
    };

    const onMouseLeave = () => {
      isMouseHovering = false;
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16),
          ]
        : [255, 255, 255];
    };

    const color1 = hexToRgb(gradientFrom);
    const color2 = hexToRgb(gradientTo);

    const interpolateColor = (c1: number[], c2: number[], factor: number) => {
      const r = Math.round(c1[0] + factor * (c2[0] - c1[0]));
      const g = Math.round(c1[1] + factor * (c2[1] - c1[1]));
      const b = Math.round(c1[2] + factor * (c2[2] - c1[2]));
      return `rgb(${r}, ${g}, ${b})`;
    };

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Add a glow
      if (isMouseHovering && glowRadius > 0) {
        const gradient = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          glowRadius
        );
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // Reset dot size and position to base gradually
        if (!bulgeOnly) {
           dot.x += (dot.baseX - dot.x) * 0.1;
           dot.y += (dot.baseY - dot.y) * 0.1;
        }

        let targetSize = dotRadius;

        if (isMouseHovering) {
          const dx = mouse.x - dot.baseX;
          const dy = mouse.y - dot.baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < cursorRadius) {
            const force = (cursorRadius - dist) / cursorRadius;
            const push = force * bulgeStrength;
            
            if (bulgeOnly) {
              const angle = Math.atan2(dy, dx);
              const pushX = Math.cos(angle) * push * cursorForce;
              const pushY = Math.sin(angle) * push * cursorForce;
              dot.x = dot.baseX - pushX;
              dot.y = dot.baseY - pushY;
              targetSize = dotRadius + force * 2;
            } else {
              // Different physics mode (optional based on props)
              const angle = Math.atan2(dy, dx);
              dot.x -= Math.cos(angle) * push * cursorForce;
              dot.y -= Math.sin(angle) * push * cursorForce;
            }
          } else {
             if(bulgeOnly) {
               dot.x += (dot.baseX - dot.x) * 0.1;
               dot.y += (dot.baseY - dot.y) * 0.1;
             }
          }
        } else {
           if(bulgeOnly) {
              dot.x += (dot.baseX - dot.x) * 0.1;
              dot.y += (dot.baseY - dot.y) * 0.1;
           }
        }

        dot.size += (targetSize - dot.size) * 0.1;

        if (sparkle && Math.random() > 0.99) {
           dot.size = dotRadius * 2;
        }

        const normalizedX = dot.x / width;
        const color = interpolateColor(color1, color2, normalizedX);

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, Math.max(0.1, dot.size), 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width;
      canvas.height = height;

      dots.length = 0;
      const newCols = Math.floor(width / dotSpacing);
      const newRows = Math.floor(height / dotSpacing);

      const newXOffset = (width - newCols * dotSpacing) / 2;
      const newYOffset = (height - newRows * dotSpacing) / 2;

      for (let i = 0; i <= newCols; i++) {
        for (let j = 0; j <= newRows; j++) {
          dots.push({
            x: newXOffset + i * dotSpacing,
            y: newYOffset + j * dotSpacing,
            baseX: newXOffset + i * dotSpacing,
            baseY: newYOffset + j * dotSpacing,
            size: dotRadius,
          });
        }
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [
    dotRadius,
    dotSpacing,
    bulgeStrength,
    glowRadius,
    sparkle,
    waveAmplitude,
    cursorRadius,
    cursorForce,
    bulgeOnly,
    gradientFrom,
    gradientTo,
    glowColor,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "auto",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
};

export default DotField;
