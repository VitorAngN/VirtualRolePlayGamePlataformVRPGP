import { useCallback, useEffect, useRef, useState } from 'react'

export type PanelId = 'chat' | 'scenes' | string

interface PanelManager {
  activePanel: PanelId | null
  exitingPanel: PanelId | null
  togglePanel: (id: PanelId) => void
}

export function usePanelManager(): PanelManager {
  const [state, setState] = useState<{ active: PanelId | null; exiting: PanelId | null }>({
    active: null,
    exiting: null,
  })
  const closeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    if (state.exiting) {
      closeTimerRef.current = window.setTimeout(() => {
        setState(prev => ({ ...prev, exiting: null }))
      }, 300)
    }

    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    }
  }, [state.exiting])

  const togglePanel = useCallback((id: PanelId) => {
    setState(prev => {
      if (prev.active === id) {
        return { active: null, exiting: id }
      }

      return {
        active: id,
        exiting: null,
      }
    })
  }, [])

  return {
    activePanel: state.active,
    exitingPanel: state.exiting,
    togglePanel,
  }
}
