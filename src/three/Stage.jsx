import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { DPR, PALETTE } from './palette'

/**
 * Canvas yang hanya render saat terlihat di viewport.
 * Ini kunci supaya scroll tetap ringan walau ada 4 scene 3D di satu halaman.
 */
export default function Stage({
  children,
  camera = { position: [0, 0, 6], fov: 42 },
  className = '',
  style,
  eventSource
}) {
  const holder = useRef(null)
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const el = holder.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting)
        if (entry.isIntersecting) setMounted(true)
      },
      { rootMargin: '220px 0px', threshold: 0.01 }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={holder} className={`stage ${className}`} style={style}>
      {mounted && (
        <Canvas
          dpr={DPR}
          camera={camera}
          frameloop={visible ? 'always' : 'demand'}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            stencil: false
          }}
          onCreated={({ gl }) => gl.setClearColor(PALETTE.bg, 0)}
          eventSource={eventSource}
          style={{ pointerEvents: 'auto' }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
    </div>
  )
}
