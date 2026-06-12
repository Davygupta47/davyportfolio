"use client";

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { usePathname } from 'next/navigation';
import * as THREE from 'three';

const CONFIG = {
  lapDurationSeconds: 15,
  trackWidth: 4,
  carScale: 0.8,
};

// Textures
function useTrackTextures() {
  return useMemo(() => {
    // Asphalt
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#1a1a1a';
    context.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      context.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
      context.fillRect(x, y, 2, 2);
    }
    for (let i = 0; i < 20; i++) {
      context.beginPath();
      context.moveTo(Math.random() * 512, 0);
      context.lineTo(Math.random() * 512, 512);
      context.strokeStyle = 'rgba(0,0,0,0.15)';
      context.lineWidth = Math.random() * 10 + 5;
      context.stroke();
    }
    const asphaltTexture = new THREE.CanvasTexture(canvas);
    asphaltTexture.wrapS = THREE.RepeatWrapping;
    asphaltTexture.wrapT = THREE.RepeatWrapping;
    asphaltTexture.repeat.set(10, 1);

    // Start Line
    const canvas2 = document.createElement('canvas');
    canvas2.width = 256;
    canvas2.height = 256;
    const ctx2 = canvas2.getContext('2d')!;
    const size = 32;
    for(let y=0; y<256; y+=size) {
      for(let x=0; x<256; x+=size) {
        ctx2.fillStyle = ((x/size + y/size) % 2 === 0) ? '#ffffff' : '#1a1a1a';
        ctx2.fillRect(x, y, size, size);
      }
    }
    const startLineTexture = new THREE.CanvasTexture(canvas2);

    // Headlight Glow
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 64; glowCanvas.height = 64;
    const ctx = glowCanvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,64,64);
    const glowTexture = new THREE.CanvasTexture(glowCanvas);

    return { asphaltTexture, startLineTexture, glowTexture };
  }, []);
}

function RedBullF1CarMesh({ headlightsRef, rearWheelsRef }: any) {
  const { glowTexture } = useTrackTextures();
  return (
    <>
      {/* Main Chassis - Red Bull Dark Navy Blue */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[3, 1.5, 12]} />
        <meshStandardMaterial color={0x0b1326} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Nose Cone - Red Bull Matte Yellow */}
      <mesh position={[0, 1, 9]} rotation={[Math.PI / 2, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[0.5, 1.5, 6, 4]} />
        <meshStandardMaterial color={0xFCD116} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Sidepods - Red Bull Dark Navy Blue */}
      <mesh position={[0, 0.8, -1]} castShadow>
        <boxGeometry args={[5.5, 1.2, 7]} />
        <meshStandardMaterial color={0x0b1326} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Sidepod Trim / Accent Line - Red Bull Red */}
      <mesh position={[0, 1.4, -1]}>
        <boxGeometry args={[5.6, 0.2, 7]} />
        <meshStandardMaterial color={0xE10600} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Front Wing Spoiler - Dark Gray */}
      <mesh position={[0, 0.5, 11]} castShadow>
        <boxGeometry args={[6.5, 0.2, 1.5]} />
        <meshStandardMaterial color={0x151515} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Rear Wing Foil - Red Bull Red */}
      <mesh position={[0, 2.5, -5.5]} castShadow>
        <boxGeometry args={[5, 0.2, 1.5]} />
        <meshStandardMaterial color={0xE10600} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Engine Intake Vertical Support - Dark Blue */}
      <mesh position={[0, 1.5, -5.5]}>
        <boxGeometry args={[1.5, 2, 1]} />
        <meshStandardMaterial color={0x0b1326} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Cockpit Camera Pod - Red Bull Yellow */}
      <mesh position={[0, 2.3, 0]}>
        <boxGeometry args={[0.6, 0.4, 1]} />
        <meshStandardMaterial color={0xFCD116} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Rear Wheels */}
      <mesh position={[3.5, 1.4, -4]} rotation={[0, 0, Math.PI / 2]} castShadow ref={(el) => { if(el && rearWheelsRef) rearWheelsRef.current[0] = el; }}>
        <cylinderGeometry args={[1.4, 1.4, 1.8, 16]} />
        <meshStandardMaterial color={0x151515} roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[-3.5, 1.4, -4]} rotation={[0, 0, Math.PI / 2]} castShadow ref={(el) => { if(el && rearWheelsRef) rearWheelsRef.current[1] = el; }}>
        <cylinderGeometry args={[1.4, 1.4, 1.8, 16]} />
        <meshStandardMaterial color={0x151515} roughness={0.9} metalness={0} />
      </mesh>

      {/* Front Wheels */}
      <mesh position={[3.2, 1.2, 7]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[1.2, 1.2, 1.5, 16]} />
        <meshStandardMaterial color={0x151515} roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[-3.2, 1.2, 7]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[1.2, 1.2, 1.5, 16]} />
        <meshStandardMaterial color={0x151515} roughness={0.9} metalness={0} />
      </mesh>

      {/* Headlight Sprite Glows */}
      <sprite position={[2, 1, 12]} scale={[6, 6, 1]} ref={(el) => { if(el && headlightsRef) headlightsRef.current[0] = el; }}>
        <spriteMaterial map={glowTexture} color={0xffffff} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite position={[-2, 1, 12]} scale={[6, 6, 1]} ref={(el) => { if(el && headlightsRef) headlightsRef.current[1] = el; }}>
        <spriteMaterial map={glowTexture} color={0xffffff} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </sprite>
    </>
  );
}

