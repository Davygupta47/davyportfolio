"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Bounds } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from 'next-themes';

/**
 * Procedurally generates the asphalt texture with subtle grain and rubber streaks.
 */
function createAsphaltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) return null;

  // Base dark gray
  context.fillStyle = '#1a1a1a';
  context.fillRect(0, 0, 512, 512);

  // Noise / grain
  for (let i = 0; i < 15000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    context.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
    context.fillRect(x, y, 2, 2);
  }

  // Subtle rubber streaks
  for (let i = 0; i < 20; i++) {
    context.beginPath();
    context.moveTo(Math.random() * 512, 0);
    context.lineTo(Math.random() * 512, 512);
    context.strokeStyle = 'rgba(0,0,0,0.15)';
    context.lineWidth = Math.random() * 10 + 5;
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 1);
  return texture;
}

/**
 * Procedurally generates the checkered start/finish line texture.
 */
function createStartLineTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  const size = 32;
  for(let y=0; y<256; y+=size) {
    for(let x=0; x<256; x+=size) {
      ctx.fillStyle = ((x/size + y/size) % 2 === 0) ? '#ffffff' : '#1a1a1a';
      ctx.fillRect(x, y, size, size);
    }
  }
  return new THREE.CanvasTexture(canvas);
}

/**
 * Headlight Sprite Glow Texture
 */
function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64; 
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.5)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(canvas);
}

// Track configuration
const TRACK_WIDTH = 1.8;
const CAR_SCALE = 1.5;
const LAP_DURATION_SECONDS = 20;

