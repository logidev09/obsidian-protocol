import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Rig from './Rig'
import Motes from './Motes'
import DragOrbit from './DragOrbit'
import { damp, LOW_END, PALETTE, PREFERS_REDUCED } from './palette'

const SHARD_COUNT = LOW_END ? 7 : 11

function Shard({ index, total, active }) {
  const ref = useRef(null)
  const [hot, setHot] = useState(false)

  const config = useMemo(() => {
    const angle = (index / total) * Math.PI * 2
    const radius = 1.55 + (index % 3) * 0.22
    return {
      angle,
      radius,
      y: ((index % 5) - 2) * 0.34,
      size: 0.16 + ((index * 7) % 5) * 0.035,
      speed: 0.16 + (index % 4) * 0.045,
      tilt: (index % 6) * 0.4
    }
  }, [index, total])

  useFrame((three, dt) => {
    const mesh = ref.current
    if (!mesh) return
    const step = Math.min(dt, 0.05)
    const t = three.clock.elapsedTime

    const spread = active ? 1.32 : 1
    const angle = config.angle + (PREFERS_REDUCED ? 0 : t * config.speed)

    mesh.position.x = damp(mesh.position.x, Math.cos(angle) * config.radius * spread, 3, step)
    mesh.position.z = damp(mesh.position.z, Math.sin(angle) * config.radius * spread, 3, step)
    mesh.position.y = damp(mesh.position.y, config.y + Math.sin(t * 0.6 + config.tilt) * 0.12, 3, step)

    mesh.rotation.x += step * 0.35
    mesh.rotation.y += step * 0.22

    const targetScale = hot ? config.size * 1.55 : config.size
    const s = damp(mesh.scale.x, targetScale, 8, step)
    mesh.scale.setScalar(s)

    mesh.material.emissiveIntensity = damp(mesh.material.emissiveIntensity, hot ? 2.1 : 0.55, 6, step)
  })

  return (
    <mesh
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHot(true)
      }}
      onPointerOut={() => setHot(false)}
    >
      <tetrahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={PALETTE.surfaceLight}
        emissive={index % 4 === 0 ? PALETTE.amber : PALETTE.accent}
        emissiveIntensity={0.55}
        metalness={0.72}
        roughness={0.26}
        flatShading
      />
    </mesh>
  )
}

function Core({ active }) {
  const outer = useRef(null)
  const inner = useRef(null)

  useFrame((three, dt) => {
    const step = Math.min(dt, 0.05)
    const t = three.clock.elapsedTime

    if (outer.current) {
      outer.current.rotation.y += step * 0.18
      outer.current.rotation.x = Math.sin(t * 0.3) * 0.12
      const s = damp(outer.current.scale.x, active ? 1.08 : 1, 5, step)
      outer.current.scale.setScalar(s)
    }

    if (inner.current) {
      inner.current.rotation.y -= step * 0.4
      inner.current.rotation.z += step * 0.15
      inner.current.material.emissiveIntensity = damp(
        inner.current.material.emissiveIntensity,
        active ? 2.6 : 1.35,
        5,
        step
      )
    }
  })

  return (
    <group>
      <mesh ref={outer}>
        <icosahedronGeometry args={[1.02, 0]} />
        <meshStandardMaterial
          color={PALETTE.surface}
          metalness={0.86}
          roughness={0.22}
          flatShading
          transparent
          opacity={0.94}
        />
      </mesh>

      <mesh ref={outer === null ? undefined : undefined} scale={1.035}>
        <icosahedronGeometry args={[1.02, 0]} />
        <meshBasicMaterial color={PALETTE.edge} wireframe transparent opacity={0.28} />
      </mesh>

      <mesh ref={inner} scale={0.52}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#0d1116"
          emissive={PALETTE.accent}
          emissiveIntensity={1.35}
          metalness={0.4}
          roughness={0.3}
          flatShading
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

export default function HeroCrystal() {
  const [active, setActive] = useState(false)

  return (
    <>
      <fog attach="fog" args={[PALETTE.fog, 5.5, 17]} />
      <Rig />

      <DragOrbit autoSpin={0.14} maxPitch={0.6}>
        <group
          onPointerOver={() => setActive(true)}
          onPointerOut={() => setActive(false)}
        >
          <Core active={active} />
          {Array.from({ length: SHARD_COUNT }).map((_, i) => (
            <Shard key={i} index={i} total={SHARD_COUNT} active={active} />
          ))}
        </group>
      </DragOrbit>

      <Motes count={LOW_END ? 90 : 190} radius={7} />
    </>
  )
}
