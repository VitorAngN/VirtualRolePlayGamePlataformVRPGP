import { useState } from 'react'
import Launcher from './components/Launcher'
import VTT from './components/VTT'

type Screen = 'launcher' | 'vtt'

export default function App() {
  const [screen, setScreen] = useState<Screen>('launcher')
  const [worldId, setWorldId] = useState<string | null>(null)

  if (screen === 'vtt' && worldId) {
    return <VTT worldId={worldId} onExit={() => setScreen('launcher')} />
  }

  return <Launcher onEnterWorld={(nextWorldId) => { setWorldId(nextWorldId); setScreen('vtt') }} />
}
