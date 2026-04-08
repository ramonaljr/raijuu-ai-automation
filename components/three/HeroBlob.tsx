"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Environment, Float } from "@react-three/drei";
import type { Mesh } from "three";

function DistortedToroid() {
  const meshRef = useRef<Mesh>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(elapsed.current * 0.2) * 0.3;
      meshRef.current.rotation.y = elapsed.current * 0.15;
      meshRef.current.rotation.z = Math.cos(elapsed.current * 0.1) * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} scale={2.2}>
        <torusGeometry args={[1, 0.45, 64, 128]} />
        <MeshDistortMaterial
          color="#1a1a1a"
          metalness={0.9}
          roughness={0.15}
          distort={0.3}
          speed={1.5}
          envMapIntensity={1.2}
        />
      </mesh>
    </Float>
  );
}

export default function HeroBlob() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        {/* Solid dark background on the Three.js scene itself — no alpha flicker */}
        <color attach="background" args={["#0a0a0a"]} />

        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[-5, -5, 5]} intensity={0.4} color="#4d65ff" />
        <pointLight position={[5, -3, -5]} intensity={0.3} color="#c084fc" />

        <DistortedToroid />

        {/* Suspense boundary for the async HDR environment map fetch */}
        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
