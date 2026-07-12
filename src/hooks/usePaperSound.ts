import { useCallback, useEffect, useRef } from 'react'

type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext }

/**
 * Soft paper-turn audio. Prefers a recorded page-flip sample (assets/pageflip.wav);
 * falls back to a synthesized rustle until the sample decodes. Cover uses a gentle
 * low-pass sweep. `enabled` gates playback (mute toggle).
 */
export function usePaperSound(enabled: boolean) {
  const acRef = useRef<AudioContext | null>(null)
  const flipBufRef = useRef<AudioBuffer | null>(null)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const ensureCtx = useCallback((): AudioContext | null => {
    try {
      if (!acRef.current) {
        const Ctor = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext
        if (!Ctor) return null
        acRef.current = new Ctor()
      }
      return acRef.current
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    const ac = ensureCtx()
    if (!ac) return
    fetch('assets/pageflip.wav')
      .then((r) => r.arrayBuffer())
      .then((a) => ac.decodeAudioData(a))
      .then((buf) => { flipBufRef.current = buf })
      .catch(() => {})
  }, [ensureCtx])

  const noiseBuf = useCallback((ac: AudioContext, dur: number): AudioBuffer => {
    const sr = ac.sampleRate, n = Math.ceil(sr * dur)
    const buf = ac.createBuffer(1, n, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
    return buf
  }, [])

  // one soft filtered-noise sweep with a bell envelope (used for the cover)
  const brush = useCallback((ac: AudioContext, t0: number, dur: number, f0: number, f1: number, peak: number) => {
    const sr = ac.sampleRate
    const buf = ac.createBuffer(1, Math.ceil(sr * dur), sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const x = i / d.length
      const env = Math.sin(Math.PI * x)
      d[i] = (Math.random() * 2 - 1) * env * env
    }
    const src = ac.createBufferSource(); src.buffer = buf
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.5
    lp.frequency.setValueAtTime(f0, t0)
    lp.frequency.exponentialRampToValueAtTime(f1, t0 + dur)
    const g = ac.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(peak, t0 + dur * 0.32)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    src.connect(lp); lp.connect(g); g.connect(ac.destination)
    src.start(t0); src.stop(t0 + dur + 0.03)
  }, [])

  // synthesized gentle page rustle + whoosh
  const synthFlip = useCallback((ac: AudioContext) => {
    const sr = ac.sampleRate, now = ac.currentTime + 0.005
    const dur = 0.32, n = Math.ceil(sr * dur)
    const cbuf = ac.createBuffer(1, n, sr); const cd = cbuf.getChannelData(0)
    let lvl = 0
    for (let i = 0; i < n; i++) {
      const x = i / n
      const dens = 0.0018 + 0.011 * Math.sin(Math.PI * x) * Math.sin(Math.PI * x)
      if (Math.random() < dens) lvl = 1
      lvl *= 0.6
      cd[i] = (Math.random() * 2 - 1) * lvl
    }
    const csrc = ac.createBufferSource(); csrc.buffer = cbuf
    const chp = ac.createBiquadFilter(); chp.type = 'highpass'; chp.frequency.value = 320
    const clp = ac.createBiquadFilter(); clp.type = 'lowpass'; clp.frequency.value = 2200; clp.Q.value = 0.5
    const cg = ac.createGain()
    cg.gain.setValueAtTime(0.0001, now)
    cg.gain.linearRampToValueAtTime(0.05, now + dur * 0.4)
    cg.gain.linearRampToValueAtTime(0.0001, now + dur)
    csrc.connect(chp); chp.connect(clp); clp.connect(cg); cg.connect(ac.destination)
    csrc.start(now); csrc.stop(now + dur + 0.03)

    const wsrc = ac.createBufferSource(); wsrc.buffer = noiseBuf(ac, dur)
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.7
    bp.frequency.setValueAtTime(300, now)
    bp.frequency.linearRampToValueAtTime(820, now + dur * 0.42)
    bp.frequency.exponentialRampToValueAtTime(360, now + dur)
    const wg = ac.createGain()
    wg.gain.setValueAtTime(0.0001, now)
    wg.gain.linearRampToValueAtTime(0.05, now + dur * 0.42)
    wg.gain.linearRampToValueAtTime(0.0001, now + dur)
    wsrc.connect(bp); bp.connect(wg); wg.connect(ac.destination)
    wsrc.start(now); wsrc.stop(now + dur + 0.03)
  }, [noiseBuf])

  const play = useCallback((kind: 'cover' | 'page') => {
    if (!enabledRef.current) return
    const ac = ensureCtx()
    if (!ac) return
    try {
      if (ac.state === 'suspended') ac.resume()
      if (kind === 'cover') {
        brush(ac, ac.currentTime + 0.005, 0.5, 1500, 480, 0.05)
      } else if (flipBufRef.current) {
        const src = ac.createBufferSource(); src.buffer = flipBufRef.current
        const g = ac.createGain(); g.gain.value = 1
        src.connect(g); g.connect(ac.destination); src.start()
      } else {
        synthFlip(ac)
      }
    } catch {
      // ignore audio failures
    }
  }, [ensureCtx, brush, synthFlip])

  return play
}
