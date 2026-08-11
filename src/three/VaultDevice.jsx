import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import DragOrbit from './DragOrbit'
import Rig from './Rig'
import { PALETTE, damp } from './palette'

const LAYERS = [
  {
    id: 'shell',
    label: 'Titanium shell',
    size: [2.5, 1.42, 0.2],
    y: 0,
    open: [0, 0, 0.62],
    color: PALETTE.surfaceLight,
    accent: PALETTE.edge
  },
  {
    id: 'board',
    label: 'Logic board',
    size: [2.26, 1.2, 0.1],
    y: 0,
    open: [0, 0, 0.14],
    color: '#1b2a2a',
    accent: PALETTE.accentDim
  },
  {
    id: 'element',
    label: 'Secure element',
    size: [0.72, 0.72, 0.14],
    y: 0,
    open: [0, 0, -0.34],
    color: PALETTE.surface,
    accent: PALETTE.accent
  },
  {
    id: 'back',
    label: 'Tamper mesh',
    size: [2.5, 1.42, 0.16],
    y: 0,
    open: [0, 0, -0.86],
    color: '#171d26',
    accent: PALETTE.violet
  }
]

function Layer({ data, open, active, onHover, onLeave }) {
  const ref = useRef(null)

  useFrame((three, dt) => {
    const m = ref.current
    if (!m) return
    const step = Math.min(dt, 0.05)
    const [ox, oy, oz] = open ? data.open : [0, 0, 0]
    m.position.x = damp(m.position.x, ox, 5, step)
    m.position.y = damp(m.position.y, data.y + oy, 5, step)
    m.position.z = damp(m.position.z, oz, 5, step)
    const lift = active ? 1.04 : 1
    m.scale.setScalar(damp(m.scale.x || 1, lift, 8, step))
  })

  return (
    <mesh
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(data.id)
      }}
      onPointerOut={onLeave}
    >
      <boxGeometry args={data.size} />
      <meshStandardMaterial
        color={data.color}
        emissive={active ? data.accent : '#000000'}
        emissiveIntensity={active ? 0.42 : 0}
        metalness={0.78}
        roughness={0.34}
      />
      <Edges threshold={12} color={active ? data.accent : PALETTE.edge} />
    </mesh>
  )
}

function Screen({ active }) {
  const ref = useRef(null)

  useFrame((three) => {
    if (!ref.current) return
    const t = three.clock.elapsedTime
    ref.current.material.opacity = 0.5 + Math.sin(t * 2.1) * 0.1 + (active ? 0.2 : 0)
  })

  return (
    <mesh ref={ref} position={[0, 0.16, 0.115]}>
      <planeGeometry args={[1.52, 0.62]} />
      <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.5} />
    </mesh>
  )
}

/**
 * Scene produk: perangkat vault low-poly.
 * Drag = putar, hover layer = highlight, klik = tampilan exploded.
 */
export default function VaultDevice({ onLayerChange }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(null)

  const setHover = (id) => {
    setActive(id)
    onLayerChange?.(LAYERS.find((l) => l.id === id) || null)
  }

  const clearHover = () => {
    setActive(null)
    onLayerChange?.(null)
  }

  return (
    <>
      <fog attach="fog" args={[PALETTE.fog, 6, 17]} />
      <Rig intensity={1.08} />
      <DragOrbit autoSpin={0.16} maxPitch={0.7}>
        <group
          onClick={(e) => {
            e.stopPropagation()
            setOpen((v) => !v)
          }}
        >
          {LAYERS.map((data) => (
            <Layer
              key={data.id}
              data={data}
              open={open}
              active={active === data.id}
              onHover={setHover}
              onLeave={clearHover}
            />
          ))}
          <Screen active={active === 'shell'} />
        </group>
      </DragOrbit>
    </>
  )
}

export { LAYERS }
