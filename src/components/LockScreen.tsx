import { useState, type CSSProperties, type FormEvent } from 'react'

const ROOT_BG =
  'radial-gradient(120% 90% at 50% 4%, rgba(120,116,180,0.35), rgba(120,116,180,0) 55%), linear-gradient(165deg, #42406f 0%, #2f3560 38%, #232a52 68%, #171c39 100%)'

const cardStyle: CSSProperties = {
  width: 340, maxWidth: '86vw', padding: '30px 28px 26px', borderRadius: 14,
  background: '#f4ecd6', boxShadow: '0 30px 80px -30px rgba(4,6,22,0.85)',
  display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center',
}

const inputStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8,
  border: '1px solid rgba(58,55,48,0.25)', background: '#fffdf6',
  font: "400 18px Caveat,'ZCOOL KuaiLe',cursive", color: '#3a3730', outline: 'none',
}

const btnStyle: CSSProperties = {
  width: '100%', padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: '#7fa86a', color: '#fbf6e7', font: "400 15px 'Special Elite','ZCOOL KuaiLe',monospace",
  letterSpacing: '1px',
}

/** Shared-password gate shown before the journal syncs with the server. */
export default function LockScreen({ onUnlock }: { onUnlock: (pw: string) => Promise<boolean> }) {
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!pw || busy) return
    setBusy(true)
    setError(false)
    const ok = await onUnlock(pw)
    if (!ok) { setError(true); setPw('') }
    setBusy(false)
  }

  return (
    <div
      className="relative box-border flex h-full w-full flex-col items-center justify-center overflow-hidden px-5 font-hand"
      style={{ background: ROOT_BG }}
    >
      <form style={cardStyle} onSubmit={submit}>
        <div style={{ font: "400 30px Caveat,'ZCOOL KuaiLe',cursive", color: '#3a3730' }}>The Dreaming Scallion</div>
        <div style={{ font: "400 13px 'Special Elite','ZCOOL KuaiLe',monospace", color: 'rgba(58,55,48,0.6)', letterSpacing: '.5px' }}>
          Enter your password to open the journal
        </div>
        <input
          type="password" value={pw} autoFocus disabled={busy}
          onChange={(e) => setPw(e.target.value)}
          placeholder="password" style={inputStyle}
        />
        {error && (
          <div style={{ font: "400 13px 'Special Elite','ZCOOL KuaiLe',monospace", color: '#b4553f' }}>
            Wrong password — try again
          </div>
        )}
        <button type="submit" disabled={busy || !pw} style={{ ...btnStyle, opacity: busy || !pw ? 0.6 : 1 }}>
          {busy ? 'opening…' : 'open'}
        </button>
      </form>
    </div>
  )
}
