"use client";

import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

useGLTF.preload("/models/ferrari/scene.gltf");

function CarModel() {
  const { scene } = useGLTF("/models/ferrari/scene.gltf");

  useFrame((state, delta) => {
    // Traverse the scene to find wheels and spin them
    scene.traverse((child) => {
      if (child.name.toLowerCase().includes("wheel") || child.name.toLowerCase().includes("tire")) {
        child.rotation.x -= delta * 15;
      }
    });
  });

  return (
    <group scale={2.5} position={[0, -0.5, 0]}>
      <primitive object={scene} />
    </group>
  );
}

export default function InlineF1Car() {
  return (
    <div
      style={{
        width: "100%",
        height: "clamp(280px, 45vh, 450px)",
        position: "relative",
        margin: "1.5rem 0",
        cursor: "grab",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid var(--neutral-alpha-medium)",
        borderRadius: "24px",
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [6, 3, 6], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        <ambientLight intensity={0.6} />
        {/* 3 point lighting setup for showroom look */}
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <spotLight
          position={[-10, 10, -10]}
          intensity={2.5}
          color="#00f3ff"
          angle={0.5}
          penumbra={1}
        />
        <pointLight position={[0, 2, 5]} intensity={1.5} color="#ff007f" distance={20} />

        <CarModel />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={1.5}
          makeDefault
        />

        <ContactShadows
          position={[0, -1.5, 0]}
          opacity={0.8}
          scale={15}
          blur={2.5}
          far={4}
          color="#000000"
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
