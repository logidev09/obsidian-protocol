import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { DPR } from './palette'

/**
 * Wadah canvas hemat resource.
 * Canvas baru di-mount saat section masuk viewport, dan frameloop berhenti
 * begitu keluar layar — supaya scroll tetap ringan walau ada 4 scene 3D.
 */
export default function Stage({
  children,
  camera = { position: [0, 0, 6], fov: 42 },
  className = '',
  hint
}) {
  const host = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = host.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setMounted(true)
      setActive(true)
      return undefined
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true)
        setActive(entry.isIntersecting)
      },
      { rootMargin: '220px 0px', threshold: 0.01 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className={`stage ${className}`} ref={host}>
      {mounted && (
        <Canvas
          dpr={DPR}
          camera={camera}
          frameloop={active ? 'always' : 'never'}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
      {hint && <span className="stage__hint">{hint}</span>}
    </div>
  )
}
