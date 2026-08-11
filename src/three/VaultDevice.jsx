import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import Rig from './Rig'
import DragOrbit from './DragOrbit'
import { damp, PALETTE } from './palette'

const LAYERS = [
  { id: 'shell', label: 'Titanium shell', y: 0.62, color: PALETTE.surfaceLight, h: 0.16 },
  { id: 'secure', label: 'Secure element', y: 0.28, color: PALETTE.accentDim, h: 0.2 },
  { id: 'logic', label: 'Signing logic', y: -0.08, color: PALETTE.surface, h: 0.2 },
  { id: 'power', label: 'Air-gap power', y: -0.44, color: PALETTE.surfaceLight, h: 0.16 }
]

function Layer({ layer, index, exploded, active, onHover, onLeave }) {
  const ref = useRef(null)

  useFrame((three, dt) => {
    const m = ref.current
    if (!m) return
    const step = Math.min(dt, 0.05)
    const spread = exploded ? 1 : 0
    const targetY = layer.y + spread * index * 0.3
    const targetScale = active ? 1.06 : 1
    m.position.y = damp(m.position.y, targetY, 7, step)
    m.scale.x = damp(m.scale.x, targetScale, 8, step)
    m.scale.z = damp(m.scale.z, targetScale, 8, step)
  })

  return (
    <mesh
      ref={ref}
      position={[0, layer.y, 0]}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(layer.id)
      }}
      onPointerOut={onLeave}
    >
      <boxGeometry args={[1.15, layer.h, 1.15]} />
      <meshStandardMaterial
        color={layer.color}
        emissive={active ? PALETTE.accent : PALETTE.accentDim}
        emissiveIntensity={active ? 0.75 : 0.14}
        metalness={0.8}
        roughness={0.34}
        flatShading
      />
    </mesh>
  )
}

function Screen({ active }) {
  const ref = useRef(null)

  useFrame((three, dt) => {
    const m = ref.current
    if (!m) return
    const t = three.clock.elapsedTime
    m.material.emissiveIntensity = damp(
      m.material.emissiveIntensity,
      active ? 2.1 : 0.9 + Math.sin(t * 2) * 0.12,
      6,
      Math.min(dt, 0.05)
    )
  })

  return (
    <mesh ref={ref} position={[0, 0.28, 0.585]}>
      <planeGeometry args={[0.78, 0.13]} />
      <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={1} />
    </mesh>
  )
}

/** Perangkat vault: drag untuk memutar, klik untuk membongkar lapisannya. */
export default function VaultDevice({ onLayerChange }) {
  const [exploded, setExploded] = useState(false)
  const [active, setActive] = useState(null)
  const ring = useRef(null)

  const handleHover = useMemo(
    () => (id) => {
      setActive(id)
      if (onLayerChange) onLayerChange(LAYERS.find((l) => l.id === id) || null)
    },
    [onLayerChange]
  )

  const handleLeave = useMemo(
    () => () => {
      setActive(null)
      if (onLayerChange) onLayerChange(null)
    },
    [onLayerChange]
  )

  useFrame((three, dt) => {
    if (ring.current) ring.current.rotation.z += dt * 0.22
  })

  return (
    <>
      <fog attach="fog" args={[PALETTE.fog, 5, 15]} />
      <Rig intensity={1.05} />

      <DragOrbit autoSpin={0.1} maxPitch={0.5}>
        <group
          onClick={(e) => {
            e.stopPropagation()
            setExploded((v) => !v)
          }}
        >
          {LAYERS.map((layer, i) => (
            <Layer
              key={layer.id}
              layer={layer}
              index={i}
              exploded={exploded}
              active={active === layer.id}
              onHover={handleHover}
              onLeave={handleLeave}
            />
          ))}

          <Screen active={active === 'secure'} />

          <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
            <torusGeometry args={[1.25, 0.008, 3, 72]} />
            <meshBasicMaterial color={PALETTE.amber} transparent opacity={0.5} />
          </mesh>
        </group>
      </DragOrbit>
    </>
  )
}

export { LAYERS }
