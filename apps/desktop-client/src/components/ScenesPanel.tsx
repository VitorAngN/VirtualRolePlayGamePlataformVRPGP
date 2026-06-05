import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { resolveAssetUrl, type ApiAsset, type ApiSceneFolder } from '../services/vttApi'
import type { Scene } from './scenes/types'
import CreateSceneModal from './scenes/CreateSceneModal'
import SceneConfigModal from './scenes/SceneConfigModal'
import styles from './ScenesPanel.module.css'

export function ScenesToggleButton({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <button
      id="scenes-toggle-btn"
      className={`${styles.toggleBtn} ${isOpen ? styles.toggleBtnOpen : ''}`}
      onClick={onToggle}
      title={isOpen ? 'Fechar cenas' : 'Cenas'}
      type="button"
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
        <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    </button>
  )
}

interface ScenesPanelProps {
  isOpen: boolean
  isExiting?: boolean
  scenes: Scene[]
  sceneFolders?: ApiSceneFolder[]
  activeSceneId?: string
  mapAssets?: ApiAsset[]
  onActivateScene?: (scene: Scene) => void
  onCreateScene?: (name: string) => void
  onCreateFolder?: (name: string) => void
  onDeleteFolder?: (folder: ApiSceneFolder) => void
  onSaveScene?: (scene: Scene) => void
  onDuplicateScene?: (scene: Scene) => void
  onDeleteScene?: (scene: Scene) => void
  onUploadSceneMap?: (file: File, scene: Scene) => Promise<ApiAsset>
}

