import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Rig from './Rig'
import Motes from './Motes'
import DragOrbit from './DragOrbit'
import { clamp, damp, LOW_END, PALETTE } from './palette'

/** Cangkang icosahedron yang "membuka" saat pointer mendekat. */
function Shell({ hovered }) {
  const ref = useRef(null)

  useFrame((three, dt) => {
    const mesh = ref.current
    if (!mesh) return
    const step = Math.min(dt, 0.05)
    const target = hovered ? 1.28 : 1
    const s = damp(mesh.scale.x, target, 5, step)
    mesh.scale.setScalar(s)
    mesh.material.opacity = damp(mesh.material.opacity, hovered ? 0.16 : 0.4, 5, step)
    mesh.rotation.y += step * 0.12
    mesh.rotation.x -= step * 0.05
  })

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.55, 1]} />
      <meshStandardMaterial
        color={PALETTE.surface}
        emissive={PALETTE.edge}
        emissiveIntensity={0.35}
        metalness={0.85}
        roughness={0.28}
        transparent
        opacity={0.4}
        flatShading
        wireframe
      />
    </mesh>
  )
}

/** Inti kristal: bereaksi pada hover dan berdenyut halus. */
function Core({ hovered }) {
  const ref = useRef(null)

  useFrame((three, dt) => {
    const mesh = ref.current
    if (!mesh) return
    const step = Math.min(dt, 0.05)
    const t = three.clock.elapsedTime
    const pulse = 1 + Math.sin(t * 1.25) * 0.035

    mesh.rotation.y += step * (hovered ? 0.55 : 0.22)
    mesh.rotation.z = Math.sin(t * 0.4) * 0.12
    mesh.scale.setScalar(damp(mesh.scale.x, pulse * (hovered ? 1.08 : 1), 6, step))
    mesh.material.emissiveIntensity = damp(
      mesh.material.emissiveIntensity,
      hovered ? 1.5 : 0.75,
      5,
      step
    )
  })

  return (
    <mesh ref={ref} castShadow>
      <octahedronGeometry args={[0.95, 0]} />
      <meshStandardMaterial
        color={PALETTE.surfaceLight}
        emissive={PALETTE.accent}
        emissiveIntensity={0.75}
        metalness={0.92}
        roughness={0.16}
        flatShading
      />
    </mesh>
  )
}

/** Cincin orbit tetrahedron di sekeliling inti. */
function Orbit({ radius, speed, tilt, count, color }) {
  const ref = useRef(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((three, dt) => {
    const mesh = ref.current
    if (!mesh) return
    const t = three.clock.elapsedTime
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2 + t * speed
      dummy.position.set(Math.cos(a) * radius, Math.sin(a * 2) * 0.18, Math.sin(a) * radius)
      dummy.rotation.set(a * 1.4, a, 0)
      dummy.scale.setScalar(0.1 + (i % 3) * 0.028)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group rotation={tilt}>
      <instancedMesh ref={ref} args={[undefined, undefined, count]}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={PALETTE.surfaceLight}
          emissive={color}
          emissiveIntensity={1.1}
          metalness={0.7}
          roughness={0.3}
          flatShading
          toneMapped={false}
        />
      </instancedMesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.006, radius + 0.006, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/**
 * Scene hero: drag untuk memutar, hover untuk membuka cangkang.
 * Rotasi juga sedikit mengikuti progres scroll supaya terasa menyatu.
 */
export default function HeroCrystal({ scrollRef }) {
  const group = useRef(null)
  const [hovered, setHovered] = useState(false)

  useFrame((three, dt) => {
    const g = group.current
    if (!g) return
    const step = Math.min(dt, 0.05)
    const progress = scrollRef?.current ?? 0
    g.position.y = damp(g.position.y, clamp(-progress * 1.6, -1.6, 0), 3, step)
    g.rotation.x = damp(g.rotation.x, progress * 0.35, 3, step)
  })

  return (
    <>
      <fog attach="fog" args={[PALETTE.fog, 5, 16]} />
      <Rig />

      <DragOrbit autoSpin={0.1} maxPitch={0.55}>
        <group
          ref={group}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
          }}
          onPointerOut={() => setHovered(false)}
        >
          <Core hovered={hovered} />
          <Shell hovered={hovered} />
          <Orbit radius={2.1} speed={0.36} tilt={[0.35, 0, 0.18]} count={LOW_END ? 8 : 14} color={PALETTE.accent} />
          <Orbit radius={2.75} speed={-0.24} tilt={[-0.5, 0.3, -0.2]} count={LOW_END ? 6 : 10} color={PALETTE.amber} />
        </group>
      </DragOrbit>

      <Motes count={LOW_END ? 40 : 90} radius={6} />
    </>
  )
}
