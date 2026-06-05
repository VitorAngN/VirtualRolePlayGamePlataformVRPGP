import { useRef, useState, type ChangeEvent } from 'react'
import { resolveAssetUrl, type ApiAsset, type ApiSceneFolder } from '../../services/vttApi'
import type { Scene, SceneConfigTab } from './types'
import styles from '../ScenesPanel.module.css'

interface Props {
  scene: Scene
  mapAssets: ApiAsset[]
  sceneFolders?: ApiSceneFolder[]
  onClose: () => void
  onSave: (scene: Scene) => void
  onUploadMap?: (file: File, scene: Scene) => Promise<ApiAsset>
}

const TABS: { id: SceneConfigTab; label: string }[] = [
  { id: 'basics', label: 'Basico' },
  { id: 'grid', label: 'Grid' },
  { id: 'lighting', label: 'Iluminacao' },
  { id: 'ambience', label: 'Ambiente' },
  { id: 'mapexplorer', label: 'Exploracao' },
]

const DEFAULT_GRID_SIZE = 40
const DEFAULT_GRID_OPACITY = 0.35
const DEFAULT_SCENE_WIDTH = 1600
const DEFAULT_SCENE_HEIGHT = 1200
const DEFAULT_SCENE_PADDING = 0.25

function toPositiveInt(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function toNumber(value: string, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toRatio(value: string, fallback: number) {
  return Math.min(Math.max(toNumber(value, fallback), 0), 1)
}

function toScenePadding(value: string, fallback: number) {
  return Math.min(Math.max(toNumber(value, fallback), 0), 1.5)
}

function sceneDimensionToPixels(width: number | undefined, height: number | undefined, gridSize: number) {
  const rawWidth = Number(width ?? DEFAULT_SCENE_WIDTH)
  const rawHeight = Number(height ?? DEFAULT_SCENE_HEIGHT)
  const isLegacyCellSize = rawWidth > 0 && rawHeight > 0 && rawWidth <= 200 && rawHeight <= 200

  return {
    width: Math.round(isLegacyCellSize ? rawWidth * gridSize : rawWidth),
    height: Math.round(isLegacyCellSize ? rawHeight * gridSize : rawHeight),
  }
}

function readImageDimensions(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => reject(new Error('Nao consegui ler o tamanho da imagem.'))
    image.src = url
  })
}

