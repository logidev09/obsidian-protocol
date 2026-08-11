import { PALETTE } from './palette'

export default function Rig({ intensity = 1 }) {
  return (
    <>
      <ambientLight intensity={0.34 * intensity} color="#8ea0b8" />
      <hemisphereLight args={['#20303f', '#05070a', 0.5 * intensity]} />
      <directionalLight position={[4, 6, 5]} intensity={1.15 * intensity} color="#cfe4ea" />
      <pointLight position={[-5, -2, 3]} intensity={2.4 * intensity} color={PALETTE.accent} distance={16} decay={2} />
      <pointLight position={[4.5, -3, -3]} intensity={1.7 * intensity} color={PALETTE.amber} distance={15} decay={2} />
      <pointLight position={[0, 5, -5]} intensity={1.2 * intensity} color={PALETTE.violet} distance={18} decay={2} />
    </>
  )
}
