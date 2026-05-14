import { usePanelManager } from '../hooks/usePanelManager'
import LeftToolbar from './LeftToolbar'
import ChatPanel, { ChatToggleButton } from './ChatPanel'
import ScenesPanel, { ScenesToggleButton } from './ScenesPanel'
import MacroBar from './MacroBar'
import styles from './VTT.module.css'

// ──────────────────────────────────────────────
//  Botão genérico da rail direita
// ──────────────────────────────────────────────
function RightTabBtn({ icon, title }: { icon: string; title: string }) {
  return (
    <button title={title} className={styles.rightTabBtn}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d={icon} />
      </svg>
    </button>
  )
}

const RIGHT_TABS = [
  { id: 'actors',   title: 'Atores',     icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'items',    title: 'Itens',      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { id: 'journal',  title: 'Diário',     icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { id: 'tables',   title: 'Tabelas',    icon: 'M3 10h18M3 14h18M10 3v18' },
  { id: 'cards',    title: 'Cartas',     icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { id: 'combat',   title: 'Combate',    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { id: 'settings', title: 'Configurar', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

// ──────────────────────────────────────────────
//  VTT — tela principal
// ──────────────────────────────────────────────
export default function VTT({ onExit }: { onExit: () => void }) {
  const { activePanel, exitingPanel, togglePanel } = usePanelManager()

  return (
    <div className={styles.root} id="vtt-root">

      {/* Mapa */}
      <div className={styles.mapCanvas} id="map-canvas">
        <span className={styles.mapPlaceholder}>Mapa do Mundo</span>
      </div>

      {/* Toolbar esquerda */}
      <LeftToolbar />

      {/* Rail direita — sempre na frente (z-index 200) */}
      <div className={styles.rightRail} id="right-rail">
        <ChatToggleButton
          isOpen={activePanel === 'chat'}
          onToggle={() => togglePanel('chat')}
        />
        <ScenesToggleButton
          isOpen={activePanel === 'scenes'}
          onToggle={() => togglePanel('scenes')}
        />

        <div className={styles.rightRailDivider} />

        {RIGHT_TABS.map(tab => (
          <RightTabBtn key={tab.id} title={tab.title} icon={tab.icon} />
        ))}

        <div className={styles.rightRailDivider} />

        <button className={styles.exitBtn} title="Voltar ao Launcher" onClick={onExit}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {/* Painéis laterais — renderização condicional para evitar sobreposição */}
      {(activePanel === 'chat' || exitingPanel === 'chat') && (
        <ChatPanel
          isOpen={activePanel === 'chat'}
          isExiting={exitingPanel === 'chat'}
        />
      )}
      
      {(activePanel === 'scenes' || exitingPanel === 'scenes') && (
        <ScenesPanel
          isOpen={activePanel === 'scenes'}
          isExiting={exitingPanel === 'scenes'}
        />
      )}

      <MacroBar />
    </div>
  )
}
