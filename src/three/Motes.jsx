import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LOW_END, PALETTE, PREFERS_REDUCED } from './palette'

/** Debu volumetrik tipis — memberi kedalaman tanpa membebani GPU. */
export default function Motes({ count = LOW_END ? 90 : 220, radius = 7, size = 0.035 }) {
  const points = useRef(null)

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * radius * 2
      arr[i * 3 + 1] = (Math.random() - 0.5) * radius
      arr[i * 3 + 2] = (Math.random() - 0.5) * radius * 1.4
    }
    return arr
  }, [count, radius])

  useFrame((three, dt) => {
    if (!points.current || PREFERS_REDUCED) return
    points.current.rotation.y += dt * 0.02
    points.current.position.y = Math.sin(three.clock.elapsedTime * 0.25) * 0.14
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={PALETTE.edge}
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
