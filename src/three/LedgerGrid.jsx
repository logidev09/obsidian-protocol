import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Rig from './Rig'
import { PALETTE, PREFERS_REDUCED } from './palette'

const COLS = 22
const ROWS = 22
const GAP = 0.26
const TOTAL = COLS * ROWS

/**
 * Scene settlement: grid batang instanced.
 * Tinggi tiap batang bereaksi ke jarak pointer + gelombang halus.
 */
export default function LedgerGrid() {
  const mesh = useRef(null)
  const pointer = useRef(new THREE.Vector3(99, 0, 99))
  const strength = useRef(0)

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorA = useMemo(() => new THREE.Color(PALETTE.surface), [])
  const colorB = useMemo(() => new THREE.Color(PALETTE.accent), [])
  const tmp = useMemo(() => new THREE.Color(), [])

  const cells = useMemo(() => {
    const list = []
    for (let x = 0; x < COLS; x++) {
      for (let z = 0; z < ROWS; z++) {
        list.push({
          x: (x - (COLS - 1) / 2) * GAP,
          z: (z - (ROWS - 1) / 2) * GAP,
          seed: (x * 13 + z * 7) % 17
        })
      }
    }
    return list
  }, [])

  useFrame((three, dt) => {
    const m = mesh.current
    if (!m) return

    const t = PREFERS_REDUCED ? 0 : three.clock.elapsedTime
    const p = pointer.current
    strength.current += (0 - strength.current) * dt * 0.6

    for (let i = 0; i < TOTAL; i++) {
      const c = cells[i]
      const wave = Math.sin(c.x * 1.6 + t * 0.9) * Math.cos(c.z * 1.4 - t * 0.7)
      const dist = Math.hypot(c.x - p.x, c.z - p.z)
      const pulse = Math.max(0, 1 - dist / 1.9) * strength.current
      const height = 0.14 + Math.abs(wave) * 0.32 + pulse * 1.5

      dummy.position.set(c.x, height / 2, c.z)
      dummy.scale.set(0.16, height, 0.16)
      dummy.rotation.y = pulse * 0.6
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)

      const mix = Math.min(1, Math.abs(wave) * 0.35 + pulse * 0.9)
      tmp.copy(colorA).lerp(colorB, mix)
      m.setColorAt(i, tmp)
    }

    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <>
      <fog attach="fog" args={[PALETTE.fog, 4.5, 13]} />
      <Rig intensity={0.9} />

      <group rotation={[0, Math.PI / 4, 0]} position={[0, -0.6, 0]}>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          scale={18}
          visible={false}
          onPointerMove={(e) => {
            pointer.current.set(e.point.x, 0, e.point.z)
            strength.current = 1
          }}
          onPointerLeave={() => {
            strength.current = 0
          }}
        >
          <planeGeometry />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <instancedMesh ref={mesh} args={[undefined, undefined, TOTAL]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            metalness={0.7}
            roughness={0.38}
            emissive={PALETTE.accentDim}
            emissiveIntensity={0.16}
          />
        </instancedMesh>

        <gridHelper args={[6, 22, PALETTE.edge, PALETTE.edge]} position={[0, -0.01, 0]} />
      </group>
    </>
  )
}
