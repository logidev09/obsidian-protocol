import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Rig from './Rig'
import { LOW_END, PALETTE, PREFERS_REDUCED } from './palette'

const COLS = LOW_END ? 12 : 18
const ROWS = LOW_END ? 12 : 18
const GAP = 0.34

/** Grid ledger: tiap kolom naik saat pointer mendekat, seperti gelombang blok. */
export default function LedgerGrid() {
  const mesh = useRef(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const pointerWorld = useRef(new THREE.Vector3(0, 0, 0))

  const cells = useMemo(() => {
    const list = []
    for (let x = 0; x < COLS; x++) {
      for (let z = 0; z < ROWS; z++) {
        list.push({
          x: (x - (COLS - 1) / 2) * GAP,
          z: (z - (ROWS - 1) / 2) * GAP,
          seed: (x * 31 + z * 17) % 100
        })
      }
    }
    return list
  }, [])

  useFrame((three, dt) => {
    const inst = mesh.current
    if (!inst) return

    const t = three.clock.elapsedTime
    const reach = 2.1

    pointerWorld.current.set(three.pointer.x * 3.1, 0, -three.pointer.y * 2.4)

    cells.forEach((cell, i) => {
      const dx = cell.x - pointerWorld.current.x
      const dz = cell.z - pointerWorld.current.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      const falloff = Math.max(0, 1 - dist / reach)
      const wave = PREFERS_REDUCED ? 0 : Math.sin(t * 1.15 + cell.seed * 0.09) * 0.05
      const height = 0.05 + falloff * falloff * 0.72 + wave

      dummy.position.set(cell.x, height / 2, cell.z)
      dummy.scale.set(0.2, Math.max(0.04, height), 0.2)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      inst.setMatrixAt(i, dummy.matrix)

      color.set(PALETTE.surfaceLight).lerp(new THREE.Color(PALETTE.accent), Math.min(1, falloff * 1.3))
      inst.setColorAt(i, color)
    })

    inst.instanceMatrix.needsUpdate = true
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true
  })

  return (
    <>
      <fog attach="fog" args={[PALETTE.fog, 5, 14]} />
      <Rig intensity={0.8} />

      <group rotation={[0.32, 0.5, 0]} position={[0, -0.55, 0]}>
        <instancedMesh ref={mesh} args={[undefined, undefined, cells.length]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial metalness={0.68} roughness={0.36} flatShading toneMapped={false} />
        </instancedMesh>

        <gridHelper args={[COLS * GAP, COLS, PALETTE.edge, '#161c24']} position={[0, 0.001, 0]} />
      </group>
    </>
  )
}