function TrackScene() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  const { scene: ferrariScene } = useGLTF('/models/ferrari/scene.gltf');
  const clonedFerrari = useMemo(() => ferrariScene.clone(), [ferrariScene]);

  const carGroup = useRef<THREE.Group>(null);
  const leftHeadlight = useRef<THREE.Sprite>(null);
  const rightHeadlight = useRef<THREE.Sprite>(null);

  // 1. Memoize Textures
  const asphaltTex = useMemo(() => createAsphaltTexture(), []);
  const startLineTex = useMemo(() => createStartLineTexture(), []);
  const glowTex = useMemo(() => createGlowTexture(), []);

  // 2. Define Spa-Francorchamps Track Path
  const trackCurve = useMemo(() => {
    const points = [
      new THREE.Vector3(-110, 0, 80),   // La Source Hairpin
      new THREE.Vector3(-90, 0, 65),    // Straight to Eau Rouge
      new THREE.Vector3(-70, 0, 50),    // Eau Rouge entry
      new THREE.Vector3(-60, 0, 45),    // Eau Rouge left
      new THREE.Vector3(-50, 0, 35),    // Raidillon right
      new THREE.Vector3(-55, 0, 20),    // Raidillon crest
      new THREE.Vector3(-45, 0, 0),     // Kemmel Straight
      new THREE.Vector3(-25, 0, -25),
      new THREE.Vector3(5, 0, -50),
      new THREE.Vector3(40, 0, -75),    // Kemmel Straight end
      new THREE.Vector3(65, 0, -85),    // Les Combes entry
      new THREE.Vector3(85, 0, -90),    // Les Combes right
      new THREE.Vector3(95, 0, -80),    // Les Combes left
      new THREE.Vector3(85, 0, -65),    // Malmedy right
      new THREE.Vector3(100, 0, -50),   // Straight to Bruxelles
      new THREE.Vector3(115, 0, -40),
      new THREE.Vector3(125, 0, -25),   // Bruxelles hairpin entry
      new THREE.Vector3(125, 0, -5),    // Bruxelles hairpin apex
      new THREE.Vector3(105, 0, 5),     // Bruxelles hairpin exit
      new THREE.Vector3(85, 0, 0),      // No name curve
      new THREE.Vector3(60, 0, 5),      // Approach to Pouhon
      new THREE.Vector3(45, 0, 15),     // Pouhon entry
      new THREE.Vector3(30, 0, 25),     // Pouhon apex 1
      new THREE.Vector3(25, 0, 35),     // Pouhon apex 2
      new THREE.Vector3(40, 0, 45),     // Pouhon exit
      new THREE.Vector3(55, 0, 50),     // Fagnes entry
      new THREE.Vector3(75, 0, 45),     // Fagnes right
      new THREE.Vector3(85, 0, 55),     // Fagnes left
      new THREE.Vector3(100, 0, 65),    // Campus right
      new THREE.Vector3(115, 0, 80),    // Stavelot 1
      new THREE.Vector3(115, 0, 95),    // Stavelot 2
      new THREE.Vector3(100, 0, 105),   // Curve to Blanchimont
      new THREE.Vector3(75, 0, 100),    // Blanchimont 1
      new THREE.Vector3(40, 0, 85),     // Blanchimont 2
      new THREE.Vector3(15, 0, 70),     // Approach to Bus Stop
      new THREE.Vector3(-10, 0, 55),    // Bus Stop entry
      new THREE.Vector3(-25, 0, 50),    // Bus Stop right
      new THREE.Vector3(-40, 0, 60),    // Bus Stop left
      new THREE.Vector3(-55, 0, 70),    // Bus Stop exit
      new THREE.Vector3(-80, 0, 75),    // Start/Finish straight
    ];
    return new THREE.CatmullRomCurve3(points, true);
  }, []);

  // Track Geometries
  const trackGeometry = useMemo(() => {
    const geo = new THREE.TubeGeometry(trackCurve, 200, TRACK_WIDTH, 8, true);
    geo.scale(1, 0.01, 1);
    return geo;
  }, [trackCurve]);

  const borderGeometry = useMemo(() => {
    const geo = new THREE.TubeGeometry(trackCurve, 200, TRACK_WIDTH + 0.8, 8, true);
    geo.scale(1, 0.005, 1);
    return geo;
  }, [trackCurve]);

  const outerBorderGeometry = useMemo(() => {
    const geo = new THREE.TubeGeometry(trackCurve, 200, TRACK_WIDTH + 1.6, 8, true);
    geo.scale(1, 0.002, 1);
    return geo;
  }, [trackCurve]);

  // Infield Geometry
  const infieldGeometry = useMemo(() => {
    const points2d = trackCurve.getPoints(100).map(p => new THREE.Vector2(p.x, p.z));
    const shape = new THREE.Shape(points2d);
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [trackCurve]);

  // Track animation state
  const prevTangent = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (!carGroup.current) return;

    const time = state.clock.getElapsedTime();
    const t = (time % LAP_DURATION_SECONDS) / LAP_DURATION_SECONDS;

    // 1. Position
    const point = trackCurve.getPointAt(t);
    carGroup.current.position.copy(point);

    // 2. Yaw (Rotation Y)
    const tangent = trackCurve.getTangentAt(t);
    const yaw = Math.atan2(tangent.x, tangent.z);
    carGroup.current.rotation.y = yaw;

    // 3. Roll (Banking)
    if (prevTangent.current.lengthSq() > 0) {
      const cross = new THREE.Vector3().crossVectors(prevTangent.current, tangent);
      const targetRoll = cross.y * 30; 
      carGroup.current.rotation.z = THREE.MathUtils.lerp(carGroup.current.rotation.z, Math.max(Math.min(targetRoll, 0.15), -0.15), 0.1);
    }
    prevTangent.current.copy(tangent);

    // 4. Headlight Pulse
    const pulse = 0.8 + Math.sin(time * 15) * 0.1;
    if (leftHeadlight.current) leftHeadlight.current.material.opacity = pulse;
    if (rightHeadlight.current) rightHeadlight.current.material.opacity = pulse;
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight 
        position={[50, 100, 50]} 
        intensity={0.6} 
        color={0xaaaaff} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={10}
        shadow-camera-far={300}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
      />

      {/* TRACK SURFACE */}
      <mesh geometry={trackGeometry} receiveShadow position={[0, 0.1, 0]}>
        <meshStandardMaterial 
          color={isDark ? 0xffffff : 0x666666} 
          roughness={0.6} 
          metalness={0.1} 
        />
      </mesh>

      {/* BORDERS */}
      <mesh geometry={borderGeometry} position={[0, 0.05, 0]}>
        <meshBasicMaterial color={isDark ? 0x1a1a1a : 0xdddddd} side={THREE.BackSide} />
      </mesh>
      <mesh geometry={outerBorderGeometry} position={[0, 0.02, 0]}>
        <meshBasicMaterial color={isDark ? 0xffffff : 0x666666} side={THREE.BackSide} />
      </mesh>

      {/* INFIELD (Removed for realistic sleek look, leaving just the lines) */}

      {/* START/FINISH LINE STRAP */}
      <mesh position={trackCurve.getPointAt(0.95)} rotation={[-Math.PI / 2, 0, Math.atan2(trackCurve.getTangentAt(0.95).x, trackCurve.getTangentAt(0.95).z)]}>
        <planeGeometry args={[TRACK_WIDTH * 2, 2]} />
        <meshBasicMaterial color={isDark ? 0xff0000 : 0x000000} />
      </mesh>

      {/* CAR */}
      <group ref={carGroup} scale={CAR_SCALE}>
        <group scale={3.5} position={[0, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
           <primitive object={clonedFerrari} />
        </group>

        {/* Headlights */}
        <sprite ref={leftHeadlight} position={[2, 1, 12]} scale={[6, 6, 1]}>
          <spriteMaterial map={glowTex ? glowTex : undefined} color={0xffffff} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </sprite>
        <sprite ref={rightHeadlight} position={[-2, 1, 12]} scale={[6, 6, 1]}>
          <spriteMaterial map={glowTex ? glowTex : undefined} color={0xffffff} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
    </>
  );
}

function AboutCarScene() {
  const { scene: ferrariScene } = useGLTF('/models/ferrari/scene.gltf');
  const clonedFerrari = useMemo(() => ferrariScene.clone(), [ferrariScene]);
  const group = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (group.current) {
      // Calculate scroll progress (0 to 1)
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
      
      // Car drives diagonally from far top-right to close bottom-left
      // Starts at Z=-50, X=30
      // Ends at Z=20, X=-20
      const targetZ = THREE.MathUtils.lerp(-40, 20, scrollProgress);
      const targetX = THREE.MathUtils.lerp(30, -20, scrollProgress);
      
      // Face towards bottom left
      const targetRotY = Math.atan2(-20 - 30, 20 - -40) - Math.PI / 2; // points the nose to the travel direction
      
      // Scale up as it gets closer (perspective handles most of it, but we can exaggerate)
      const dynamicScale = THREE.MathUtils.lerp(1, 3, scrollProgress);

      group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, targetZ, 0.1);
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, targetX, 0.1);
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetRotY, 0.1);
      group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, dynamicScale, 0.1));
      
      // Gentle hover effect
      group.current.position.y = Math.sin(Date.now() * 0.002) * 0.2;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} color={0xffffff} />
      <pointLight position={[-10, 5, -10]} intensity={2} color={0xff0000} />
      <group ref={group} scale={2}>
        <primitive object={clonedFerrari} />
      </group>
    </>
  );
}

export default function GlobalF1Car() {
  const pathname = usePathname();
  
  if (pathname === '/') {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "none", opacity: 0.85 }}>
        <Canvas 
          shadows 
          gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
          camera={{ position: [0, 200, 0], zoom: 3 }} 
          orthographic
        >
          <Bounds fit clip observe margin={1.2}>
            <TrackScene />
          </Bounds>
        </Canvas>
      </div>
    );
  }

  if (pathname === '/about' || pathname === '/about/') {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "none", opacity: 0.6 }}>
        <Canvas camera={{ position: [10, 5, 10], fov: 45 }}>
          <AboutCarScene />
        </Canvas>
      </div>
    );
  }

  // Rest of the pages: F1 theme in bg (via global CSS), no animation and models
  return null;
}
