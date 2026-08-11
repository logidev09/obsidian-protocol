import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { damp, clamp, PREFERS_REDUCED } from './palette'

/**
 * Rotasi objek via drag pointer + inersia + auto-spin saat idle.
 * Sengaja TIDAK memakai OrbitControls: wheel/scroll harus tetap milik halaman,
 * jadi canvas tidak pernah "menelan" scroll user.
 */
export default function DragOrbit({
  children,
  autoSpin = 0.12,
  damping = 4.2,
  maxPitch = 0.6,
  sensitivity = 0.0072,
  followPointer = 0.22
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

    const up = () => {
      s.dragging = false
      dom.style.cursor = 'grab'
    }

    return {
      onPointerDown: down,
      onPointerMove: move,
      onPointerUp: up,
      onPointerLeave: up,
      onPointerCancel: up,
      onPointerOver: () => {
        if (!s.dragging) dom.style.cursor = 'grab'
      },
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
      s.targetYaw += s.velX
      s.targetPitch = clamp(s.targetPitch + s.velY, -maxPitch, maxPitch)
      s.velX *= 0.92
      s.velY *= 0.92

      if (!PREFERS_REDUCED) s.targetYaw += autoSpin * step

      // parallax halus mengikuti pointer walau tidak sedang drag
      s.targetPitch = clamp(
        s.targetPitch + (-three.pointer.y * followPointer - s.targetPitch) * 0.02,
        -maxPitch,
        maxPitch
      )
      s.targetYaw += three.pointer.x * followPointer * 0.012
    }

    s.yaw = damp(s.yaw, s.targetYaw, damping, step)
    s.pitch = damp(s.pitch, s.targetPitch, damping, step)

    g.rotation.y = s.yaw
    g.rotation.x = s.pitch
  })

  return (
    <group {...handlers}>
      {/* backdrop penangkap pointer, ditaruh di belakang semua objek */}
      <mesh position={[0, 0, -7]} scale={44} visible={false}>
        <planeGeometry />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <group ref={group}>{children}</group>
    </group>
  )
}
