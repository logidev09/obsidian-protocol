import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragOrbit from './DragOrbit'
import Motes from './Motes'
import Rig from './Rig'
import { PALETTE, PREFERS_REDUCED, damp } from './palette'

const SHARD_COUNT = 7

const SHARDS = Array.from({ length: SHARD_COUNT }, (_, i) => {
  const angle = (i / SHARD_COUNT) * Math.PI * 2
  return {
    angle,
    radius: 2.05 + (i % 3) * 0.24,
    height: Math.sin(angle * 2) * 0.55,
    scale: 0.15 + (i % 4) * 0.05,
    spin: 0.42 + (i % 5) * 0.13
  }
})

function Shard({ data, expanded }) {
  const ref = useRef(null)
  const [hot, setHot] = useState(false)

  useFrame((three, dt) => {
    const m = ref.current
    if (!m) return
    const step = Math.min(dt, 0.05)
    const t = three.clock.elapsedTime
    const radius = data.radius * (expanded ? 1.55 : 1)
    const a = data.angle + (PREFERS_REDUCED ? 0 : t * 0.11)

    m.position.x = damp(m.position.x, Math.cos(a) * radius, 3, step)
    m.position.z = damp(m.position.z, Math.sin(a) * radius, 3, step)
    m.position.y = damp(
      m.position.y,
      data.height * (expanded ? 1.4 : 1) + Math.sin(t * 0.8 + data.angle) * 0.1,
      3,
      step
    )

    m.rotation.x += step * data.spin * 0.5
    m.rotation.y += step * data.spin

    const target = data.scale * (hot ? 1.7 : 1)
    m.scale.setScalar(damp(m.scale.x || data.scale, target, 7, step))
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
        color={hot ? PALETTE.accent : PALETTE.surfaceLight}
        emissive={hot ? PALETTE.accent : PALETTE.accentDim}
        emissiveIntensity={hot ? 0.85 : 0.2}
        metalness={0.72}
        roughness={0.3}
        flatShading
      />
    </mesh>
  )
}

function Core({ expanded, onToggle }) {
  const mesh = useRef(null)
  const cage = useRef(null)
  const glow = useRef(null)
  const [hovered, setHovered] = useState(false)

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1.28, 2), [])
  const base = useMemo(
    () => Float32Array.from(geometry.attributes.position.array),
    [geometry]
  )

  useFrame((three, dt) => {
    const step = Math.min(dt, 0.05)
    const t = three.clock.elapsedTime
    const attr = geometry.attributes.position
    const amp = (hovered ? 0.15 : 0.06) * (expanded ? 1.7 : 1)

    for (let i = 0; i < attr.count; i++) {
      const ix = i * 3
      const x = base[ix]
      const y = base[ix + 1]
      const z = base[ix + 2]
      const n =
        Math.sin(x * 2.4 + t * 0.9) *
        Math.cos(y * 2.1 - t * 0.7) *
        Math.sin(z * 1.8 + t * 0.5)
      const k = 1 + n * amp
      attr.array[ix] = x * k
      attr.array[ix + 1] = y * k
      attr.array[ix + 2] = z * k
    }
    attr.needsUpdate = true
    geometry.computeVertexNormals()

    if (cage.current) {
      cage.current.rotation.y -= step * 0.28
      cage.current.rotation.x += step * 0.12
      const s = expanded ? 1.34 : 1.18
      cage.current.scale.setScalar(damp(cage.current.scale.x, s, 5, step))
    }

    if (glow.current) {
      const pulse = 1 + Math.sin(t * 1.7) * 0.05
      glow.current.scale.setScalar(pulse * (hovered ? 0.62 : 0.55))
    }

    if (mesh.current) {
      mesh.current.rotation.y += step * 0.05
    }
  })

  return (
    <group>
      <mesh
        ref={mesh}
        geometry={geometry}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
      >
        <meshStandardMaterial
          color={PALETTE.surface}
          emissive={hovered ? PALETTE.accent : PALETTE.accentDim}
          emissiveIntensity={hovered ? 0.5 : 0.22}
          metalness={0.86}
          roughness={0.24}
          flatShading
        />
      </mesh>

      {/* sangkar polygon di luar inti */}
      <mesh ref={cage} scale={1.18}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshBasicMaterial
          color={hovered ? PALETTE.accent : PALETTE.edge}
          wireframe
          transparent
          opacity={hovered ? 0.5 : 0.28}
        />
      </mesh>

      {/* inti bercahaya */}
      <mesh ref={glow} scale={0.55}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial
          color={PALETTE.accent}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/** Scene hero: kristal polygon — drag untuk memutar, klik untuk memecah. */
export default function HeroCrystal() {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <fog attach="fog" args={[PALETTE.fog, 6.5, 19]} />
      <Rig />
      <DragOrbit autoSpin={0.1}>
        <Core expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
        {SHARDS.map((data, i) => (
          <Shard key={i} data={data} expanded={expanded} />
        ))}
      </DragOrbit>
      <Motes count={230} radius={8.5} />
    </>
  )
}
