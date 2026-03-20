import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Rich color palettes
const DARK_COLORS = ['#00ffff', '#8a2be2', '#00eeff', '#bf00ff', '#7b2fff', '#00cfff'];
const LIGHT_COLORS = [
    '#1d4ed8', // dark blue
    '#4338ca', // dark indigo
    '#7c3aed', // dark violet
    '#be185d', // dark pink
    '#b45309', // dark amber
    '#047857', // dark emerald
    '#0e7490', // dark cyan
    '#b91c1c', // dark red
    '#6d28d9', // deep purple
    '#0f766e', // dark teal
    '#1e40af', // navy blue
    '#9d174d', // dark rose
];

const ParticleSwarm = ({ count, theme }: { count: number, theme: 'light' | 'dark' }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const mouse = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleInteraction = (x: number, y: number) => {
            mouse.current.x = (x / window.innerWidth) * 2 - 1;
            mouse.current.y = -(y / window.innerHeight) * 2 + 1;
        };

        const onMouseMove = (e: MouseEvent) => handleInteraction(e.clientX, e.clientY);
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove, { passive: true });

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
        };
    }, []);

    const particles = useMemo(() => {
        const p = [];
        for (let i = 0; i < count; i++) {
            p.push({
                x: (Math.random() - 0.5) * 50,
                y: (Math.random() - 0.5) * 50,
                z: (Math.random() - 0.5) * 40,
                speed: Math.random() * 0.035 + 0.005,
            });
        }
        return p;
    }, [count]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    const colors = useMemo(() => {
        const floatArray = new Float32Array(count * 3);
        const color = new THREE.Color();
        const palette = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
        for (let i = 0; i < count; i++) {
            const pick = palette[Math.floor(Math.random() * palette.length)];
            color.setStyle(pick);
            color.toArray(floatArray, i * 3);
        }
        return floatArray;
    }, [count, theme]);

    useFrame(() => {
        const mesh = meshRef.current;
        if (!mesh) return;

        const targetX = mouse.current.x * 2;
        const targetY = mouse.current.y * 2;

        for (let i = 0; i < count; i++) {
            const p = particles[i];
            p.y += p.speed;
            if (p.y > 25) p.y = -25;

            dummy.position.set(
                p.x + targetX * (p.z / 10),
                p.y + targetY * (p.z / 10),
                p.z
            );

            const scale = Math.max(0.1, (p.z + 20) / 40);
            dummy.scale.set(scale, scale, scale);

            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[0.1, 8, 8]}>
                <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
            </sphereGeometry>
            <meshBasicMaterial
                vertexColors={true}
                transparent={true}
                opacity={theme === 'dark' ? 0.85 : 0.75}
                blending={theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending}
                depthWrite={false}
            />
        </instancedMesh>
    );
};

export default function ParticleBackground({ theme = 'dark' }: { theme?: 'light' | 'dark' }) {
    const [particleCount, setParticleCount] = useState(2500);

    useEffect(() => {
        const updateCount = () => {
            const width = window.innerWidth;
            const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const isLowEnd = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

            if (isReducedMotion) {
                setParticleCount(400);
            } else if (width < 768) {
                setParticleCount(1500);
            } else if (isLowEnd) {
                setParticleCount(2200);
            } else {
                setParticleCount(3500); // Rich desktop experience
            }
        };

        updateCount();
        window.addEventListener('resize', updateCount);
        return () => window.removeEventListener('resize', updateCount);
    }, []);

    return (
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden bg-transparent">
            <Canvas
                camera={{ position: [0, 0, 10], fov: 65 }}
                gl={{
                    alpha: true,
                    antialias: true,
                    powerPreference: 'high-performance',
                    stencil: false,
                    depth: false
                }}
                dpr={[1, 2]}
            >
                <ParticleSwarm count={particleCount} theme={theme} />
            </Canvas>
        </div>
    );
}
