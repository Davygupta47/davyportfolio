"use client";

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, OrbitControls } from '@react-three/drei';

// Preload the model
useGLTF.preload('/models/ferrari/scene.gltf');

function CarModel() {
  const { scene } = useGLTF('/models/ferrari/scene.gltf');
  return (
    <group scale={2.5} position={[0, -0.5, 0]}>
      {/* We use the GLTF scene directly */}
      <primitive object={scene} />
    </group>
  );
}

export default function InlineF1Car() {
  return (
    <div style={{ width: '100%', height: '450px', position: 'relative', margin: '2rem 0', cursor: 'grab' }}>
      <Canvas camera={{ position: [6, 3, 6], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <pointLight position={[-10, 5, -10]} intensity={2} color="#ff0000" />
        <pointLight position={[0, 2, -2]} intensity={1} color="#ffffff" />
        
        <CarModel />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={1.5} 
          makeDefault
        />
        
        <ContactShadows position={[0, -1.5, 0]} opacity={0.7} scale={15} blur={2.5} far={4} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
