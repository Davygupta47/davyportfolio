"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Sparkles, ContactShadows, Environment } from '@react-three/drei';
import { usePathname } from 'next/navigation';
import * as THREE from 'three';

// Preload the model
useGLTF.preload('/models/ferrari/scene.gltf');

function F1Scene() {
  const { scene } = useGLTF('/models/ferrari/scene.gltf');
  const pathname = usePathname();
  
  const group = useRef<THREE.Group>(null);
  const prevPosition = useRef(new THREE.Vector3());
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDrifting, setIsDrifting] = useState(false);

  // Track window scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
      setScrollProgress(Math.min(1, Math.max(0, scrollY / maxScroll)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // init
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]); // re-bind if body height changes on route

  // Trigger smoke effect on route change (like a hard drift into the page)
  useEffect(() => {
    if (pathname === '/' || pathname === '/about') {
      setIsDrifting(true);
      const timeout = setTimeout(() => setIsDrifting(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [pathname]);

  useFrame((state, delta) => {
    if (!group.current) return;
    
    let targetPos = new THREE.Vector3(0, -1, 0);
    let targetRot = new THREE.Euler(0, 0, 0);
    let targetScale = 0; // default to hidden (scale 0)

    // Visibility logic
    if (pathname === '/') {
      targetPos.set(0, -1, 0);
      targetRot.set(0, Math.PI / 4, 0);
      targetScale = 1.5;
    } else if (pathname === '/about') {
      // Scroll-based path mapping (Top Right -> Bottom Left driving)
      // At scroll 0: x = 4, z = -3 (Back right)
      // At scroll 1: x = -4, z = 1 (Front left)
      const x = THREE.MathUtils.lerp(4, -4, scrollProgress);
      const z = THREE.MathUtils.lerp(-3, 1, scrollProgress);
      
      targetPos.set(x, -1.2, z);
      
      // Angle the car so it points along its path of travel
      // Math.atan2 gives the angle. DX = -8, DZ = 4.
      targetRot.set(0, Math.atan2(-8, 4), 0);
      targetScale = 1.2;
    } else {
      // Hide on other pages by sinking it or scaling it down
      targetPos.set(0, -5, -10);
      targetScale = 0;
    }

    // 1. Smooth lerping for Position and Scale
    group.current.position.lerp(targetPos, 3 * delta);
    group.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 4 * delta);

    // 2. Realistic Physics (Banking/Tilt based on velocity)
    const velocity = new THREE.Vector3().subVectors(group.current.position, prevPosition.current);
    prevPosition.current.copy(group.current.position);

    // If moving left (negative x velocity), tilt right (positive z rotation)
    const targetBank = THREE.MathUtils.clamp(-velocity.x * 2, -Math.PI / 6, Math.PI / 6);
    targetRot.z = targetBank; 

    // Apply pitch based on forward/backward acceleration
    const targetPitch = THREE.MathUtils.clamp(-velocity.z * 2, -Math.PI / 12, Math.PI / 12);
    targetRot.x = targetPitch;

    // 3. Smooth slerping for Rotation
    const currentQuat = group.current.quaternion;
    const targetQuat = new THREE.Quaternion().setFromEuler(targetRot);
    currentQuat.slerp(targetQuat, 3.5 * delta);

    // Continuous subtle hover (only when visible to save math)
    if (targetScale > 0) {
      group.current.position.y += Math.sin(state.clock.elapsedTime * 3) * 0.003;
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[-10, 5, -10]} intensity={2.5} color="#ff0000" />
      <pointLight position={[0, 2, -2]} intensity={1} color="#ffffff" />
      
      <group ref={group} dispose={null}>
        <primitive object={scene} />

        {/* Realistic Dual-Tire Smoke Effects */}
        {isDrifting && (
          <>
            {/* Left Rear Tire Smoke */}
            <group position={[0.8, 0.2, -1.8]}>
              <Sparkles count={100} scale={[1.5, 1, 2]} size={30} speed={0.4} opacity={0.4} color="#aaaaaa" noise={2} />
            </group>
            {/* Right Rear Tire Smoke */}
            <group position={[-0.8, 0.2, -1.8]}>
              <Sparkles count={100} scale={[1.5, 1, 2]} size={30} speed={0.4} opacity={0.4} color="#aaaaaa" noise={2} />
            </group>
            {/* Main turbulent smoke wake */}
            <group position={[0, 0.5, -2.5]}>
              <Sparkles count={150} scale={[3, 2, 4]} size={40} speed={0.6} opacity={0.2} color="#cccccc" noise={3} />
            </group>
          </>
        )}
      </group>

      {pathname === '/' || pathname === '/about' ? (
        <ContactShadows position={[0, -1, 0]} opacity={0.7} scale={20} blur={2.5} far={4} />
      ) : null}
      
      <Environment preset="city" />
    </>
  );
}

export default function GlobalF1Car() {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "none" }}>
      <Canvas camera={{ position: [4, 2, 5], fov: 45 }}>
        <F1Scene />
      </Canvas>
    </div>
  );
}
