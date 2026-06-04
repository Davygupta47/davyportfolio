"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Sparkles, Float, ContactShadows, Environment } from '@react-three/drei';
import { usePathname } from 'next/navigation';
import * as THREE from 'three';

// Preload the model
useGLTF.preload('/models/ferrari/scene.gltf');

export default function GlobalF1Car() {
  const { scene } = useGLTF('/models/ferrari/scene.gltf');
  const pathname = usePathname();
  
  const group = useRef<THREE.Group>(null);
  
  // Targets based on routes
  const targets = {
    '/': {
      position: new THREE.Vector3(0, -1, 0),
      rotation: new THREE.Euler(0, Math.PI / 4, 0),
      scale: 1.5,
    },
    '/work': {
      position: new THREE.Vector3(4, -1.5, -3),
      rotation: new THREE.Euler(0, -Math.PI / 6, 0),
      scale: 1.0,
    },
    '/explore': {
      position: new THREE.Vector3(-4, -1, -2),
      rotation: new THREE.Euler(0, Math.PI / 2, 0),
      scale: 1.2,
    },
    default: {
      position: new THREE.Vector3(0, -1, -5),
      rotation: new THREE.Euler(0, 0, 0),
      scale: 1.0,
    }
  };

  const getTarget = () => {
    return targets[pathname as keyof typeof targets] || targets.default;
  };

  const [isDrifting, setIsDrifting] = useState(false);

  // Trigger smoke/drift effect on route change
  useEffect(() => {
    setIsDrifting(true);
    const timeout = setTimeout(() => setIsDrifting(false), 1500);
    return () => clearTimeout(timeout);
  }, [pathname]);

  useFrame((state, delta) => {
    if (!group.current) return;
    
    const target = getTarget();
    
    // Smooth lerping for position
    group.current.position.lerp(target.position, 2.5 * delta);
    
    // Smooth slerping for rotation (quaternions are better for rotation interpolation)
    const currentQuat = group.current.quaternion;
    const targetQuat = new THREE.Quaternion().setFromEuler(target.rotation);
    currentQuat.slerp(targetQuat, 2.5 * delta);
    
    // Smooth lerping for scale
    group.current.scale.lerp(new THREE.Vector3(target.scale, target.scale, target.scale), 2.5 * delta);

    // Continuous subtle hover and floating
    group.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.002;
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[-10, 5, -10]} intensity={2} color="#ff0000" />
      
      <group ref={group} dispose={null}>
        {/* The Realistic Ferrari Model */}
        <primitive object={scene} />

        {/* Smoke Effects when drifting */}
        {isDrifting && (
          <group position={[0, 0.5, -2]}>
            <Sparkles 
              count={200} 
              scale={[3, 1, 3]} 
              size={20} 
              speed={0.8} 
              opacity={0.6} 
              color="#ffffff" 
              noise={1}
            />
          </group>
        )}
      </group>

      <ContactShadows position={[0, -1, 0]} opacity={0.6} scale={15} blur={2} far={4} />
      <Environment preset="city" />
    </>
  );
}
