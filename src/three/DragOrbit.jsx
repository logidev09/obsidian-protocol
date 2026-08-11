import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { damp, clamp, PREFERS_REDUCED } from './palette'

/**
 * Rotasi objek via drag pointer, dengan inersia dan auto-spin saat idle.
 * Sengaja TIDAK memakai OrbitControls: pointer wheel harus tetap milik page
 * supaya scroll tidak "terjebak" di dalam canvas.
 */
export default function DragOrbit({
  children,
  autoSpin = 0.14,
  damping = 4.2,
  maxPitch = 0.62,
  sensitivity = 0.0075,
  followPointer = 0.18
}) {
  const group = useRef(null)
  const state = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    velX: 0,
    velY: 0,
    yaw: 0,
    pitch: 0,
    targetYaw: 0,
    targetPitch: 0
  })

  const { gl } = useThree()
  const dom = gl.domElement

  const handlers = useMemo(() => {
    const s = state.current

    const down = (e) => {
      s.dragging = true
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.velX = 0
      s.velY = 0
      dom.style.cursor = 'grabbing'
      e.target.setPointerCapture?.(e.pointerId)
    }

    const move = (e) => {
      if (!s.dragging) return
      const dx = e.clientX - s.lastX
      const dy = e.clientY - s.lastY
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.targetYaw += dx * sensitivity
      s.targetPitch = clamp(s.targetPitch + dy * sensitivity, -maxPitch, maxPitch)
      s.velX = dx * sensitivity
      s.velY = dy * sensitivity
    }

    const up = (e) => {
      s.dragging = false
      dom.style.cursor = 'grab'
      e.target.releasePointerCapture?.(e.pointerId)
    }

    return {
      onPointerDown: down,
      onPointerMove: move,
      onPointerUp: up,
      onPointerCancel: up,
      onPointerOver: () => { dom.style.cursor = 'grab' },
      onPointerOut: () => {
        if (!s.dragging) dom.style.cursor = 'auto'
      }
    }
  }, [dom, maxPitch, sensitivity])

  useFrame((three, dt) => {
    const s = state.current
    const g = group.current
    if (!g) return

    const step = Math.min(dt, 0.05)

    if (!s.dragging) {
      // inersia setelah lepas drag
      s.targetYaw += s.velX
      s.targetPitch = clamp(s.targetPitch + s.velY, -maxPitch, maxPitch)
      s.velX *= 0.92
      s.velY *= 0.92

      if (!PREFERS_REDUCED) s.targetYaw += autoSpin * step

      // pointer di layar memberi sedikit parallax walau tidak drag
      const px = three.pointer.x
      const py = three.pointer.y
      s.targetPitch = clamp(
        s.targetPitch + (-py * followPointer - s.targetPitch) * 0.012,
        -maxPitch,
        maxPitch
      )
      s.targetYaw += (px * followPointer * 0.4) * 0.012
    }

    s.yaw = damp(s.yaw, s.targetYaw, damping, step)
    s.pitch = damp(s.pitch, s.targetPitch, damping, step)

    g.rotation.y = s.yaw
    g.rotation.x = s.pitch
  })

  return (
    <group>
      {/* plane transparan sebagai area tangkap pointer */}
      <mesh {...handlers} visible={false} scale={40}>
        <planeGeometry />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      <group ref={group}>{children}</group>
    </group>
  )
}
