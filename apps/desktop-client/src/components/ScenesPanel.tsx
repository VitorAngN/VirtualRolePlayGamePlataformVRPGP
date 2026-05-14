import { useRef, useState } from 'react'
import type { Scene } from './scenes/types'
import CreateSceneModal from './scenes/CreateSceneModal'
import SceneConfigModal from './scenes/SceneConfigModal'
import styles from './ScenesPanel.module.css'

// ──────────────────────────────────────────────
//  Dados demo
// ──────────────────────────────────────────────
const DEMO_SCENES: Scene[] = [
  { id: 1,  name: 'Mapas das aventuras do livro ri…', active: true },
  { id: 2,  name: 'MAPAS GERAIS DE FAERUN 2', folder: true },
  { id: 3,  name: 'Barracks and Storage',  dims: '20×19' },
  { id: 4,  name: "Calin's Herd" },
  { id: 5,  name: 'Caravan Roadblock 01b' },
  { id: 6,  name: 'Contraband Den',        dims: '17×17' },
  { id: 7,  name: 'Crossroads — Original Night' },
  { id: 8,  name: 'Decrepit Estate — Basement', dims: '16×…' },
  { id: 9,  name: 'FAERUN MAP' },
  { id: 10, name: 'Fallen Ancient Tree 07a' },
  { id: 11, name: 'Hearthside Tavern',     dims: '31×25' },
  { id: 12, name: 'Magic Forest — Winter' },
  { id: 13, name: 'Necropolis Dungeon 01' },
  { id: 14, name: 'Ordinary Dungeon Hall', dims: '14×20' },
  { id: 15, name: 'RavinaDaT' },
  { id: 16, name: 'Scene' },
  { id: 17, name: 'Scene (2)' },
  { id: 18, name: 'Temple Of True Gods',   dims: '28×39' },
  { id: 19, name: 'Thicke Road',           dims: '25×25' },
  { id: 20, name: 'Waterfall Night' },
  { id: 21, name: 'Winter Roadside',       dims: '34×24' },
  { id: 22, name: 'Winter Trail',          dims: '30×60' },
]

// ──────────────────────────────────────────────
//  Toggle button (exportado para VTT.tsx)
// ──────────────────────────────────────────────
export function ScenesToggleButton({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <button
      id="scenes-toggle-btn"
      className={`${styles.toggleBtn} ${isOpen ? styles.toggleBtnOpen : ''}`}
      onClick={onToggle}
      title={isOpen ? 'Fechar Scenes' : 'Scenes'}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" width="18" height="18"
      >
        <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    </button>
  )
}

// ──────────────────────────────────────────────
//  Painel principal
// ──────────────────────────────────────────────
export default function ScenesPanel({ isOpen, isExiting }: { isOpen: boolean; isExiting?: boolean }) {
  const [scenes, setScenes]           = useState<Scene[]>(DEMO_SCENES)
  const [search, setSearch]           = useState('')
  const [showCreate, setShowCreate]   = useState(false)
  const [configScene, setConfigScene] = useState<Scene | null>(null)
  const nextSceneId = useRef(DEMO_SCENES.length + 1)

  const filtered = scenes.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  function handleCreate(name: string) {
    const next: Scene = { id: nextSceneId.current, name, dims: '30×20' }
    nextSceneId.current += 1
    setScenes(prev => [...prev, next])
    setShowCreate(false)
    setConfigScene(next)
  }

  function handleSave(updated: Scene) {
    setScenes(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  const panelClass = [
    styles.panel,
    isOpen    ? styles.panelOpen    : '',
    isExiting ? styles.panelExiting : '',
  ].join(' ')

  return (
    <>
      <aside id="scenes-panel" className={panelClass} aria-hidden={!isOpen}>

        <div className={styles.panelHeader}>
          <button className={styles.headerBtn} onClick={() => setShowCreate(true)}>🎬 Create Scene</button>
          <button className={styles.headerBtn}>📁 Create Folder</button>
        </div>

        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input className={styles.searchInput} placeholder="Search Scenes" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className={styles.sceneList}>
          {filtered.map(scene => (
            <div
              key={scene.id}
              className={`${styles.sceneItem} ${scene.active ? styles.sceneActive : ''} ${scene.folder ? styles.sceneFolder : ''}`}
              onClick={() => !scene.folder && setConfigScene(scene)}
            >
              <span className={styles.sceneIcon}>{scene.folder ? '📂' : scene.active ? '▶' : '🗺'}</span>
              <span className={styles.sceneName}>{scene.name}</span>
              {scene.dims && <span className={styles.sceneDims}>[{scene.dims}]</span>}
            </div>
          ))}
        </div>

      </aside>

      {showCreate  && <CreateSceneModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {configScene && <SceneConfigModal scene={configScene} onClose={() => setConfigScene(null)} onSave={handleSave} />}
    </>
  )
}
