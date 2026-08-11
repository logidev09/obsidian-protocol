import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import Rig from './Rig'
import DragOrbit from './DragOrbit'
import { damp, PALETTE } from './palette'

const LAYERS = [
  { y: 0.62, size: [1.7, 0.12, 1.05], color: PALETTE.surfaceLight, glow: PALETTE.edge, label: 'shell' },
  { y: 0.3, size: [1.62, 0.16, 0.98], color: PALETTE.surface, glow: PALETTE.accent, label: 'secure element' },
  { y: -0.02, size: [1.66, 0.2, 1.0], color: PALETTE.surfaceLight, glow: PALETTE.violet, label: 'mpc board' },
  { y: -0.36, size: [1.72, 0.14, 1.06], color: PALETTE.surface, glow: PALETTE.amber, label: 'battery' },
  { y: -0.64, size: [1.78, 0.1, 1.1], color: PALETTE.surfaceLight, glow: PALETTE.edge, label: 'base' }
]

function Layer({ layer, index, exploded, onFocus }) {
  const ref = useRef(null)
  const [hot, setHot] = useState(false)

  useFrame((three, dt) => {
    const mesh = ref.current
    if (!mesh) return
    const step = Math.min(dt, 0.05)
    const spread = exploded ? 1.75 : 1
    const targetY = layer.y * spread + (hot ? 0.08 : 0)
    mesh.position.y = damp(mesh.position.y, targetY, 6, step)
    mesh.material.emissiveIntensity = damp(mesh.material.emissiveIntensity, hot ? 1.8 : 0.35, 6, step)
  })

  return (
    <mesh
      ref={ref}
      position={[0, layer.y, 0]}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHot(true)
        onFocus(layer.label)
      }}
      onPointerOut={() => {
        setHot(false)
        onFocus(null)
      }}
    >
      <boxGeometry args={layer.size} />
      <meshStandardMaterial
        color={layer.color}
        emissive={layer.glow}
        emissiveIntensity={0.35}
        metalness={0.78}
        roughness={0.3}
        flatShading
      />
    </mesh>
  )
}

/**
 * Perangkat vault: klik untuk membongkar/menyusun lapisan,
 * drag untuk memutar, hover per-lapisan untuk menyorotnya.
 */
export default function VaultDevice({ onLayer }) {
  const [exploded, setExploded] = useState(false)

  return (
    <>
      <fog attach="fog" args={[PALETTE.fog, 5, 15]} />
      <Rig intensity={0.95} />

      <DragOrbit autoSpin={0.14} maxPitch={0.6}>
        <group
          onClick={(e) => {
            e.stopPropagation()
            setExploded((v) => !v)
          }}
        >
          {LAYERS.map((layer, i) => (
            <Layer
              key={layer.label}
              layer={layer}
              index={i}
              exploded={exploded}
              onFocus={onLayer ?? (() => {})}
            />
          ))}

          <mesh position={[0, 0.3, 0.52]}>
            <planeGeometry args={[0.9, 0.1]} />
            <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.65} toneMapped={false} />
          </mesh>
        </group>
      </DragOrbit>
    </>
  )
}
