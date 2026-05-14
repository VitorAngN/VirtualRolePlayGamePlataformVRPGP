import { useState, useCallback, useEffect } from 'react'

export type PanelId = 'chat' | 'scenes' | string

interface PanelManager {
  activePanel: PanelId | null
  exitingPanel: PanelId | null
  togglePanel: (id: PanelId) => void
}

export function usePanelManager(): PanelManager {
  const [state, setState] = useState<{ active: PanelId | null; exiting: PanelId | null }>({
    active: null,
    exiting: null
  })

  // Limpa o estado de 'exiting' após a animação de saída (ou instantâneo se for troca)
  useEffect(() => {
    if (state.exiting) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, exiting: null }))
      }, 300) 
      return () => clearTimeout(timer)
    }
  }, [state.exiting])

  const togglePanel = useCallback((id: PanelId) => {
    setState(prev => {
      if (prev.active === id) {
        return { active: null, exiting: id }
      }
      return {
        active: id,
        exiting: null
      }
    })
  }, [])

  return {
    activePanel: state.active,
    exitingPanel: state.exiting,
    togglePanel
  }
}
