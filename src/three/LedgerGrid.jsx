import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Rig from './Rig'
import { PALETTE } from './palette'

const COLS = 22
const ROWS = 14
const SPACING = 0.34

/** Grid ledger: tiap kolom naik-turun mengikuti jarak pointer. */
function Grid() {
  const ref = useRef(null)
  const pointer = useRef(new THREE.Vector3(99, 99, 0))
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const count = COLS * ROWS

  useFrame((three, dt) => {
    const mesh = ref.current
    if (!mesh) return
    const t = three.clock.elapsedTime

    const px = three.pointer.x * (COLS * SPACING) * 0.5
    const py = three.pointer.y * (ROWS * SPACING) * 0.5
    pointer.current.x += (px - pointer.current.x) * Math.min(1, dt * 6)
    pointer.current.y += (py - pointer.current.y) * Math.min(1, dt * 6)

    let i = 0
    for (let c = 0; c < COLS; c += 1) {
      for (let r = 0; r < ROWS; r += 1) {
        const x = (c - (COLS - 1) / 2) * SPACING
        const z = (r - (ROWS - 1) / 2) * SPACING

        const dx = x - pointer.current.x
        const dz = z + pointer.current.y
        const dist = Math.sqrt(dx * dx + dz * dz)

        const wave = Math.sin(t * 1.1 + c * 0.35 + r * 0.22) * 0.06
        const lift = Math.max(0, 1 - dist / 2.2) ** 2 * 0.72
        const height = 0.06 + wave + lift

        dummy.position.set(x, height / 2, z)
        dummy.scale.set(1, Math.max(0.08, height / 0.24), 1)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
        i += 1
      }
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} rotation={[0, 0, 0]}>
      <boxGeometry args={[0.14, 0.24, 0.14]} />
      <meshStandardMaterial
        color={PALETTE.surfaceLight}
        emissive={PALETTE.accentDim}
        emissiveIntensity={0.5}
        metalness={0.65}
        roughness={0.35}
        flatShading
      />
    </instancedMesh>
  )
}

export default function LedgerGrid() {
  return (
    <>
      <fog attach="fog" args={[PALETTE.fog, 4, 13]} />
      <Rig intensity={0.8} />
      <group rotation={[0.15, -0.35, 0]} position={[0, -0.6, 0]}>
        <Grid />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[COLS * SPACING + 1, ROWS * SPACING + 1]} />
          <meshBasicMaterial color="#0a0e13" transparent opacity={0.55} />
        </mesh>
      </group>
    </>
  )
}
