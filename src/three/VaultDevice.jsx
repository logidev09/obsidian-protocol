import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import Rig from './Rig'
import DragOrbit from './DragOrbit'
import { damp, PALETTE } from './palette'

function Layer({ y, size, thickness, offset, exploded, accent, label }) {
  const ref = useRef(null)
  const [hot, setHot] = useState(false)

  useFrame((three, dt) => {
    const mesh = ref.current
    if (!mesh) return
    const step = Math.min(dt, 0.05)
    const targetY = exploded ? y + offset : y
    mesh.position.y = damp(mesh.position.y, targetY, 5, step)

    const targetTilt = hot ? 0.06 : 0
    mesh.rotation.z = damp(mesh.rotation.z, targetTilt, 6, step)
    mesh.material.emissiveIntensity = damp(mesh.material.emissiveIntensity, hot ? 1.4 : 0.2, 6, step)
  })

  return (
    <mesh
      ref={ref}
      position={[0, y, 0]}
      castShadow
      onPointerOver={(e) => {
        e.stopPropagation()
        setHot(true)
      }}
      onPointerOut={() => setHot(false)}
      userData={{ label }}
    >
      <boxGeometry args={[size, thickness, size * 1.6]} />
      <meshStandardMaterial
        color={PALETTE.surface}
        emissive={accent}
        emissiveIntensity={0.2}
        metalness={0.8}
        roughness={0.3}
        flatShading
      />
    </mesh>
  )
}

/** Perangkat vault: klik untuk bongkar-pasang lapisan, drag untuk memutar. */
export default function VaultDevice() {
  const [exploded, setExploded] = useState(false)
  const glow = useRef(null)

  useFrame((three, dt) => {
    if (!glow.current) return
    const step = Math.min(dt, 0.05)
    const t = three.clock.elapsedTime
    glow.current.material.opacity = damp(
      glow.current.material.opacity,
      exploded ? 0.85 : 0.35 + Math.sin(t * 1.6) * 0.08,
      4,
      step
    )
  })

  return (
    <>
      <fog attach="fog" args={[PALETTE.fog, 5, 15]} />
      <Rig intensity={1.05} />

      <DragOrbit autoSpin={0.1} maxPitch={0.55}>
        <group
          scale={1.35}
          onClick={(e) => {
            e.stopPropagation()
            setExploded((v) => !v)
          }}
        >
          <Layer y={0.62} size={0.92} thickness={0.1} offset={0.75} accent={PALETTE.accent} label="Secure element" />
          <Layer y={0.42} size={0.98} thickness={0.14} offset={0.42} accent={PALETTE.violet} label="MPC shard store" />
          <Layer y={0.2} size={1.04} thickness={0.18} offset={0.16} accent={PALETTE.amber} label="Signing core" />
          <Layer y={-0.04} size={1.1} thickness={0.22} offset={-0.14} accent={PALETTE.accent} label="Chassis" />

          <mesh ref={glow} position={[0, 0.74, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.3, 6]} />
            <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.35} toneMapped={false} />
          </mesh>

          <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.25, 1.28, 64]} />
            <meshBasicMaterial color={PALETTE.edge} transparent opacity={0.4} />
          </mesh>
        </group>
      </DragOrbit>
    </>
  )
}
