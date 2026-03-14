import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ParticleSwarm = () => {
    const count = 1800; // Requested amount of particles
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const mouse = useRef({ x: 0, y: 0 });

    // Track mouse globally for parallax even when hovering the UI z-index 20
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const particles = useMemo(() => {
        const p = [];
        for (let i = 0; i < count; i++) {
            p.push({
                x: (Math.random() - 0.5) * 40,
                y: (Math.random() - 0.5) * 40,
                z: (Math.random() - 0.5) * 40,
                speed: Math.random() * 0.05 + 0.01,
            });
        }
        return p;
    }, [count]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    const colors = useMemo(() => {
        const floatArray = new Float32Array(count * 3);
        const color = new THREE.Color();
        for (let i = 0; i < count; i++) {
            // Dual-tone bioluminescent: Cyan (#00ffff) and Electric Purple (#8a2be2)
            const isCyan = Math.random() > 0.5;
            color.setStyle(isCyan ? '#00ffff' : '#8a2be2');
            color.toArray(floatArray, i * 3);
        }
        return floatArray;
    }, [count]);

    useFrame(() => {
        const mesh = meshRef.current;
        if (!mesh) return;

        const targetX = mouse.current.x * 2;
        const targetY = mouse.current.y * 2;

        particles.forEach((p, i) => {
            p.y += p.speed;
            // Loop particles from top
            if (p.y > 20) p.y = -20;

            // Apply parallax effect with mouse
            dummy.position.set(
                p.x + targetX * (p.z / 10),
                p.y + targetY * (p.z / 10),
                p.z
            );

            // Dynamic scaling for depth perspective
            const scale = Math.max(0.1, (p.z + 20) / 40);
            dummy.scale.set(scale, scale, scale);

            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        });

        mesh.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[0.08, 16, 16]}>
                <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
            </sphereGeometry>
            <meshBasicMaterial
                vertexColors={true}
                transparent={true}
                opacity={0.8}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </instancedMesh>
    );
};

export default function ParticleBackground() {
    return (
        <div className="absolute inset-0 z-[1] pointer-events-none">
            <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
                <ambientLight intensity={0.5} />
                <ParticleSwarm />
            </Canvas>
        </div>
    );
}
