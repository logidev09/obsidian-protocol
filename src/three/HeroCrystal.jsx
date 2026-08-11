import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Rig from './Rig'
import Motes from './Motes'
import DragOrbit from './DragOrbit'
import { damp, LOW_END, PALETTE, PREFERS_REDUCED } from './palette'

const SHARD_COUNT = LOW_END ? 7 : 11

function Shell({ hot }) {
  const mesh = useRef(null)

  useFrame((three, dt) => {
    const m = mesh.current
    if (!m) return
    const step = Math.min(dt, 0.05)
    const target = hot ? 1.09 : 1
    m.scale.setScalar(damp(m.scale.x, target, 6, step))
    if (!PREFERS_REDUCED) {
      m.rotation.x += step * 0.09
      m.rotation.z -= step * 0.05
    }
  })

  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1.55, 1]} />
      <meshStandardMaterial
        color={PALETTE.surface}
        emissive={hot ? PALETTE.accent : PALETTE.accentDim}
        emissiveIntensity={hot ? 0.5 : 0.2}
        metalness={0.86}
        roughness={0.26}
        flatShading
        transparent
        opacity={0.94}
      />
    </mesh>
  )
}

function Wireframe() {
  const ref = useRef(null)
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1.62, 1), [])
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 12), [geometry])

  useFrame((three, dt) => {
    if (!ref.current || PREFERS_REDUCED) return
    ref.current.rotation.y -= dt * 0.14
    ref.current.rotation.x += dt * 0.06
  })

  return (
    <lineSegments ref={ref} geometry={edges}>
      <lineBasicMaterial color={PALETTE.edge} transparent opacity={0.62} />
    </lineSegments>
  )
}

function Core({ hot }) {
  const ref = useRef(null)

  useFrame((three, dt) => {
    const m = ref.current
    if (!m) return
    const t = three.clock.elapsedTime
    const step = Math.min(dt, 0.05)
    const pulse = 0.52 + Math.sin(t * 1.5) * 0.03
    m.scale.setScalar(damp(m.scale.x, hot ? pulse * 1.22 : pulse, 5, step))
    m.rotation.y += step * 0.5
    m.rotation.x -= step * 0.24
  })

  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={PALETTE.accent}
        emissive={PALETTE.accent}
        emissiveIntensity={hot ? 2.3 : 1.35}
        metalness={0.3}
        roughness={0.2}
        flatShading
      />
    </mesh>
  )
}

function Shards({ hot }) {
  const group = useRef(null)

  const shards = useMemo(
    () =>
      Array.from({ length: SHARD_COUNT }, (_, i) => {
        const angle = (i / SHARD_COUNT) * Math.PI * 2
        const tilt = (i % 3) * 0.4 - 0.4
        return {
          angle,
          tilt,
          radius: 2.5 + (i % 4) * 0.22,
          speed: 0.16 + (i % 5) * 0.035,
          size: 0.1 + (i % 3) * 0.045,
          accent: i % 4 === 0
        }
      }),
    []
  )

  useFrame((three, dt) => {
    const g = group.current
    if (!g) return
    const t = three.clock.elapsedTime
    const step = Math.min(dt, 0.05)

    g.children.forEach((child, i) => {
      const s = shards[i]
      const spread = hot ? 1.22 : 1
      const a = s.angle + t * s.speed
      child.position.set(
        Math.cos(a) * s.radius * spread,
        Math.sin(a * 1.35 + s.tilt) * 0.72,
        Math.sin(a) * s.radius * spread
      )
      child.rotation.x += step * 0.7
      child.rotation.y += step * 0.45
    })
  })

  return (
    <group ref={group}>
      {shards.map((s, i) => (
        <mesh key={i}>
          <tetrahedronGeometry args={[s.size, 0]} />
          <meshStandardMaterial
            color={s.accent ? PALETTE.amber : PALETTE.surfaceLight}
            emissive={s.accent ? PALETTE.amber : PALETTE.violet}
            emissiveIntensity={s.accent ? 0.85 : 0.4}
            metalness={0.72}
            roughness={0.3}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

function Halo() {
  const ref = useRef(null)

  useFrame((three, dt) => {
    if (!ref.current || PREFERS_REDUCED) return
    ref.current.rotation.z += dt * 0.12
  })

  return (
    <mesh ref={ref} rotation={[Math.PI / 2.3, 0, 0]}>
      <torusGeometry args={[2.35, 0.012, 3, 96]} />
      <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.42} />
    </mesh>
  )
}

/** Kristal hero: drag untuk memutar, hover untuk "membuka" cangkang. */
export default function HeroCrystal() {
  const [hot, setHot] = useState(false)

  return (
    <>
      <fog attach="fog" args={[PALETTE.fog, 6, 17]} />
      <Rig />
      <Motes />

      <DragOrbit autoSpin={0.16}>
        <group
          onPointerOver={() => setHot(true)}
          onPointerOut={() => setHot(false)}
          scale={1.02}
        >
          <Shell hot={hot} />
          <Wireframe />
          <Core hot={hot} />
          <Shards hot={hot} />
          <Halo />
        </group>
      </DragOrbit>
    </>
  )
}