export default function SceneConfigModal({ scene, mapAssets, sceneFolders = [], onClose, onSave, onUploadMap }: Props) {
  const initialGridSize = scene.gridSize ?? DEFAULT_GRID_SIZE
  const initialDimensions = sceneDimensionToPixels(scene.width, scene.height, initialGridSize)
  const [tab, setTab] = useState<SceneConfigTab>('basics')
  const [name, setName] = useState(scene.name)
  const [folderId, setFolderId] = useState(scene.folderId ?? '')
  const [backgroundAssetId, setBackgroundAssetId] = useState(scene.backgroundAssetId ?? '')
  const [foregroundAssetId, setForegroundAssetId] = useState(scene.foregroundAssetId ?? '')
  const [thumbnailAssetId, setThumbnailAssetId] = useState(scene.thumbnailAssetId ?? scene.backgroundAssetId ?? '')
  const [showNavigation, setShowNavigation] = useState(scene.showNavigation ?? true)
  const [permission, setPermission] = useState(scene.permission ?? 'gm')
  const [navigationName, setNavigationName] = useState(scene.navigationName ?? '')
  const [backgroundColor, setBackgroundColor] = useState(scene.backgroundColor ?? '#111111')
  const [preserveAspectRatio, setPreserveAspectRatio] = useState(scene.preserveAspectRatio ?? true)
  const [scenePadding, setScenePadding] = useState(String(scene.scenePadding ?? DEFAULT_SCENE_PADDING))
  const [backgroundElevation, setBackgroundElevation] = useState(String(scene.backgroundElevation ?? 0))
  const [foregroundElevation, setForegroundElevation] = useState(String(scene.foregroundElevation ?? 0))
  const [initialX, setInitialX] = useState(String(scene.initialX ?? 0))
  const [initialY, setInitialY] = useState(String(scene.initialY ?? 0))
  const [initialZoom, setInitialZoom] = useState(String(scene.initialZoom ?? 1))
  const [lockView, setLockView] = useState(scene.lockView ?? false)
  const [gridType, setGridType] = useState(scene.gridType ?? 'square')
  const [gridSize, setGridSize] = useState(String(initialGridSize))
  const [width, setWidth] = useState(String(initialDimensions.width))
  const [height, setHeight] = useState(String(initialDimensions.height))
  const [imageRatio, setImageRatio] = useState(
    initialDimensions.height > 0 ? initialDimensions.width / initialDimensions.height : 1,
  )
  const [gridOffsetX, setGridOffsetX] = useState(String(scene.gridOffsetX ?? 0))
  const [gridOffsetY, setGridOffsetY] = useState(String(scene.gridOffsetY ?? 0))
  const [gridColor, setGridColor] = useState(scene.gridColor ?? '#ffffff')
  const [gridOpacity, setGridOpacity] = useState(String(scene.gridOpacity ?? DEFAULT_GRID_OPACITY))
  const [gridDistance, setGridDistance] = useState(String(scene.gridDistance ?? 5))
  const [gridUnits, setGridUnits] = useState(scene.gridUnits ?? 'ft')
  const [darkness, setDarkness] = useState(String(scene.darkness ?? 0))
  const [globalLight, setGlobalLight] = useState(scene.globalLight ?? false)
  const [globalLightThreshold, setGlobalLightThreshold] = useState(String(scene.globalLightThreshold ?? 0))
  const [playlist, setPlaylist] = useState(scene.playlist ?? '')
  const [description, setDescription] = useState(scene.description ?? '')
  const [fogExploration, setFogExploration] = useState(scene.fogExploration ?? true)
  const [resetFogOnActivation, setResetFogOnActivation] = useState(scene.resetFogOnActivation ?? false)
  const [fogOverlayAssetId, setFogOverlayAssetId] = useState(scene.fogOverlayAssetId ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const availableMaps = mapAssets.filter(asset => asset.kind === 'map' && asset.content_type.startsWith('image/'))

  function buildScene(): Scene {
    const nextWidth = toPositiveInt(width, initialDimensions.width)
    const nextHeight = toPositiveInt(height, initialDimensions.height)
    const nextGridSize = toPositiveInt(gridSize, initialGridSize)

    return {
      ...scene,
      name: name.trim() || scene.name,
      folderId,
      backgroundAssetId,
      foregroundAssetId,
      thumbnailAssetId: thumbnailAssetId || backgroundAssetId,
      showNavigation,
      permission,
      navigationName: navigationName.trim(),
      backgroundColor,
      preserveAspectRatio,
      scenePadding: toScenePadding(scenePadding, DEFAULT_SCENE_PADDING),
      backgroundElevation: toNumber(backgroundElevation, 0),
      foregroundElevation: toNumber(foregroundElevation, 0),
      initialX: toNumber(initialX, 0),
      initialY: toNumber(initialY, 0),
      initialZoom: toNumber(initialZoom, 1),
      lockView,
      gridType,
      gridSize: nextGridSize,
      gridOffsetX: toNumber(gridOffsetX, 0),
      gridOffsetY: toNumber(gridOffsetY, 0),
      gridColor,
      gridOpacity: toRatio(gridOpacity, DEFAULT_GRID_OPACITY),
      gridDistance: toNumber(gridDistance, 5),
      gridUnits: gridUnits.trim() || 'ft',
      darkness: toRatio(darkness, 0),
      globalLight,
      globalLightThreshold: toRatio(globalLightThreshold, 0),
      playlist: playlist.trim(),
      description: description.trim(),
      fogExploration,
      resetFogOnActivation,
      fogOverlayAssetId,
      width: nextWidth,
      height: nextHeight,
      dims: `${nextWidth}x${nextHeight}`,
    }
  }

  function handleApply(closeAfterSave = false) {
    onSave(buildScene())
    if (closeAfterSave) onClose()
  }

  async function syncSizeFromMap(assetId = backgroundAssetId) {
    const asset = availableMaps.find(item => item.id === assetId)
    if (!asset) {
      setError('Escolha um mapa de fundo antes de ajustar o tamanho.')
      return
    }

    setError('')
    try {
      const dimensions = await readImageDimensions(resolveAssetUrl(asset.url))
      setImageRatio(dimensions.width / dimensions.height)
      setWidth(String(dimensions.width))
      setHeight(String(dimensions.height))
    } catch {
      setError('Nao consegui ler as dimensoes desse mapa.')
    }
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !onUploadMap) return

    setUploading(true)
    setError('')
    try {
      const asset = await onUploadMap(file, scene)
      setBackgroundAssetId(asset.id)
      setThumbnailAssetId(asset.id)
      const localUrl = URL.createObjectURL(file)
      try {
        const dimensions = await readImageDimensions(localUrl)
        setImageRatio(dimensions.width / dimensions.height)
        setWidth(String(dimensions.width))
        setHeight(String(dimensions.height))
      } finally {
        URL.revokeObjectURL(localUrl)
      }
    } catch {
      setError('Nao consegui salvar esse mapa no disco.')
    } finally {
      setUploading(false)
    }
  }

  function handleWidthChange(value: string) {
    setWidth(value)
    if (!preserveAspectRatio) return

    const nextWidth = Number(value)
    if (Number.isFinite(nextWidth) && nextWidth > 0 && imageRatio > 0) {
      setHeight(String(Math.max(1, Math.round(nextWidth / imageRatio))))
    }
  }

  function handleHeightChange(value: string) {
    setHeight(value)
    if (!preserveAspectRatio) return

    const nextHeight = Number(value)
    if (Number.isFinite(nextHeight) && nextHeight > 0 && imageRatio > 0) {
      setWidth(String(Math.max(1, Math.round(nextHeight * imageRatio))))
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.modalLarge}`} onClick={event => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{name || 'Cena'}</span>
          <div className={styles.modalHeaderIcons}>
            <button className={styles.iconBtn} title="Permissoes" type="button">P</button>
            <button className={styles.iconBtn} title="Duplicar" type="button" disabled>D</button>
            <button className={styles.iconBtn} title="Exportar" type="button" disabled>E</button>
          </div>
          <button className={styles.modalClose} onClick={onClose} type="button">x</button>
        </div>

        <div className={styles.tabBar}>
          {TABS.map(item => (
            <button
              key={item.id}
              className={`${styles.tab} ${tab === item.id ? styles.tabActive : ''}`}
              onClick={() => setTab(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={styles.modalBody}>
          {tab === 'basics' && (
            <div className={styles.tabContent}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Nome da cena</label>
                <input className={styles.formInput} value={name} onChange={event => setName(event.target.value)} />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Permissoes</label>
                <div className={styles.permRow}>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={showNavigation} onChange={event => setShowNavigation(event.target.checked)} />
                    Mostrar na navegacao
                  </label>
                  <select className={styles.formSelectSm} value={permission} onChange={event => setPermission(event.target.value)}>
                    <option value="gm">Mestre</option>
                    <option value="players">Jogadores</option>
                    <option value="observer">Observador</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Pasta</label>
                <select className={styles.formSelect} value={folderId} onChange={event => setFolderId(event.target.value)}>
                  <option value="">Sem pasta</option>
                  {sceneFolders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                </select>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Nome na navegacao</label>
                <input className={styles.formInput} value={navigationName} onChange={event => setNavigationName(event.target.value)} placeholder="Mesmo nome da cena" />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Mapa de fundo</label>
                <div className={styles.fileRow}>
                  <select className={styles.formSelect} value={backgroundAssetId} onChange={event => setBackgroundAssetId(event.target.value)}>
                    <option value="">Sem mapa</option>
                    {availableMaps.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                  </select>
                  <button className={styles.fileBtn} type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? '...' : 'Enviar'}
                  </button>
                  <button className={styles.fileBtn} type="button" onClick={() => syncSizeFromMap()} disabled={!backgroundAssetId}>
                    Tamanho
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />
                </div>
                {availableMaps.length === 0 && <span className={styles.formHint}>Nenhum mapa salvo ainda. Envie uma imagem para usar como fundo.</span>}
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Imagem de primeiro plano</label>
                <select className={styles.formSelect} value={foregroundAssetId} onChange={event => setForegroundAssetId(event.target.value)}>
                  <option value="">Sem imagem</option>
                  {availableMaps.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                </select>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Thumbnail da lista</label>
                <select className={styles.formSelect} value={thumbnailAssetId} onChange={event => setThumbnailAssetId(event.target.value)}>
                  <option value="">Usar mapa de fundo</option>
                  {availableMaps.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                </select>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Cor de fundo</label>
                <div className={styles.colorRow}>
                  <input className={styles.formInput} value={backgroundColor} onChange={event => setBackgroundColor(event.target.value)} />
                  <input type="color" value={backgroundColor} onChange={event => setBackgroundColor(event.target.value)} className={styles.colorPicker} />
                </div>
              </div>

              <div className={styles.checkboxCard}>
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={preserveAspectRatio} onChange={event => setPreserveAspectRatio(event.target.checked)} />
                  Manter proporcao da imagem ao redimensionar
                </label>
              </div>

              <div className={styles.formRowHalf}>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Elevacao fundo</label>
                  <input className={styles.formInput} type="number" value={backgroundElevation} onChange={event => setBackgroundElevation(event.target.value)} />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Elevacao frente</label>
                  <input className={styles.formInput} type="number" value={foregroundElevation} onChange={event => setForegroundElevation(event.target.value)} />
                </div>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Posicao inicial da visao</label>
                <div className={styles.posRow}>
                  <span className={styles.posLabel}>X</span>
                  <input className={styles.formInputSm} type="number" value={initialX} onChange={event => setInitialX(event.target.value)} />
                  <span className={styles.posLabel}>Y</span>
                  <input className={styles.formInputSm} type="number" value={initialY} onChange={event => setInitialY(event.target.value)} />
                  <span className={styles.posLabel}>Zoom</span>
                  <input className={styles.formInputSm} type="number" step="0.1" value={initialZoom} onChange={event => setInitialZoom(event.target.value)} />
                </div>
              </div>

              <div className={styles.checkboxCard}>
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={lockView} onChange={event => setLockView(event.target.checked)} />
                  Travar pan e zoom desta cena
                </label>
              </div>

              {error && <div className={styles.errorBox}>{error}</div>}
            </div>
          )}

          {tab === 'grid' && (
            <div className={styles.tabContent}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Tipo de grid</label>
                <select className={styles.formSelect} value={gridType} onChange={event => setGridType(event.target.value)}>
                  <option value="gridless">Sem grid</option>
                  <option value="square">Quadrado</option>
                  <option value="hex-r">Hexagonal linha</option>
                  <option value="hex-c">Hexagonal coluna</option>
                </select>
              </div>

              <div className={styles.formRowHalf}>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Largura do mapa (px)</label>
                  <input className={styles.formInput} type="number" min={100} value={width} onChange={event => handleWidthChange(event.target.value)} />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Altura do mapa (px)</label>
                  <input className={styles.formInput} type="number" min={100} value={height} onChange={event => handleHeightChange(event.target.value)} />
                </div>
              </div>

              <div className={styles.checkboxCard}>
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={preserveAspectRatio} onChange={event => setPreserveAspectRatio(event.target.checked)} />
                  Manter proporcao ao alterar largura/altura
                </label>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Margem do canvas - {(toScenePadding(scenePadding, DEFAULT_SCENE_PADDING) * 100).toFixed(0)}%</label>
                <input
                  className={styles.formInput}
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.05}
                  value={scenePadding}
                  onChange={event => setScenePadding(event.target.value)}
                />
                <span className={styles.formHint}>Aumenta a area ao redor do mapa. O grid cobre essa margem tambem.</span>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Tamanho do grid em pixels</label>
                <input className={styles.formInput} type="number" min={16} value={gridSize} onChange={event => setGridSize(event.target.value)} />
              </div>

              <div className={styles.formRowHalf}>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Offset X</label>
                  <input className={styles.formInput} type="number" value={gridOffsetX} onChange={event => setGridOffsetX(event.target.value)} />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Offset Y</label>
                  <input className={styles.formInput} type="number" value={gridOffsetY} onChange={event => setGridOffsetY(event.target.value)} />
                </div>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Cor do grid</label>
                <div className={styles.colorRow}>
                  <input className={styles.formInput} value={gridColor} onChange={event => setGridColor(event.target.value)} />
                  <input type="color" value={gridColor} onChange={event => setGridColor(event.target.value)} className={styles.colorPicker} />
                </div>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Opacidade do grid - {(toRatio(gridOpacity, DEFAULT_GRID_OPACITY) * 100).toFixed(0)}%</label>
                <input className={styles.formInput} type="range" min={0} max={1} step={0.05} value={gridOpacity} onChange={event => setGridOpacity(event.target.value)} />
              </div>

              <div className={styles.formRowHalf}>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Distancia</label>
                  <input className={styles.formInput} type="number" min={0} value={gridDistance} onChange={event => setGridDistance(event.target.value)} />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Unidade</label>
                  <input className={styles.formInput} value={gridUnits} onChange={event => setGridUnits(event.target.value)} />
                </div>
              </div>
            </div>
          )}

          {tab === 'lighting' && (
            <div className={styles.tabContent}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Escuridao - {(toRatio(darkness, 0) * 100).toFixed(0)}%</label>
                <input className={styles.formInput} type="range" min={0} max={1} step={0.05} value={darkness} onChange={event => setDarkness(event.target.value)} />
              </div>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={globalLight} onChange={event => setGlobalLight(event.target.checked)} />
                Iluminacao global
              </label>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Limite da iluminacao global - {(toRatio(globalLightThreshold, 0) * 100).toFixed(0)}%</label>
                <input className={styles.formInput} type="range" min={0} max={1} step={0.05} value={globalLightThreshold} onChange={event => setGlobalLightThreshold(event.target.value)} />
              </div>
            </div>
          )}

          {tab === 'ambience' && (
            <div className={styles.tabContent}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Playlist</label>
                <input className={styles.formInput} value={playlist} onChange={event => setPlaylist(event.target.value)} placeholder="Nome da playlist local" />
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Descricao da cena</label>
                <textarea className={styles.formTextarea} rows={5} value={description} onChange={event => setDescription(event.target.value)} />
              </div>
            </div>
          )}

          {tab === 'mapexplorer' && (
            <div className={styles.tabContent}>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={fogExploration} onChange={event => setFogExploration(event.target.checked)} />
                Exploracao por nevoa
              </label>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={resetFogOnActivation} onChange={event => setResetFogOnActivation(event.target.checked)} />
                Resetar nevoa ao ativar
              </label>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Overlay de nevoa</label>
                <select className={styles.formSelect} value={fogOverlayAssetId} onChange={event => setFogOverlayAssetId(event.target.value)}>
                  <option value="">Sem overlay</option>
                  {availableMaps.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose} type="button">Cancelar</button>
          <button className={styles.primaryBtn} onClick={() => handleApply(false)} type="button">Aplicar</button>
          <button className={styles.primaryBtn} onClick={() => handleApply(true)} type="button">Salvar</button>
        </div>
      </div>
    </div>
  )
}
