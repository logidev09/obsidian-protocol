import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Rig from './Rig'
import Motes from './Motes'
import { damp, LOW_END, PALETTE } from './palette'

const NODE_COUNT = LOW_END ? 20 : 30
const LINK_DISTANCE = 2.2

function buildGraph() {
  const nodes = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < NODE_COUNT; i++) {
    const y = 1 - (i / (NODE_COUNT - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    const radius = 2.3 + ((i * 37) % 11) / 42
    nodes.push({
      base: new THREE.Vector3(Math.cos(theta) * r * radius, y * 1.8, Math.sin(theta) * r * radius),
      current: new THREE.Vector3(),
      tier: i % 3
    })
  }
  nodes.forEach((n) => n.current.copy(n.base))

  const links = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].base.distanceTo(nodes[j].base) < LINK_DISTANCE) links.push([i, j])
    }
  }
  return { nodes, links }
}

/** Node polygon menjauh dari pointer; hover satu node menyalakan seluruh link miliknya. */
export default function NetworkMesh() {
  const { nodes, links } = useMemo(buildGraph, [])
  const [hovered, setHovered] = useState(null)

  const meshRefs = useRef([])
  const spinner = useRef(null)
  const pointer = useRef(new THREE.Vector3(99, 99, 99))
  const active = useRef(false)

  const lineGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(links.length * 6), 3))
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(links.length * 6), 3))
    return g
  }, [links.length])

  const colors = useMemo(
    () => ({ idle: new THREE.Color(PALETTE.edge), hot: new THREE.Color(PALETTE.accent) }),
    []
  )

  useFrame((three, dt) => {
    const step = Math.min(dt, 0.05)
    const t = three.clock.elapsedTime
    if (spinner.current) spinner.current.rotation.y += step * 0.08

    const p = pointer.current

    nodes.forEach((node, i) => {
      const target = node.current
      let px = node.base.x
      let py = node.base.y + Math.sin(t * 0.7 + i) * 0.05
      let pz = node.base.z

      if (active.current) {
        const dx = node.base.x - p.x
        const dy = node.base.y - p.y
        const dz = node.base.z - p.z
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
        if (d < 2.6) {
          const force = (1 - d / 2.6) * 0.85
          px += (dx / d) * force
          py += (dy / d) * force
          pz += (dz / d) * force
        }
      }

      target.x = damp(target.x, px, 4, step)
      target.y = damp(target.y, py, 4, step)
      target.z = damp(target.z, pz, 4, step)

      const m = meshRefs.current[i]
      if (m) {
        m.position.copy(target)
        m.rotation.x += step * 0.4
        m.rotation.y += step * 0.55
        const scale = (hovered === i ? 1.8 : 1) * (0.09 + node.tier * 0.022)
        m.scale.setScalar(damp(m.scale.x || scale, scale, 8, step))
      }
    })

    const pos = lineGeometry.attributes.position
    const col = lineGeometry.attributes.color
    links.forEach(([a, b], k) => {
      const ix = k * 6
      const A = nodes[a].current
      const B = nodes[b].current
      pos.array[ix] = A.x
      pos.array[ix + 1] = A.y
      pos.array[ix + 2] = A.z
      pos.array[ix + 3] = B.x
      pos.array[ix + 4] = B.y
      pos.array[ix + 5] = B.z

      const c = hovered === a || hovered === b ? colors.hot : colors.idle
      for (let o = 0; o < 6; o += 3) {
        col.array[ix + o] = c.r
        col.array[ix + o + 1] = c.g
        col.array[ix + o + 2] = c.b
      }
    })
    pos.needsUpdate = true
    col.needsUpdate = true
  })

  return (
    <>
      <fog attach="fog" args={[PALETTE.fog, 6, 18]} />
      <Rig intensity={0.95} />
      <Motes count={LOW_END ? 60 : 140} radius={9} />

      <mesh
        scale={26}
        visible={false}
        onPointerMove={(e) => {
          pointer.current.copy(e.point)
          active.current = true
        }}
        onPointerLeave={() => {
          active.current = false
        }}
      >
        <planeGeometry />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <group ref={spinner}>
        <lineSegments geometry={lineGeometry}>
          <lineBasicMaterial vertexColors transparent opacity={0.5} />
        </lineSegments>

        {nodes.map((node, i) => (
          <mesh
            key={i}
            ref={(el) => {
              meshRefs.current[i] = el
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              setHovered(i)
            }}
            onPointerOut={() => setHovered((h) => (h === i ? null : h))}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={hovered === i ? PALETTE.accent : PALETTE.surfaceLight}
              emissive={hovered === i ? PALETTE.accent : PALETTE.accentDim}
              emissiveIntensity={hovered === i ? 1.1 : 0.28}
              metalness={0.6}
              roughness={0.35}
              flatShading
            />
          </mesh>
        ))}
      </group>
    </>
  )
}
