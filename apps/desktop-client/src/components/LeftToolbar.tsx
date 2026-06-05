import type { ReactNode } from 'react'
import styles from './LeftToolbar.module.css'

export type ToolId = 'token' | 'measure' | 'draw' | 'tiles' | 'lights'

interface ToolBtnProps {
  id: ToolId
  active: boolean
  title: string
  onClick: (id: ToolId) => void
  children: ReactNode
}

function ToolBtn({ id, active, title, onClick, children }: ToolBtnProps) {
  return (
    <button
      id={`tool-${id}`}
      title={title}
      type="button"
      className={`${styles.toolBtn} ${active ? styles.active : ''}`}
      onClick={() => onClick(id)}
    >
      {children}
    </button>
  )
}

const Icons: Record<ToolId, string> = {
  token: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  measure: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z M14.06 4.94l1.41-1.41a2 2 0 012.83 0l2.17 2.17a2 2 0 010 2.83l-1.41 1.41',
  draw: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
  tiles: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
  lights: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
}

const TOOLS: { id: ToolId; title: string }[] = [
  { id: 'token', title: 'Token (T)' },
  { id: 'measure', title: 'Regua / Medicao (M)' },
  { id: 'draw', title: 'Desenho (D)' },
  { id: 'tiles', title: 'Tiles (L)' },
  { id: 'lights', title: 'Iluminacao (I)' },
]

export default function LeftToolbar({
  activeTool,
  onToolChange,
}: {
  activeTool: ToolId
  onToolChange: (tool: ToolId) => void
}) {
  return (
    <nav className={styles.toolbar} id="left-toolbar" aria-label="Ferramentas do mapa">
      {TOOLS.map(tool => (
        <ToolBtn
          key={tool.id}
          id={tool.id}
          title={tool.title}
          active={activeTool === tool.id}
          onClick={onToolChange}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="18"
            height="18"
          >
            <path d={Icons[tool.id]} />
          </svg>
        </ToolBtn>
      ))}
    </nav>
  )
}
