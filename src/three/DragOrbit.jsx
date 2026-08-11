import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { clamp, damp, PREFERS_REDUCED } from './palette'

/**
 * Rotasi objek pakai drag mouse/touch + inersia, dan tilt halus mengikuti pointer.
 * touch-action: pan-y di CSS bikin scroll vertikal tetap lolos ke halaman,
 * jadi di HP orang tidak "terjebak" di dalam canvas.
 */
export default function DragOrbit({
  children,
  autoSpin = 0.14,
  maxPitch = 0.62,
  sensitivity = 0.0062
}) {
  const group = useRef(null)
  const s = useRef({ dragging: false, lastX: 0, lastY: 0, velX: 0, velY: 0, yaw: 0, pitch: 0 })
  const { gl } = useThree()

  useEffect(() => {
    const el = gl.domElement
    const st = s.current
    el.style.cursor = 'grab'
    el.style.touchAction = 'pan-y'

    const down = (e) => {
      st.dragging = true
      st.lastX = e.clientX
      st.lastY = e.clientY
      st.velX = 0
      st.velY = 0
      el.style.cursor = 'grabbing'
      if (el.setPointerCapture) el.setPointerCapture(e.pointerId)
    }
    const move = (e) => {
      if (!st.dragging) return
      const dx = e.clientX - st.lastX
      const dy = e.clientY - st.lastY
      st.lastX = e.clientX
      st.lastY = e.clientY
      st.yaw += dx * sensitivity
      st.pitch = clamp(st.pitch + dy * sensitivity, -maxPitch, maxPitch)
      st.velX = dx * sensitivity
      st.velY = dy * sensitivity
    }
    const up = (e) => {
      st.dragging = false
      el.style.cursor = 'grab'
      if (el.releasePointerCapture && e.pointerId != null) {
        try {
          el.releasePointerCapture(e.pointerId)
        } catch (err) {
          /* pointer sudah dilepas browser */
        }
      }
    }

    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('pointerleave', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('pointerleave', up)
    }
  }, [gl, sensitivity, maxPitch])

  useFrame((three, dt) => {
    const g = group.current
    if (!g) return
    const st = s.current
    const step = Math.min(dt, 0.05)

    if (!st.dragging) {
      st.yaw += st.velX
      st.pitch = clamp(st.pitch + st.velY, -maxPitch, maxPitch)
      st.velX *= 0.93
      st.velY *= 0.93
      if (!PREFERS_REDUCED) st.yaw += autoSpin * step
      st.pitch = damp(st.pitch, three.pointer.y * 0.16, 2.2, step)
    }

    g.rotation.y = damp(g.rotation.y, st.yaw, 9, step)
    g.rotation.x = damp(g.rotation.x, st.pitch, 9, step)
    g.position.x = damp(g.position.x, three.pointer.x * 0.12, 2, step)
  })

  return <group ref={group}>{children}</group>
}
