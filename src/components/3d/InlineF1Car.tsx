"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Preload the model
useGLTF.preload('/models/ferrari/scene.gltf');

function RotatingCar() {
  const { scene } = useGLTF('/models/ferrari/scene.gltf');
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (group.current) {
      // Slowly rotate the car
      group.current.rotation.y += delta * 0.5;
      // Gentle hover effect
      group.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1 - 0.5;
    }
  });

  return (
    <group ref={group} dispose={null} scale={1.5}>
      <primitive object={scene} />
    </group>
  );
}

export default function InlineF1Car() {
  return (
    <div style={{ width: '100%', height: '300px', position: 'relative', margin: '2rem 0' }}>
      <Canvas camera={{ position: [5, 3, 5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <pointLight position={[-10, 5, -10]} intensity={2} color="#ff0000" />
        <pointLight position={[0, 2, -2]} intensity={1} color="#ffffff" />
        
        <RotatingCar />
        
        <ContactShadows position={[0, -1, 0]} opacity={0.7} scale={10} blur={2.5} far={4} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
