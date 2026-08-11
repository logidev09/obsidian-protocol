import { useAuth } from './AuthProvider'

export default function ConnectButton({ chain = 'ethereum' }) {
  const { shortAddress, loading, connect, disconnect, isSupabaseConfigured } = useAuth()

  if (shortAddress) {
    return (
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={disconnect}
        title="Disconnect wallet"
      >
        <span className="dot" />
        {shortAddress}
        {!isSupabaseConfigured && <span className="muted"> · preview</span>}
      </button>
    )
  }

  return (
    <button
      type="button"
      className="btn btn--primary btn--sm"
      onClick={() => connect(chain)}
      disabled={loading}
    >
      {loading ? 'Connecting…' : 'Connect wallet'}
    </button>
  )
}