export default function ScenesPanel({
  isOpen,
  isExiting,
  scenes,
  sceneFolders = [],
  activeSceneId,
  mapAssets = [],
  onActivateScene,
  onCreateScene,
  onCreateFolder,
  onDeleteFolder,
  onSaveScene,
  onDuplicateScene,
  onDeleteScene,
  onUploadSceneMap,
}: ScenesPanelProps) {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [configScene, setConfigScene] = useState<Scene | null>(null)
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({})
  const [contextMenu, setContextMenu] = useState<{ scene: Scene; x: number; y: number } | null>(null)

  const normalizedSearch = search.trim().toLowerCase()
  const unfiledScenes = scenes.filter(scene => !scene.folderId)
  const visibleUnfiledScenes = filterScenes(unfiledScenes)
  const groupedFolders = useMemo(() => (
    sceneFolders.map(folder => {
      const folderScenes = scenes.filter(scene => scene.folderId === folder.id)
      const folderMatches = folder.name.toLowerCase().includes(normalizedSearch)
      return {
        folder,
        scenes: folderMatches ? folderScenes : folderScenes.filter(scene => scene.name.toLowerCase().includes(normalizedSearch)),
        folderMatches,
      }
    })
  ), [sceneFolders, scenes, normalizedSearch])
  const hasVisibleScenes = visibleUnfiledScenes.length > 0 || groupedFolders.some(group => group.folderMatches || group.scenes.length > 0)

  const panelClass = [
    styles.panel,
    isOpen ? styles.panelOpen : '',
    isExiting ? styles.panelExiting : '',
  ].join(' ')

  function handleCreate(name: string) {
    setShowCreate(false)
    onCreateScene?.(name)
  }

  function handleSave(scene: Scene) {
    onSaveScene?.(scene)
  }

  function filterScenes(list: Scene[]) {
    if (!normalizedSearch) return list
    return list.filter(scene => scene.name.toLowerCase().includes(normalizedSearch))
  }

  function openContextMenu(event: MouseEvent<HTMLElement>, scene: Scene) {
    event.preventDefault()
    event.stopPropagation()
    setContextMenu({ scene, x: event.clientX, y: event.clientY })
  }

  function handleCreateFolder() {
    const name = window.prompt('Nome da pasta de cenas')
    if (!name?.trim()) return
    onCreateFolder?.(name.trim())
  }

  function thumbnailFor(scene: Scene) {
    const thumbnailAssetId = scene.thumbnailAssetId || scene.backgroundAssetId
    const asset = thumbnailAssetId ? mapAssets.find(item => item.id === thumbnailAssetId) : undefined
    return asset?.content_type.startsWith('image/') ? resolveAssetUrl(asset.url) : ''
  }

  function toggleFolder(folderId: string) {
    setCollapsedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }))
  }

  useEffect(() => {
    function closeContextMenu() {
      setContextMenu(null)
    }

    window.addEventListener('click', closeContextMenu)
    return () => window.removeEventListener('click', closeContextMenu)
  }, [])

  function renderScene(scene: Scene) {
    const thumb = thumbnailFor(scene)

    return (
      <div
        key={scene.id}
        className={`${styles.sceneItem} ${scene.id === activeSceneId ? styles.sceneActive : ''}`}
        onClick={() => onActivateScene?.(scene)}
        onContextMenu={event => openContextMenu(event, scene)}
      >
        <div className={styles.sceneThumb} style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}>
          {!thumb && <span>{scene.id === activeSceneId ? 'ON' : 'MAP'}</span>}
        </div>
        <div className={styles.sceneMeta}>
          <span className={styles.sceneName}>{scene.navigationName || scene.name}</span>
          <span className={styles.sceneSubline}>
            {scene.dims ?? 'sem tamanho'} {scene.showNavigation === false ? '- oculta' : '- fixada'}
          </span>
        </div>
        <button
          className={styles.sceneConfigBtn}
          title="Configurar cena"
          type="button"
          onClick={event => {
            event.stopPropagation()
            setConfigScene(scene)
          }}
        >
          ...
        </button>
      </div>
    )
  }

  return (
    <>
      <aside id="scenes-panel" className={panelClass} aria-hidden={!isOpen}>
        <div className={styles.panelHeader}>
          <button className={styles.headerBtn} onClick={() => setShowCreate(true)} type="button">
            + Criar cena
          </button>
          <button className={styles.headerBtn} onClick={handleCreateFolder} type="button">
            + Criar pasta
          </button>
        </div>

        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input className={styles.searchInput} placeholder="Buscar cenas" value={search} onChange={event => setSearch(event.target.value)} />
        </div>

        <div className={styles.sceneList}>
          {!hasVisibleScenes && (
            <div className={styles.emptyState}>
              <strong>Nenhuma cena encontrada.</strong>
              <span>Crie uma cena ou ajuste a busca.</span>
            </div>
          )}

          {groupedFolders.map(group => {
            if (!group.folderMatches && group.scenes.length === 0) return null
            const isCollapsed = collapsedFolders[group.folder.id] && !normalizedSearch
            return (
              <div className={styles.folderGroup} key={group.folder.id}>
                <div className={styles.sceneFolder}>
                  <button className={styles.folderToggle} onClick={() => toggleFolder(group.folder.id)} type="button">
                    {isCollapsed ? '>' : 'v'}
                  </button>
                  <span>{group.folder.name}</span>
                  <button
                    className={styles.folderDeleteBtn}
                    title="Apagar pasta"
                    type="button"
                    onClick={() => onDeleteFolder?.(group.folder)}
                  >
                    x
                  </button>
                </div>
                {!isCollapsed && group.scenes.map(renderScene)}
              </div>
            )
          })}

          {visibleUnfiledScenes.length > 0 && (
            <div className={styles.folderGroup}>
              {sceneFolders.length > 0 && <div className={styles.sceneFolderMuted}>Sem pasta</div>}
              {visibleUnfiledScenes.map(renderScene)}
            </div>
          )}
        </div>
      </aside>

      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={event => event.stopPropagation()}
        >
          <button type="button" onClick={() => { onActivateScene?.(contextMenu.scene); setContextMenu(null) }}>
            Ativar
          </button>
          <button type="button" onClick={() => { setConfigScene(contextMenu.scene); setContextMenu(null) }}>
            Configurar
          </button>
          <button type="button" onClick={() => { onSaveScene?.({ ...contextMenu.scene, showNavigation: contextMenu.scene.showNavigation === false }); setContextMenu(null) }}>
            {contextMenu.scene.showNavigation === false ? 'Fixar na navegacao' : 'Ocultar da navegacao'}
          </button>
          <button type="button" onClick={() => { onDuplicateScene?.(contextMenu.scene); setContextMenu(null) }}>
            Duplicar
          </button>
          <button className={styles.contextDanger} type="button" onClick={() => { onDeleteScene?.(contextMenu.scene); setContextMenu(null) }}>
            Apagar
          </button>
        </div>
      )}

      {showCreate && <CreateSceneModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {configScene && (
        <SceneConfigModal
          scene={configScene}
          mapAssets={mapAssets}
          sceneFolders={sceneFolders}
          onClose={() => setConfigScene(null)}
          onSave={handleSave}
          onUploadMap={onUploadSceneMap}
        />
      )}
    </>
  )
}
