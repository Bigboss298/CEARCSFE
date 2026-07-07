let audioContext: AudioContext | null = null
let sirenInterval: number | null = null
let chimeTimeout: number | null = null

function getContext(): AudioContext {
  if (!audioContext) audioContext = new AudioContext()
  return audioContext
}

export async function initializeAudioContext(): Promise<boolean> {
  try {
    const ctx = getContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    return ctx.state === 'running'
  } catch {
    return false
  }
}

function playTone(frequency: number, durationMs: number, volume = 0.2) {
  const ctx = getContext()
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  gain.gain.value = volume
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start()
  oscillator.stop(ctx.currentTime + durationMs / 1000)
}

export function playFireSiren() {
  stopAllAudio()
  sirenInterval = window.setInterval(() => {
    playTone(880, 400, 0.25)
    window.setTimeout(() => playTone(440, 400, 0.25), 400)
  }, 800)
}

export function playMedicalChime() {
  stopAllAudio()
  playTone(660, 250, 0.2)
  window.setTimeout(() => playTone(880, 350, 0.2), 300)
  chimeTimeout = window.setTimeout(() => playTone(990, 450, 0.2), 700)
}

export function stopAllAudio() {
  if (sirenInterval) {
    window.clearInterval(sirenInterval)
    sirenInterval = null
  }
  if (chimeTimeout) {
    window.clearTimeout(chimeTimeout)
    chimeTimeout = null
  }
}
