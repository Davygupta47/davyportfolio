"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, ContactShadows, Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// A programmatic F1 car built from Three.js primitives
function StyledF1Car() {
  const group = useRef<THREE.Group>(null);

  // Materials
  const materials = useMemo(
    () => ({
      body: new THREE.MeshPhysicalMaterial({
        color: "#ff0000", // Ferrari Red
        metalness: 0.6,
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      }),
      carbon: new THREE.MeshPhysicalMaterial({
        color: "#111111",
        metalness: 0.8,
        roughness: 0.4,
        clearcoat: 0.3,
      }),
      tire: new THREE.MeshStandardMaterial({
        color: "#1a1a1a",
        roughness: 0.9,
        metalness: 0.1,
      }),
      rim: new THREE.MeshStandardMaterial({
        color: "#333333",
        roughness: 0.4,
        metalness: 0.8,
      }),
      visor: new THREE.MeshPhysicalMaterial({
        color: "#000000",
        metalness: 0.9,
        roughness: 0.1,
        transmission: 0.5,
        ior: 1.5,
      }),
    }),
    [],
  );

  // Animation: Rotate wheels and slightly rock the chassis
  useFrame((state) => {
    if (group.current) {
      // Slowly rotate the entire car for display
      group.current.rotation.y += 0.005;

      // Subtle hovering/suspension effect
      group.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  return (
    <group ref={group} scale={0.5} position={[0, -0.5, 0]}>
      {/* Chassis - Main Body */}
      <mesh material={materials.body} position={[0, 0.4, 0]}>
        <boxGeometry args={[0.6, 0.4, 3.2]} />
      </mesh>

      {/* Nose Cone */}
      <mesh material={materials.body} position={[0, 0.3, 2.1]}>
        <cylinderGeometry args={[0.2, 0.4, 1.2, 4]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>

      {/* Front Wing */}
      <mesh material={materials.carbon} position={[0, 0.15, 2.5]}>
        <boxGeometry args={[1.8, 0.05, 0.4]} />
      </mesh>
      <mesh material={materials.carbon} position={[0, 0.25, 2.6]}>
        <boxGeometry args={[1.6, 0.05, 0.3]} />
      </mesh>

      {/* Sidepods */}
      <mesh material={materials.body} position={[0.5, 0.4, -0.2]}>
        <boxGeometry args={[0.4, 0.4, 1.5]} />
      </mesh>
      <mesh material={materials.body} position={[-0.5, 0.4, -0.2]}>
        <boxGeometry args={[0.4, 0.4, 1.5]} />
      </mesh>

      {/* Airbox (above driver) */}
      <mesh material={materials.carbon} position={[0, 0.8, -0.5]}>
        <boxGeometry args={[0.3, 0.4, 0.8]} />
      </mesh>

      {/* Rear Wing */}
      <group position={[0, 0.7, -1.6]}>
        <mesh material={materials.carbon} position={[0, 0, 0]}>
          <boxGeometry args={[1.6, 0.05, 0.4]} />
        </mesh>
        <mesh material={materials.carbon} position={[0, -0.2, 0]}>
          <boxGeometry args={[1.6, 0.05, 0.4]} />
        </mesh>
        {/* Endplates */}
        <mesh material={materials.carbon} position={[0.78, -0.1, 0]}>
          <boxGeometry args={[0.04, 0.6, 0.5]} />
        </mesh>
        <mesh material={materials.carbon} position={[-0.78, -0.1, 0]}>
          <boxGeometry args={[0.04, 0.6, 0.5]} />
        </mesh>
      </group>

      {/* Driver Helmet */}
      <mesh material={materials.visor} position={[0, 0.65, 0.2]}>
        <sphereGeometry args={[0.15, 32, 32]} />
      </mesh>

      {/* Wheels */}
      {/* Front Left */}
      <group position={[0.9, 0.3, 1.5]}>
        <mesh material={materials.tire} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.35, 32]} />
        </mesh>
        <mesh material={materials.rim} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.36, 16]} />
        </mesh>
      </group>

      {/* Front Right */}
      <group position={[-0.9, 0.3, 1.5]}>
        <mesh material={materials.tire} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.35, 32]} />
        </mesh>
        <mesh material={materials.rim} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.36, 16]} />
        </mesh>
      </group>

      {/* Rear Left */}
      <group position={[0.9, 0.35, -1.2]}>
        <mesh material={materials.tire} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 0.45, 32]} />
        </mesh>
        <mesh material={materials.rim} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.46, 16]} />
        </mesh>
      </group>

      {/* Rear Right */}
      <group position={[-0.9, 0.35, -1.2]}>
        <mesh material={materials.tire} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 0.45, 32]} />
        </mesh>
        <mesh material={materials.rim} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.46, 16]} />
        </mesh>
      </group>
    </group>
  );
}

export default function F1CarCanvas() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Canvas camera={{ position: [4, 2, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-10, 5, -10]} intensity={2} color="#ff0000" />

        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
          <StyledF1Car />
        </Float>

        <ContactShadows position={[0, -0.5, 0]} opacity={0.6} scale={10} blur={2} far={4} />

        <Environment preset="city" />
        {/* We enable OrbitControls but disable zoom/pan for a hero background, just rotate if user interacts */}
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
      </Canvas>
    </div>
  );
}
