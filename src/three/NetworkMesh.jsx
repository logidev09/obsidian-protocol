import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Rig from './Rig'
import DragOrbit from './DragOrbit'
import { damp, LOW_END, PALETTE } from './palette'

const NODE_COUNT = LOW_END ? 16 : 26

function useLattice() {
  return useMemo(() => {
    const nodes = []
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < NODE_COUNT; i += 1) {
      const y = 1 - (i / (NODE_COUNT - 1)) * 2
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = golden * i
      nodes.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(2.1))
    }

    const positions = []
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        if (nodes[i].distanceTo(nodes[j]) < 1.75) {
          positions.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z)
        }
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return { nodes, geometry }
  }, [])
}

function Node({ position, index }) {
  const ref = useRef(null)
  const [hot, setHot] = useState(false)

  useFrame((three, dt) => {
    const mesh = ref.current
    if (!mesh) return
    const step = Math.min(dt, 0.05)
    const t = three.clock.elapsedTime
    const pulse = 0.5 + Math.sin(t * 1.4 + index * 0.7) * 0.5

    const s = damp(mesh.scale.x, hot ? 2.1 : 1 + pulse * 0.18, 8, step)
    mesh.scale.setScalar(s)
    mesh.material.emissiveIntensity = damp(
      mesh.material.emissiveIntensity,
      hot ? 3 : 0.5 + pulse * 0.7,
      6,
      step
    )
  })

  return (
    <mesh
      ref={ref}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHot(true)
      }}
      onPointerOut={() => setHot(false)}
    >
      <octahedronGeometry args={[0.11, 0]} />
      <meshStandardMaterial
        color={PALETTE.surfaceLight}
        emissive={index % 5 === 0 ? PALETTE.violet : PALETTE.accent}
        emissiveIntensity={0.6}
        metalness={0.6}
        roughness={0.32}
        flatShading
        toneMapped={false}
      />
    </mesh>
  )
}

/** Mesh validator: node menyala saat di-hover, seluruh lattice bisa di-drag. */
export default function NetworkMesh() {
  const { nodes, geometry } = useLattice()

  return (
    <>
      <fog attach="fog" args={[PALETTE.fog, 6, 18]} />
      <Rig intensity={0.85} />

      <DragOrbit autoSpin={0.16} maxPitch={0.7}>
        <group>
          <lineSegments geometry={geometry}>
            <lineBasicMaterial color={PALETTE.edge} transparent opacity={0.42} />
          </lineSegments>
          {nodes.map((position, i) => (
            <Node key={i} position={position} index={i} />
          ))}
        </group>
      </DragOrbit>
    </>
  )
}