function ParticleTrail({ targetRef }: { targetRef: React.RefObject<THREE.Group | null> }) {
  const count = 40;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particles = useMemo(() => Array.from({ length: count }, () => ({ pos: new THREE.Vector3(), age: 1000 })), []);
  
  useFrame((state, delta) => {
    if (!meshRef.current || !targetRef.current) return;
    const dummy = new THREE.Object3D();
    let spawned = false;
    
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      p.age += delta;
      
      if (!spawned && p.age > 0.4) {
        // Find local rear of the car
        const backOffset = new THREE.Vector3(0, 0.2, -6).applyMatrix4(targetRef.current.matrixWorld);
        p.pos.copy(backOffset);
        p.pos.x += (Math.random() - 0.5) * 4;
        p.pos.z += (Math.random() - 0.5) * 4;
        p.age = 0;
        spawned = true;
      }
      
      if (p.age < 0.4) {
        const scale = 1 - (p.age / 0.4);
        dummy.position.copy(p.pos);
        dummy.scale.set(scale * 1.5, scale * 1.5, scale * 1.5);
        dummy.position.y += delta * 3;
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.scale.set(0,0,0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.5, 8, 8]} />
      <meshBasicMaterial color={0xdddddd} transparent opacity={0.15} blending={THREE.AdditiveBlending} />
    </instancedMesh>
  );
}

function MercedesF1TrackCar({ trackCurve }: { trackCurve: THREE.CatmullRomCurve3 }) {
  const carGroupRef = useRef<THREE.Group>(null);
  const rearWheelsRef = useRef<THREE.Mesh[]>([]);
  const headlightsRef = useRef<THREE.Sprite[]>([]);
  const prevTangent = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (!carGroupRef.current) return;
    const time = state.clock.getElapsedTime();
    const t = (time % CONFIG.lapDurationSeconds) / CONFIG.lapDurationSeconds;

    const point = trackCurve.getPointAt(t);
    carGroupRef.current.position.copy(point);

    const tangent = trackCurve.getTangentAt(t);
    const yaw = Math.atan2(tangent.x, tangent.z);
    carGroupRef.current.rotation.y = yaw;

    if (prevTangent.current.lengthSq() > 0) {
      const cross = new THREE.Vector3().crossVectors(prevTangent.current, tangent);
      const targetRoll = cross.y * 30;
      carGroupRef.current.rotation.z = THREE.MathUtils.lerp(carGroupRef.current.rotation.z, Math.max(Math.min(targetRoll, 0.15), -0.15), 0.1);
    }
    prevTangent.current.copy(tangent);

    const speed = 15;
    rearWheelsRef.current.forEach(w => {
      if (w) w.rotation.x -= speed * 0.016;
    });

    const pulse = 0.8 + Math.sin(time * 15) * 0.1;
    headlightsRef.current.forEach(hl => {
      if (hl) hl.material.opacity = pulse;
    });
  });

  return (
    <group>
      <group ref={carGroupRef} scale={[CONFIG.carScale, CONFIG.carScale, CONFIG.carScale]}>
        <RedBullF1CarMesh headlightsRef={headlightsRef} rearWheelsRef={rearWheelsRef} />
      </group>
      <ParticleTrail targetRef={carGroupRef} />
    </group>
  );
}

