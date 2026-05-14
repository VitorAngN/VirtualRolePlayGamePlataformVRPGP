import { useState } from 'react'
import Launcher from './components/Launcher'
import VTT from './components/VTT'

type Screen = 'launcher' | 'vtt'

export default function App() {
  const [screen, setScreen] = useState<Screen>('launcher')

  if (screen === 'vtt') {
    return <VTT onExit={() => setScreen('launcher')} />
  }

  return <Launcher onEnterWorld={() => setScreen('vtt')} />
}
