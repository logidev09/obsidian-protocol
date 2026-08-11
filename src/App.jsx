import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'

import Stage from './three/Stage'
import HeroCrystal from './three/HeroCrystal'
import LedgerGrid from './three/LedgerGrid'
import NetworkMesh from './three/NetworkMesh'
import VaultDevice from './three/VaultDevice'
import { AuthProvider } from './auth/AuthProvider'
import ConnectButton from './auth/ConnectButton'

const NAV = [
  { label: 'Protocol', href: '#protocol' },
  { label: 'Network', href: '#network' },
  { label: 'Vault', href: '#vault' }
]

function Header() {
  return (
    <header className="site-header">
      <div className="wrap site-header__inner">
        <a className="brand" href="#top" aria-label="OBSIDIAN Protocol home">
          <span className="brand__mark" aria-hidden="true" />
          OBSIDIAN
        </a>
        <nav className="site-nav" aria-label="Primary">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="site-nav__link">
              {item.label}
            </a>
          ))}
        </nav>
        <ConnectButton chain="ethereum" />
      </div>
    </header>
  )
}

function Hero({ scrollRef }) {
  return (
    <section className="section hero" id="top">
      <div className="hero__stage">
        <Stage hint="drag to orbit" className="hero__canvas">
          <HeroCrystal scrollRef={scrollRef} />
        </Stage>
      </div>
      <div className="wrap content hero__copy">
        <span className="eyebrow">Self-custody, engineered.</span>
        <h1 className="h1">
          A key vault that lives<br />outside your screen.
        </h1>
        <p className="lead">
          OBSIDIAN Protocol pairs a hardware-secured element with a settlement
          layer for on-chain assets — keys you hold, verifiable by design, and
          never in the cloud.
        </p>
        <div className="hero__actions">
          <a className="btn btn--primary" href="#protocol">Read the protocol</a>
          <a className="btn btn--ghost" href="#network">See the network</a>
        </div>
      </div>
    </section>
  )
}

function Protocol() {
  return (
    <section className="section" id="protocol">
      <div className="wrap">
        <div className="grid-2">
          <div className="content reveal">
            <span className="eyebrow">Settlement ledger</span>
            <h2 className="h2">Every settlement, auditable in real time.</h2>
            <p className="lead">
              The ledger renders as a living grid — each column a counterparty,
              each ripple a confirmation. Nothing is hidden behind a balance
              sheet you can't inspect.
            </p>
          </div>
          <div className="content">
            <Stage className="panel" hint="move your pointer">
              <LedgerGrid />
            </Stage>
          </div>
        </div>
      </div>
    </section>
  )
}

function Network() {
  return (
    <section className="section section--tight" id="network">
      <div className="wrap">
        <div className="grid-2">
          <div className="content">
            <Stage className="panel" hint="drag · hover a node">
              <NetworkMesh />
            </Stage>
          </div>
          <div className="content reveal">
            <span className="eyebrow">Validator mesh</span>
            <h2 className="h2">A lattice that trusts no single point.</h2>
            <p className="lead">
              Validators form a geodesic mesh. Hover any node to watch the
              network re-route around it — failure is a property of the
              topology, not an exception to handle.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Vault() {
  const [layer, setLayer] = useState(null)
  return (
    <section className="section" id="vault">
      <div className="wrap">
        <div className="grid-2">
          <div className="content reveal">
            <span className="eyebrow">Vault device</span>
            <h2 className="h2">Open it. Inspect it. Trust it.</h2>
            <p className="lead">
              The vault is built in layers — secure element, MPC board, power.
              Click to explode the stack and see exactly where each secret
              lives.
            </p>
            <p className="muted mono vault__readout">
              {layer ? `> selected: ${layer}` : '> select a layer'}
            </p>
          </div>
          <div className="content">
            <Stage className="panel" hint="click to explode · drag">
              <VaultDevice onLayer={setLayer} />
            </Stage>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__inner">
        <span className="brand brand--sm">OBSIDIAN</span>
        <span className="muted mono">© {new Date().getFullYear()} OBSIDIAN Protocol</span>
      </div>
    </footer>
  )
}

export default function App() {
  const scrollRef = useRef(0)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduce) return undefined

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    let raf = 0
    const loop = (time) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onScroll = ({ scroll, limit }) => {
      scrollRef.current = limit > 0 ? Math.min(1, Math.max(0, scroll / limit)) : 0
    }
    lenis.on('scroll', onScroll)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    if (!els.length || typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('is-in'))
      return undefined
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <AuthProvider>
      <div className="shell">
        <div className="ambient" aria-hidden="true" />
        <div className="noise" aria-hidden="true" />
        <Header />
        <main>
          <Hero scrollRef={scrollRef} />
          <hr className="rule" />
          <Protocol />
          <Network />
          <Vault />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}