function ResponsiveOrthographicCamera() {
  const { size } = useThree();
  const frustumSize = 120; // Tightened from 300 to show the smaller track better
  const calculatedZoom = Math.max(size.width / frustumSize, 1.5); 
  
  return (
    <OrthographicCamera 
      makeDefault 
      position={[0, 200, 0]} 
      zoom={calculatedZoom} 
    />
  );
}

function TrackScene() {
  const { asphaltTexture, startLineTexture } = useTrackTextures();

  const trackCurve = useMemo(() => {
    // Scaled down by 2.5
    const controlPoints = [
      new THREE.Vector3(-44, 0, 32), new THREE.Vector3(-36, 0, 26), new THREE.Vector3(-28, 0, 20),
      new THREE.Vector3(-24, 0, 18), new THREE.Vector3(-20, 0, 14), new THREE.Vector3(-22, 0, 8),
      new THREE.Vector3(-18, 0, 0), new THREE.Vector3(-10, 0, -10), new THREE.Vector3(2, 0, -20),
      new THREE.Vector3(16, 0, -30), new THREE.Vector3(26, 0, -34), new THREE.Vector3(34, 0, -36),
      new THREE.Vector3(38, 0, -32), new THREE.Vector3(34, 0, -26), new THREE.Vector3(40, 0, -20),
      new THREE.Vector3(46, 0, -16), new THREE.Vector3(50, 0, -10), new THREE.Vector3(50, 0, -2),
      new THREE.Vector3(42, 0, 2), new THREE.Vector3(34, 0, 0), new THREE.Vector3(24, 0, 2),
      new THREE.Vector3(18, 0, 6), new THREE.Vector3(12, 0, 10), new THREE.Vector3(10, 0, 14),
      new THREE.Vector3(16, 0, 18), new THREE.Vector3(22, 0, 20), new THREE.Vector3(30, 0, 18),
      new THREE.Vector3(34, 0, 22), new THREE.Vector3(40, 0, 26), new THREE.Vector3(46, 0, 32),
      new THREE.Vector3(46, 0, 38), new THREE.Vector3(40, 0, 42), new THREE.Vector3(30, 0, 40),
      new THREE.Vector3(16, 0, 34), new THREE.Vector3(6, 0, 28), new THREE.Vector3(-4, 0, 22),
      new THREE.Vector3(-10, 0, 20), new THREE.Vector3(-16, 0, 24), new THREE.Vector3(-22, 0, 28),
      new THREE.Vector3(-32, 0, 30)
    ];
    const curve = new THREE.CatmullRomCurve3(controlPoints, true);
    curve.tension = 0.5;
    return curve;
  }, []);

  const trackGeometry = useMemo(() => {
    const geo = new THREE.TubeGeometry(trackCurve, 200, CONFIG.trackWidth, 8, true);
    geo.scale(1, 0.01, 1);
    return geo;
  }, [trackCurve]);

  const borderGeom = useMemo(() => {
    const geo = new THREE.TubeGeometry(trackCurve, 200, CONFIG.trackWidth + 0.3, 8, true);
    geo.scale(1, 0.005, 1);
    return geo;
  }, [trackCurve]);

  const outerBorderGeom = useMemo(() => {
    const geo = new THREE.TubeGeometry(trackCurve, 200, CONFIG.trackWidth + 0.6, 8, true);
    geo.scale(1, 0.002, 1);
    return geo;
  }, [trackCurve]);

  const infieldGeom = useMemo(() => {
    const points2d = trackCurve.getPoints(100).map(p => new THREE.Vector2(p.x, p.z));
    const shape = new THREE.Shape(points2d);
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [trackCurve]);

  const sfPosition = useMemo(() => trackCurve.getPointAt(0.15), [trackCurve]);
  const sfTangent = useMemo(() => trackCurve.getTangentAt(0.15), [trackCurve]);

  return (
    <>
      <ambientLight intensity={0.3} color={0xffffff} />
      <directionalLight 
        position={[50, 100, 50]} 
        intensity={0.6} 
        color={0xaaaaff} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={10}
        shadow-camera-far={300}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />

      {/* Reflective Ground Plane under track */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={0x030303} roughness={0.1} metalness={0.8} />
      </mesh>

      <mesh geometry={trackGeometry} position={[0, 0.1, 0]} receiveShadow>
        <meshStandardMaterial color={0x1a1a1a} map={asphaltTexture} roughness={0.85} metalness={0.05} />
      </mesh>

      <mesh geometry={borderGeom} position={[0, 0.05, 0]}>
        <meshBasicMaterial color={0xffffff} side={THREE.BackSide} />
      </mesh>

      <mesh geometry={outerBorderGeom} position={[0, 0.02, 0]}>
        <meshBasicMaterial color={0x1a1a1a} side={THREE.BackSide} />
      </mesh>

      <mesh geometry={infieldGeom} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial color={0x1e3a1e} roughness={1} metalness={0} />
      </mesh>

      <mesh 
        position={[sfPosition.x, 0.2, sfPosition.z]} 
        rotation={[-Math.PI / 2, 0, Math.atan2(sfTangent.x, sfTangent.z)]}
      >
        <planeGeometry args={[CONFIG.trackWidth * 2, 3]} />
        <meshBasicMaterial map={startLineTexture} />
      </mesh>

      <MercedesF1TrackCar trackCurve={trackCurve} />
    </>
  );
}

function AboutCarScene() {
  const carGroupRef = useRef<THREE.Group>(null);
  const rearWheelsRef = useRef<THREE.Mesh[]>([]);
  const headlightsRef = useRef<THREE.Sprite[]>([]);
  const scrollOffset = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
      scrollOffset.current = window.scrollY / maxScroll;
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useFrame((state) => {
    if (!carGroupRef.current) return;
    
    // Smooth scroll following
    const t = THREE.MathUtils.lerp(scrollOffset.current, scrollOffset.current, 0.1); 
    
    // Path definition: straight line from back to front with an S-curve horizontally
    const z = -30 + t * 60; // From z=-30 to z=30
    const x = Math.sin(t * Math.PI * 3) * 12; 
    
    const targetPos = new THREE.Vector3(x, 0, z);
    carGroupRef.current.position.lerp(targetPos, 0.1);
    
    // Yaw calculation (derivative of path)
    const dxdt = Math.cos(t * Math.PI * 3) * 12 * Math.PI * 3;
    const dzdt = 60;
    const angle = Math.atan2(dxdt, dzdt);
    
    // Oversteer drift angle based on cornering sharpness
    const driftAngle = Math.sin(t * Math.PI * 3) * 0.4;
    const targetYaw = angle + driftAngle;
    carGroupRef.current.rotation.y = THREE.MathUtils.lerp(carGroupRef.current.rotation.y, targetYaw, 0.05);

    // Spin wheels
    rearWheelsRef.current.forEach(w => {
      if (w) w.rotation.x -= 0.3;
    });

    // Camera dynamic follow
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, x * 0.2, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 15, 0.05);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, z + 25, 0.05);
    state.camera.lookAt(x, 0, z - 10);
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      <pointLight position={[0, 5, 0]} intensity={2} color={0xff0000} distance={20} />

      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={0x050505} roughness={0.15} metalness={0.8} />
      </mesh>
      
      <gridHelper args={[200, 40, 0x222222, 0x111111]} position={[0, -0.04, 0]} />

      <group ref={carGroupRef} scale={[CONFIG.carScale, CONFIG.carScale, CONFIG.carScale]}>
        <RedBullF1CarMesh headlightsRef={headlightsRef} rearWheelsRef={rearWheelsRef} />
      </group>
      <ParticleTrail targetRef={carGroupRef} />
    </>
  );
}

export default function GlobalF1Car() {
  const pathname = usePathname();
  
  if (pathname === '/' || pathname === '/work') {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "none", opacity: 0.85 }}>
        <Canvas shadows gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}>
          <ResponsiveOrthographicCamera />
          <TrackScene />
        </Canvas>
      </div>
    );
  }

  if (pathname === '/about') {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "none", opacity: 0.75 }}>
        <Canvas shadows camera={{ position: [0, 15, 30], fov: 45 }} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}>
          <AboutCarScene />
        </Canvas>
      </div>
    );
  }

  return null;
}
