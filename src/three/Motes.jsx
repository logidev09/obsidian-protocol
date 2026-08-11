import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE, PREFERS_REDUCED } from './palette'

/** Partikel debu halus — memberi kedalaman tanpa membebani GPU. */
export default function Motes({ count = 260, radius = 9, color = PALETTE.accent, size = 0.032 }) {
  const points = useRef(null)

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = radius * (0.35 + Math.random() * 0.65)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.cos(phi) * 0.55
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    return arr
  }, [count, radius])

  useFrame((state) => {
    if (!points.current || PREFERS_REDUCED) return
    const t = state.clock.elapsedTime
    points.current.rotation.y = t * 0.026
    points.current.rotation.x = Math.sin(t * 0.11) * 0.055
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.42}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
