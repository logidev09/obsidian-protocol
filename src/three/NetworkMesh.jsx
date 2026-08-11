import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Rig from './Rig'
import DragOrbit from './DragOrbit'
import { clamp, damp, LOW_END, PALETTE } from './palette'

const NODE_COUNT = LOW_END ? 16 : 26
const LINK_DISTANCE = 2.15

function buildGraph(count) {
  const nodes = []
  const golden = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const radius = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    const scale = 2.5
    nodes.push({
      base: new THREE.Vector3(Math.cos(theta) * radius * scale, y * scale * 0.78, Math.sin(theta) * radius * scale),
      seed: i * 1.7,
      validator: i % 5 === 0
    })
  }

  const links = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].base.distanceTo(nodes[j].base) < LINK_DISTANCE) links.push([i, j])
    }
  }

  return { nodes, links }
}

export default function NetworkMesh() {
  const [hovered, setHovered] = useState(-1)
  const { nodes, links } = useMemo(() => buildGraph(NODE_COUNT), [])

  const instances = useRef(null)
  const lines = useRef(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const live = useMemo(() => nodes.map((n) => n.base.clone()), [nodes])

  const linePositions = useMemo(() => new Float32Array(links.length * 6), [links.length])

  const lineGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
    return g
  }, [linePositions])

  useFrame((three, dt) => {
    const t = three.clock.elapsedTime
    const step = Math.min(dt, 0.05)
    const inst = instances.current
    if (!inst) return

    const pointer = three.pointer

    nodes.forEach((node, i) => {
      const drift = new THREE.Vector3(
        Math.sin(t * 0.5 + node.seed) * 0.09,
        Math.cos(t * 0.42 + node.seed * 1.3) * 0.09,
        Math.sin(t * 0.36 + node.seed * 0.7) * 0.09
      )

      const target = node.base.clone().add(drift)
      target.x += pointer.x * 0.22
      target.y += pointer.y * 0.22

      live[i].x = damp(live[i].x, target.x, 3, step)
      live[i].y = damp(live[i].y, target.y, 3, step)
      live[i].z = damp(live[i].z, target.z, 3, step)

      const isHot = hovered === i
      const base = node.validator ? 0.15 : 0.1
      dummy.position.copy(live[i])
      dummy.scale.setScalar(isHot ? base * 1.9 : base)
      dummy.rotation.set(t * 0.3 + node.seed, t * 0.24, 0)
      dummy.updateMatrix()
      inst.setMatrixAt(i, dummy.matrix)

      const c = node.validator ? PALETTE.amber : PALETTE.accent
      color.set(isHot ? '#ffffff' : c)
      inst.setColorAt(i, color)
    })

    inst.instanceMatrix.needsUpdate = true
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true

    links.forEach(([a, b], i) => {
      const o = i * 6
      linePositions[o] = live[a].x
      linePositions[o + 1] = live[a].y
      linePositions[o + 2] = live[a].z
      linePositions[o + 3] = live[b].x
      linePositions[o + 4] = live[b].y
      linePositions[o + 5] = live[b].z
    })

    lineGeometry.attributes.position.needsUpdate = true

    if (lines.current) {
      lines.current.material.opacity = damp(
        lines.current.material.opacity,
        hovered >= 0 ? 0.5 : 0.3,
        5,
        step
      )
    }
  })

  return (
    <>
      <fog attach="fog" args={[PALETTE.fog, 6, 18]} />
      <Rig intensity={0.95} />

      <DragOrbit autoSpin={0.12} maxPitch={0.7}>
        <group>
          <instancedMesh
            ref={instances}
            args={[undefined, undefined, nodes.length]}
            onPointerMove={(e) => {
              e.stopPropagation()
              setHovered(clamp(e.instanceId ?? -1, -1, nodes.length - 1))
            }}
            onPointerOut={() => setHovered(-1)}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              emissive={PALETTE.accent}
              emissiveIntensity={0.85}
              metalness={0.5}
              roughness={0.28}
              flatShading
              toneMapped={false}
            />
          </instancedMesh>

          <lineSegments ref={lines} geometry={lineGeometry}>
            <lineBasicMaterial color={PALETTE.edge} transparent opacity={0.3} />
          </lineSegments>
        </group>
      </DragOrbit>
    </>
  )
}
