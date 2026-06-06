import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type WheelEvent } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { usePanelManager } from '../hooks/usePanelManager'
import LeftToolbar, { type ToolId } from './LeftToolbar'
import ChatPanel, { ChatToggleButton } from './ChatPanel'
import ScenesPanel, { ScenesToggleButton } from './ScenesPanel'
import AssetsPanel, { AssetsToggleButton } from './AssetsPanel'
import ActorsPanel from './ActorsPanel'
import ActorCreateDialog from './ActorCreateDialog'
import ActorSheetWindow from './ActorSheetWindow'
import MacroBar, { type MacroAction } from './MacroBar'
import type { Scene } from './scenes/types'
import {
  broadcastCompanionEvent,
  createActor,
  createCompanionSession,
  createMessage,
  createScene,
  createSceneFolder,
  deleteAsset,
  deleteMessage,
  deleteScene,
  deleteSceneFolder,
  duplicateScene,
  getWorldSnapshot,
  onCompanionEvent,
  patchScene,
  patchActor,
  patchToken,
  resolveAssetUrl,
  uploadAsset,
  type ApiActor,
  type ApiAsset,
  type ApiChatMessage,
  type ApiCompanionPermissions,
  type ApiCompanionSessionLink,
  type ApiGameSystem,
  type ApiScene,
  type ApiSceneFolder,
  type ApiToken,
  type CreateActorPayload,
} from '../services/vttApi'
import styles from './VTT.module.css'

const DEFAULT_GRID_SIZE = 40
const DEFAULT_GRID_OPACITY = 0.35
const DEFAULT_SCENE_WIDTH = 1600
const DEFAULT_SCENE_HEIGHT = 1200
const DEFAULT_SCENE_PADDING = 0.25
const MIN_ABSOLUTE_ZOOM = 0.12
const MAX_ZOOM = 4

const DEFAULT_COMPANION_PERMISSIONS: ApiCompanionPermissions = {
  view_actor: true,
  adjust_hp: true,
  roll: true,
  patch_actor: false,
  chat: false,
}

const COMPANION_PERMISSION_OPTIONS: Array<{ id: keyof ApiCompanionPermissions; label: string; detail: string; locked?: boolean }> = [
  { id: 'view_actor', label: 'Ver ficha', detail: 'Permite abrir a ficha no celular.', locked: true },
  { id: 'adjust_hp', label: 'Alterar PV', detail: 'Permite usar os botoes de dano/cura.' },
  { id: 'roll', label: 'Rolar dados', detail: 'Permite rolagens rapidas e campos com formula.' },
  { id: 'patch_actor', label: 'Editar ficha', detail: 'Permite editar campos da ficha pelo celular.' },
  { id: 'chat', label: 'Enviar chat', detail: 'Permite enviar mensagens pelo celular.' },
]

const RIGHT_TABS = [
  { id: 'actors', title: 'Atores', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'items', title: 'Itens', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { id: 'journal', title: 'Diario', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { id: 'tables', title: 'Tabelas', icon: 'M3 10h18M3 14h18M10 3v18' },
  { id: 'cards', title: 'Cartas', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { id: 'combat', title: 'Combate', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { id: 'settings', title: 'Configurar', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

interface Token {
  id: string
  sceneId: string
  assetId?: string
  name: string
  initial: string
  x: number
  y: number
  hp: number
  maxHp: number
  ac: number
  color: string
}

interface RollResult {
  total: number
  rolls: number[]
  modifier: number
}

interface ViewTransform {
  x: number
  y: number
  scale: number
}

interface WorldPoint {
  x: number
  y: number
}

interface MeasureState {
  start: WorldPoint
  end: WorldPoint
}

const INITIAL_TOKENS: Token[] = []

function preferredCompanionUrl(link: ApiCompanionSessionLink) {
  if (link.public_url) return link.public_url
  return link.urls.find(url => !url.includes('127.0.0.1') && !url.includes('localhost')) ?? link.loopback_url
}

function upsertCompanionPermission(actor: ApiActor, playerName: string, permissions: ApiCompanionPermissions): ApiActor {
  const normalizedName = playerName.trim()
  if (!normalizedName) return actor

  const savedPermissions = actor.companion_permissions || []
  const existing = savedPermissions.find(entry => entry.player_name.toLowerCase() === normalizedName.toLowerCase())
  const grant = {
    id: existing?.id || `companion_permission_${Date.now()}`,
    player_name: normalizedName,
    permissions,
    updated_at: new Date().toISOString(),
  }

  return {
    ...actor,
    companion_permissions: existing
      ? savedPermissions.map(entry => (entry.id === existing.id ? grant : entry))
      : [...savedPermissions, grant],
  }
}

function RightTabBtn({ icon, title, isOpen, onClick }: { icon: string; title: string; isOpen?: boolean; onClick: () => void }) {
  return (
    <button title={title} className={`${styles.rightTabBtn} ${isOpen ? styles.rightTabBtnActive : ''}`} type="button" onClick={onClick}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d={icon} />
      </svg>
    </button>
  )
}

function rollDie(sides: number) {
  return Math.floor(Math.random() * sides) + 1
}

function rollFormula(formula: string): RollResult | null {
  const match = formula.trim().match(/^(\d+)d(\d+)([+-]\d+)?$/)
  if (!match) return null

  const amount = Number(match[1])
  const sides = Number(match[2])
  const modifier = Number(match[3] ?? 0)
  const rolls = Array.from({ length: amount }, () => rollDie(sides))
  const total = rolls.reduce((sum, value) => sum + value, 0) + modifier

  return { total, rolls, modifier }
}

function formatRoll(roll: RollResult) {
  const base = roll.rolls.join(' + ')
  if (roll.modifier === 0) return base
  return `${base} ${roll.modifier > 0 ? '+' : '-'} ${Math.abs(roll.modifier)}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function tokenColor(index: number) {
  return ['#4f8f80', '#8f6bd9', '#b85c48', '#d7a84f', '#4f78a8'][index % 5]
}

function getNameFromFile(file: File) {
  return file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Asset'
}

function parseSceneNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeHexColor(value: string | undefined, fallback: string) {
  if (!value) return fallback
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

function hexToRgba(value: string | undefined, opacity: number | undefined, fallback: string) {
  const color = normalizeHexColor(value, fallback)
  const alpha = clamp(opacity ?? 0.12, 0, 1)
  const r = Number.parseInt(color.slice(1, 3), 16)
  const g = Number.parseInt(color.slice(3, 5), 16)
  const b = Number.parseInt(color.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function sceneDimensionToPixels(width: number | undefined, height: number | undefined, gridSize: number) {
  const rawWidth = parseSceneNumber(width, DEFAULT_SCENE_WIDTH)
  const rawHeight = parseSceneNumber(height, DEFAULT_SCENE_HEIGHT)
  const isLegacyCellSize = rawWidth > 0 && rawHeight > 0 && rawWidth <= 200 && rawHeight <= 200

  return {
    width: Math.round(isLegacyCellSize ? rawWidth * gridSize : rawWidth),
    height: Math.round(isLegacyCellSize ? rawHeight * gridSize : rawHeight),
  }
}

function getViewMargin(rect: DOMRect) {
  return Math.min(380, Math.max(140, Math.min(rect.width, rect.height) * 0.32))
}

function getMinZoom(rect: DOMRect, width: number, height: number) {
  const margin = getViewMargin(rect)
  const availableWidth = Math.max(240, rect.width - margin * 2)
  const availableHeight = Math.max(240, rect.height - margin * 2)
  const fitScale = Math.min(availableWidth / width, availableHeight / height)
  return clamp(fitScale * 0.65, MIN_ABSOLUTE_ZOOM, 1)
}

function clampViewTransformToScene(transform: ViewTransform, rect: DOMRect, width: number, height: number) {
  const scale = clamp(transform.scale, getMinZoom(rect, width, height), MAX_ZOOM)
  const margin = getViewMargin(rect)
  const scaledWidth = width * scale
  const scaledHeight = height * scale
  const minX = Math.min(margin, rect.width - scaledWidth - margin)
  const maxX = Math.max(margin, rect.width - scaledWidth - margin)
  const minY = Math.min(margin, rect.height - scaledHeight - margin)
  const maxY = Math.max(margin, rect.height - scaledHeight - margin)

  return {
    x: clamp(transform.x, minX, maxX),
    y: clamp(transform.y, minY, maxY),
    scale,
  }
}

function mapApiScene(scene: ApiScene): Scene {
  const gridSize = scene.grid_size || DEFAULT_GRID_SIZE
  const dimensions = sceneDimensionToPixels(scene.width, scene.height, gridSize)

  return {
    id: scene.id,
    name: scene.name,
    dims: `${dimensions.width}x${dimensions.height}`,
    active: scene.active,
    folderId: scene.folder_id,
    backgroundAssetId: scene.background_asset_id,
    foregroundAssetId: scene.foreground_asset_id,
    thumbnailAssetId: scene.thumbnail_asset_id,
    showNavigation: scene.show_navigation,
    permission: scene.permission,
    navigationName: scene.navigation_name,
    backgroundColor: scene.background_color,
    preserveAspectRatio: scene.preserve_aspect_ratio ?? true,
    scenePadding: scene.scene_padding ?? DEFAULT_SCENE_PADDING,
    backgroundElevation: scene.background_elevation,
    foregroundElevation: scene.foreground_elevation,
    initialX: scene.initial_x,
    initialY: scene.initial_y,
    initialZoom: scene.initial_zoom,
    lockView: scene.lock_view,
    gridType: scene.grid_type,
    gridSize: scene.grid_size,
    gridOffsetX: scene.grid_offset_x,
    gridOffsetY: scene.grid_offset_y,
    gridColor: scene.grid_color,
    gridOpacity: scene.grid_opacity,
    gridDistance: scene.grid_distance,
    gridUnits: scene.grid_units,
    darkness: scene.darkness,
    globalLight: scene.global_light,
    globalLightThreshold: scene.global_light_threshold,
    playlist: scene.playlist,
    description: scene.description,
    fogExploration: scene.fog_exploration,
    resetFogOnActivation: scene.reset_fog_on_activation,
    fogOverlayAssetId: scene.fog_overlay_asset_id,
    width: dimensions.width,
    height: dimensions.height,
  }
}

function mapApiToken(token: ApiToken, index: number): Token {
  return {
    id: token.id,
    sceneId: token.scene_id,
    assetId: token.asset_id,
    name: token.name,
    initial: token.name.slice(0, 1).toUpperCase() || '?',
    x: token.x,
    y: token.y,
    hp: token.hp,
    maxHp: token.max_hp,
    ac: token.ac,
    color: tokenColor(index),
  }
}

export default function VTT({ worldId, onExit }: { worldId: string; onExit: () => void }) {
  const { activePanel, exitingPanel, togglePanel } = usePanelManager()
  const [activeScene, setActiveScene] = useState<Scene | null>(null)
  const [scenes, setScenes] = useState<Scene[]>([])
  const [sceneFolders, setSceneFolders] = useState<ApiSceneFolder[]>([])
  const [messages, setMessages] = useState<ApiChatMessage[]>([])
  const [tokens, setTokens] = useState<Token[]>(INITIAL_TOKENS)
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null)
  const [assets, setAssets] = useState<ApiAsset[]>([])
  const [actors, setActors] = useState<ApiActor[]>([])
  const [system, setSystem] = useState<ApiGameSystem | null>(null)
  const [openActorSheetId, setOpenActorSheetId] = useState<string | null>(null)
  const [isActorCreateOpen, setIsActorCreateOpen] = useState(false)
  const [companionLink, setCompanionLink] = useState<ApiCompanionSessionLink | null>(null)
  const [companionActor, setCompanionActor] = useState<ApiActor | null>(null)
  const [companionPlayerName, setCompanionPlayerName] = useState('')
  const [companionPublicBaseUrl, setCompanionPublicBaseUrl] = useState('')
  const [companionPermissions, setCompanionPermissions] = useState<ApiCompanionPermissions>(DEFAULT_COMPANION_PERMISSIONS)
  const [companionError, setCompanionError] = useState('')
  const [isCreatingCompanionLink, setIsCreatingCompanionLink] = useState(false)
  const [, setSaveStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [viewTransform, setViewTransform] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [sceneNavOpen, setSceneNavOpen] = useState(false)
  const [activeTool, setActiveTool] = useState<ToolId>('token')
  const [measure, setMeasure] = useState<MeasureState | null>(null)
  const [isMeasuring, setIsMeasuring] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<{ startX: number; startY: number; view: ViewTransform } | null>(null)
  const tokensRef = useRef<Token[]>(INITIAL_TOKENS)

  const visibleTokens = activeScene ? tokens.filter(token => token.sceneId === activeScene.id) : []
  const pinnedScenes = scenes.filter(scene => scene.showNavigation !== false)
  const activeSceneBackground = activeScene?.backgroundAssetId
    ? assets.find(asset => asset.id === activeScene.backgroundAssetId)
    : undefined
  const activeSceneForeground = activeScene?.foregroundAssetId
    ? assets.find(asset => asset.id === activeScene.foregroundAssetId)
    : undefined
  const activeSceneFogOverlay = activeScene?.fogOverlayAssetId
    ? assets.find(asset => asset.id === activeScene.fogOverlayAssetId)
    : undefined
  const gridSize = activeScene?.gridSize ?? DEFAULT_GRID_SIZE
  const mapAssets = assets.filter(asset => asset.kind === 'map' && asset.content_type.startsWith('image/'))
  const mapWidthPx = activeScene?.width ?? DEFAULT_SCENE_WIDTH
  const mapHeightPx = activeScene?.height ?? DEFAULT_SCENE_HEIGHT
  const scenePadding = clamp(activeScene?.scenePadding ?? DEFAULT_SCENE_PADDING, 0, 1.5)
  const scenePaddingX = Math.round(mapWidthPx * scenePadding)
  const scenePaddingY = Math.round(mapHeightPx * scenePadding)
  const sceneWidthPx = mapWidthPx + scenePaddingX * 2
  const sceneHeightPx = mapHeightPx + scenePaddingY * 2
  const gridOffsetX = activeScene?.gridOffsetX ?? 0
  const gridOffsetY = activeScene?.gridOffsetY ?? 0
  const gridEnabled = activeScene?.gridType !== 'gridless'
  const gridDistance = activeScene?.gridDistance ?? 5
  const gridUnits = activeScene?.gridUnits ?? 'ft'
  const gridLine = gridEnabled
    ? hexToRgba(activeScene?.gridColor, activeScene?.gridOpacity ?? DEFAULT_GRID_OPACITY, '#ffffff')
    : 'transparent'
  const sceneWorldStyle = {
    '--grid-size': `${gridSize}px`,
    '--grid-line': gridLine,
    '--grid-shadow-line': gridEnabled ? 'rgba(0, 0, 0, 0.36)' : 'transparent',
    '--grid-offset-x': `${gridOffsetX}px`,
    '--grid-offset-y': `${gridOffsetY}px`,
    '--map-left': `${scenePaddingX}px`,
    '--map-top': `${scenePaddingY}px`,
    '--map-width': `${mapWidthPx}px`,
    '--map-height': `${mapHeightPx}px`,
    width: `${sceneWidthPx}px`,
    height: `${sceneHeightPx}px`,
    transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`,
    backgroundColor: normalizeHexColor(activeScene?.backgroundColor, '#111111'),
  } as CSSProperties
  const darknessStyle = {
    opacity: clamp(activeScene?.darkness ?? 0, 0, 1),
  } as CSSProperties
  const measureDistance = measure
    ? Math.hypot(measure.end.x - measure.start.x, measure.end.y - measure.start.y) / gridSize * gridDistance
    : 0
  const measureLabel = `${measureDistance >= 10 ? measureDistance.toFixed(0) : measureDistance.toFixed(1)} ${gridUnits}`
  const measureLabelPosition = measure
    ? {
        left: `${(measure.start.x + measure.end.x) / 2}px`,
        top: `${(measure.start.y + measure.end.y) / 2}px`,
      }
    : undefined

  useEffect(() => {
    let cancelled = false

    getWorldSnapshot(worldId)
      .then(snapshot => {
        if (cancelled) return

        const nextScenes = snapshot.scenes.map(mapApiScene)
        const nextScene = nextScenes.find(scene => scene.active) ?? nextScenes[0] ?? null
        const nextTokens = Object.values(snapshot.tokens_by_scene).flat().map(mapApiToken)

        setScenes(nextScenes)
        setSceneFolders(snapshot.scene_folders ?? [])
        setAssets(snapshot.assets)
        setActors(snapshot.actors ?? [])
        setSystem(snapshot.system ?? null)
        setMessages(snapshot.messages ?? [])
        setActiveScene(nextScene)
        tokensRef.current = nextTokens
        setTokens(nextTokens)

        const nextVisibleTokens = nextScene ? nextTokens.filter(token => token.sceneId === nextScene.id) : []
        setSelectedTokenId(nextVisibleTokens[0]?.id ?? null)

        setSaveStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setSaveStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [worldId])

  useEffect(() => onCompanionEvent(event => {
    if (event.world_id !== worldId) return

    if (event.type === 'actor.updated') {
      setActors(prev => {
        const exists = prev.some(actor => actor.id === event.actor.id)
        if (!exists) return [...prev, event.actor]
        return prev.map(actor => (actor.id === event.actor.id ? event.actor : actor))
      })
    }

    if (event.type === 'chat.message.created') {
      setMessages(prev => {
        if (prev.some(message => message.id === event.message.id)) return prev
        return [...prev, event.message]
      })
    }

    if (event.type === 'chat.message.deleted') {
      setMessages(prev => prev.filter(message => message.id !== event.message_id))
    }
  }), [worldId])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (!activeScene) {
        setViewTransform({ x: 0, y: 0, scale: 1 })
        return
      }

      const rect = mapRef.current?.getBoundingClientRect()
      if (!rect) return

      const mapWidth = activeScene.width ?? DEFAULT_SCENE_WIDTH
      const mapHeight = activeScene.height ?? DEFAULT_SCENE_HEIGHT
      const padding = clamp(activeScene.scenePadding ?? DEFAULT_SCENE_PADDING, 0, 1.5)
      const widthPx = mapWidth + Math.round(mapWidth * padding) * 2
      const heightPx = mapHeight + Math.round(mapHeight * padding) * 2
      const minZoom = getMinZoom(rect, widthPx, heightPx)
      const fitScale = clamp(
        Math.min((rect.width - 160) / widthPx, (rect.height - 160) / heightPx, 1),
        minZoom,
        MAX_ZOOM,
      )
      const savedZoom = parseSceneNumber(activeScene.initialZoom, 1)
      const savedX = parseSceneNumber(activeScene.initialX, 0)
      const savedY = parseSceneNumber(activeScene.initialY, 0)
      const hasSavedCamera = savedX !== 0 || savedY !== 0 || savedZoom !== 1
      const scale = hasSavedCamera ? clamp(savedZoom, minZoom, MAX_ZOOM) : fitScale

      setViewTransform(clampViewTransformToScene({
        x: hasSavedCamera ? savedX : Math.round((rect.width - widthPx * scale) / 2),
        y: hasSavedCamera ? savedY : Math.round((rect.height - heightPx * scale) / 2),
        scale,
      }, rect, widthPx, heightPx))
      panRef.current = null
      setIsPanning(false)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [activeScene])

  useEffect(() => {
    function handleResize() {
      const rect = mapRef.current?.getBoundingClientRect()
      if (!rect || !activeScene) return
      setViewTransform(prev => clampViewTransformToScene(prev, rect, sceneWidthPx, sceneHeightPx))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeScene, sceneWidthPx, sceneHeightPx])

  function updateTokens(updater: (prev: Token[]) => Token[]) {
    setTokens(prev => {
      const nextTokens = updater(prev)
      tokensRef.current = nextTokens
      return nextTokens
    })
  }

  function pushActivity(_title: string, _detail: string) {
    void _title
    void _detail
    // Runtime events stay silent until a proper system/chat log is implemented.
  }

  function requireActiveScene(message: string) {
    if (activeScene) return activeScene
    pushActivity('Nenhuma cena ativa', message)
    return null
  }

  function screenToWorld(event: PointerEvent<HTMLElement> | WheelEvent<HTMLElement>) {
    const rect = mapRef.current?.getBoundingClientRect()
    if (!rect) return null

    return {
      x: (event.clientX - rect.left - viewTransform.x) / viewTransform.scale,
      y: (event.clientY - rect.top - viewTransform.y) / viewTransform.scale,
    }
  }

  function pointToGrid(event: PointerEvent<HTMLElement>) {
    const worldPoint = screenToWorld(event)
    if (!worldPoint) return null

    const maxX = Math.max(0, Math.ceil((sceneWidthPx - gridOffsetX) / gridSize) - 1)
    const maxY = Math.max(0, Math.ceil((sceneHeightPx - gridOffsetY) / gridSize) - 1)
    const x = clamp(Math.floor((worldPoint.x - gridOffsetX) / gridSize), 0, maxX)
    const y = clamp(Math.floor((worldPoint.y - gridOffsetY) / gridSize), 0, maxY)

    return { x, y }
  }

  function clampWorldPoint(point: WorldPoint) {
    return {
      x: clamp(point.x, 0, sceneWidthPx),
      y: clamp(point.y, 0, sceneHeightPx),
    }
  }

  function snapMeasurePoint(point: WorldPoint) {
    const clamped = clampWorldPoint(point)
    if (!gridEnabled) return clamped

    const maxColumn = Math.max(0, Math.ceil((sceneWidthPx - gridOffsetX) / gridSize) - 1)
    const maxRow = Math.max(0, Math.ceil((sceneHeightPx - gridOffsetY) / gridSize) - 1)
    const column = clamp(Math.floor((clamped.x - gridOffsetX) / gridSize), 0, maxColumn)
    const row = clamp(Math.floor((clamped.y - gridOffsetY) / gridSize), 0, maxRow)

    return {
      x: clamp(gridOffsetX + (column + 0.5) * gridSize, 0, sceneWidthPx),
      y: clamp(gridOffsetY + (row + 0.5) * gridSize, 0, sceneHeightPx),
    }
  }

  function measurePointFromEvent(event: PointerEvent<HTMLElement>) {
    const worldPoint = screenToWorld(event)
    if (!worldPoint) return null
    return snapMeasurePoint(worldPoint)
  }

  function startMeasure(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || isMapUiTarget(event.target)) return false
    const point = measurePointFromEvent(event)
    if (!point) return false

    event.preventDefault()
    setMeasure({ start: point, end: point })
    setIsMeasuring(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    return true
  }

  function moveMeasure(event: PointerEvent<HTMLDivElement>) {
    if (!isMeasuring) return
    const point = measurePointFromEvent(event)
    if (!point) return

    setMeasure(prev => (prev ? { ...prev, end: point } : prev))
  }

  function finishMeasure(event: PointerEvent<HTMLDivElement>) {
    if (!isMeasuring) return
    moveMeasure(event)
    setIsMeasuring(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function handleToolChange(tool: ToolId) {
    setActiveTool(tool)
    setIsMeasuring(false)
    if (tool !== 'measure') {
      setMeasure(null)
    }
  }

  function isMapUiTarget(target: EventTarget | null) {
    return target instanceof HTMLElement && Boolean(target.closest('[data-map-ui="true"], button, input, select, textarea'))
  }

  function startPan(event: PointerEvent<HTMLDivElement>) {
    if (activeTool === 'measure' && startMeasure(event)) return
    if (event.button !== 1 || activeScene?.lockView || isMapUiTarget(event.target)) return

    event.preventDefault()
    panRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      view: viewTransform,
    }
    setIsPanning(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function movePan(event: PointerEvent<HTMLDivElement>) {
    const pan = panRef.current
    if (!pan) return

    const rect = mapRef.current?.getBoundingClientRect()
    if (!rect) return

    setViewTransform(clampViewTransformToScene({
      x: pan.view.x + event.clientX - pan.startX,
      y: pan.view.y + event.clientY - pan.startY,
      scale: pan.view.scale,
    }, rect, sceneWidthPx, sceneHeightPx))
  }

  function finishPan(event: PointerEvent<HTMLDivElement>) {
    if (!panRef.current) return
    panRef.current = null
    setIsPanning(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function handleCanvasPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (isMeasuring) {
      moveMeasure(event)
      return
    }

    if (draggingTokenId) {
      moveDraggedToken(event)
      return
    }

    movePan(event)
  }

  function handleCanvasPointerEnd(event: PointerEvent<HTMLDivElement>) {
    finishMeasure(event)
    finishPan(event)
    finishDrag()
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (activeScene?.lockView) return
    event.preventDefault()

    const rect = mapRef.current?.getBoundingClientRect()
    if (!rect) return

    const pointerX = event.clientX - rect.left
    const pointerY = event.clientY - rect.top
    setViewTransform(prev => {
      const nextScale = clamp(prev.scale * Math.exp(-event.deltaY * 0.001), getMinZoom(rect, sceneWidthPx, sceneHeightPx), MAX_ZOOM)
      const worldX = (pointerX - prev.x) / prev.scale
      const worldY = (pointerY - prev.y) / prev.scale

      return clampViewTransformToScene({
        x: pointerX - worldX * nextScale,
        y: pointerY - worldY * nextScale,
        scale: nextScale,
      }, rect, sceneWidthPx, sceneHeightPx)
    })
  }

  function moveDraggedToken(event: PointerEvent<HTMLElement>) {
    if (!draggingTokenId) return
    const nextPoint = pointToGrid(event)
    if (!nextPoint) return

    updateTokens(prev => prev.map(token => (token.id === draggingTokenId ? { ...token, ...nextPoint } : token)))
  }

  function finishDrag() {
    if (!draggingTokenId) return
    const movedToken = tokensRef.current.find(token => token.id === draggingTokenId)
    setDraggingTokenId(null)

    if (movedToken) {
      pushActivity('Token movido', `${movedToken.name} foi reposicionado para ${movedToken.x}, ${movedToken.y}.`)
      patchToken(movedToken.id, { x: movedToken.x, y: movedToken.y })
        .then(() => pushActivity('Token salvo', `${movedToken.name} persistido no save local.`))
        .catch(() => pushActivity('Falha ao salvar', `${movedToken.name} moveu na tela, mas nao foi gravado no disco.`))
    }
  }

  function handleSceneActivate(scene: Scene) {
    setActiveScene(scene)
    setSceneNavOpen(false)
    setMeasure(null)
    setIsMeasuring(false)
    setScenes(prev => prev.map(item => ({ ...item, active: item.id === scene.id })))
    const nextVisibleTokens = tokensRef.current.filter(token => token.sceneId === scene.id)
    setSelectedTokenId(nextVisibleTokens[0]?.id ?? null)
    pushActivity('Cena ativa', scene.name)
    patchScene(scene.id, { active: true }).catch(() => {
      pushActivity('Falha ao salvar cena', `${scene.name} ficou ativa apenas localmente.`)
    })
  }

  function handleCreateScene(name: string) {
    createScene(worldId, {
      name,
      grid_size: DEFAULT_GRID_SIZE,
      width: DEFAULT_SCENE_WIDTH,
      height: DEFAULT_SCENE_HEIGHT,
      active: true,
    })
      .then(scene => {
        const nextScene = mapApiScene(scene)
        setScenes(prev => [...prev.map(item => ({ ...item, active: false })), nextScene])
        setActiveScene(nextScene)
        setSelectedTokenId(null)
        pushActivity('Cena criada', nextScene.name)
      })
      .catch(() => {
        pushActivity('Falha ao criar cena', 'Nao consegui gravar a nova cena no save local.')
      })
  }

  function handleCreateSceneFolder(name: string) {
    createSceneFolder(worldId, { name })
      .then(folder => {
        setSceneFolders(prev => [...prev.filter(item => item.id !== folder.id), folder])
      })
      .catch(() => {
        pushActivity('Falha ao criar pasta', 'Nao consegui gravar a pasta no save local.')
      })
  }

  function handleDeleteSceneFolder(folder: ApiSceneFolder) {
    const confirmed = window.confirm(`Apagar a pasta "${folder.name}"? As cenas continuam salvas sem pasta.`)
    if (!confirmed) return

    setSceneFolders(prev => prev.filter(item => item.id !== folder.id))
    setScenes(prev => prev.map(scene => (scene.folderId === folder.id ? { ...scene, folderId: '' } : scene)))
    setActiveScene(prev => (prev?.folderId === folder.id ? { ...prev, folderId: '' } : prev))

    deleteSceneFolder(folder.id).catch(() => {
      pushActivity('Falha ao apagar pasta', `${folder.name} saiu da tela, mas nao foi removida do disco.`)
    })
  }

  function handleDuplicateScene(scene: Scene) {
    duplicateScene(scene.id)
      .then(() => getWorldSnapshot(worldId))
      .then(snapshot => {
        const nextScenes = snapshot.scenes.map(mapApiScene)
        const nextScene = nextScenes.find(item => item.active) ?? nextScenes[0] ?? null
        const nextTokens = Object.values(snapshot.tokens_by_scene).flat().map(mapApiToken)
        setScenes(nextScenes)
        setSceneFolders(snapshot.scene_folders ?? [])
        setAssets(snapshot.assets)
        setActors(snapshot.actors ?? [])
        setMessages(snapshot.messages ?? [])
        setActiveScene(nextScene)
        tokensRef.current = nextTokens
        setTokens(nextTokens)
      })
      .catch(() => {
        pushActivity('Falha ao duplicar cena', `${scene.name} nao foi duplicada no save local.`)
      })
  }

  function handleSaveScene(scene: Scene) {
    const nextScene = {
      ...scene,
      dims: `${scene.width ?? DEFAULT_SCENE_WIDTH}x${scene.height ?? DEFAULT_SCENE_HEIGHT}`,
    }
    setScenes(prev => prev.map(item => (item.id === scene.id ? nextScene : item)))
    setActiveScene(prev => (prev?.id === scene.id ? nextScene : prev))
    patchScene(scene.id, {
      name: nextScene.name,
      folder_id: nextScene.folderId ?? '',
      background_asset_id: nextScene.backgroundAssetId ?? '',
      foreground_asset_id: nextScene.foregroundAssetId ?? '',
      thumbnail_asset_id: nextScene.thumbnailAssetId ?? nextScene.backgroundAssetId ?? '',
      show_navigation: nextScene.showNavigation ?? true,
      permission: nextScene.permission ?? 'gm',
      navigation_name: nextScene.navigationName ?? '',
      background_color: nextScene.backgroundColor ?? '#111111',
      preserve_aspect_ratio: nextScene.preserveAspectRatio ?? true,
      scene_padding: nextScene.scenePadding ?? DEFAULT_SCENE_PADDING,
      background_elevation: nextScene.backgroundElevation ?? 0,
      foreground_elevation: nextScene.foregroundElevation ?? 0,
      initial_x: nextScene.initialX ?? 0,
      initial_y: nextScene.initialY ?? 0,
      initial_zoom: nextScene.initialZoom ?? 1,
      lock_view: nextScene.lockView ?? false,
      grid_type: nextScene.gridType ?? 'square',
      grid_size: nextScene.gridSize ?? DEFAULT_GRID_SIZE,
      grid_offset_x: nextScene.gridOffsetX ?? 0,
      grid_offset_y: nextScene.gridOffsetY ?? 0,
      grid_color: nextScene.gridColor ?? '#ffffff',
      grid_opacity: nextScene.gridOpacity ?? DEFAULT_GRID_OPACITY,
      grid_distance: nextScene.gridDistance ?? 5,
      grid_units: nextScene.gridUnits ?? 'ft',
      darkness: nextScene.darkness ?? 0,
      global_light: nextScene.globalLight ?? false,
      global_light_threshold: nextScene.globalLightThreshold ?? 0,
      playlist: nextScene.playlist ?? '',
      description: nextScene.description ?? '',
      fog_exploration: nextScene.fogExploration ?? true,
      reset_fog_on_activation: nextScene.resetFogOnActivation ?? false,
      fog_overlay_asset_id: nextScene.fogOverlayAssetId ?? '',
      width: nextScene.width ?? DEFAULT_SCENE_WIDTH,
      height: nextScene.height ?? DEFAULT_SCENE_HEIGHT,
    }).catch(() => {
      pushActivity('Falha ao salvar cena', `${scene.name} mudou na tela, mas nao foi gravada no disco.`)
    })
  }

  function handleDeleteScene(scene: Scene) {
    const confirmed = window.confirm(`Apagar a cena "${scene.name}"?`)
    if (!confirmed) return

    const nextScenes = scenes.filter(item => item.id !== scene.id)
    const nextActiveScene = activeScene?.id === scene.id
      ? nextScenes[0] ?? null
      : activeScene

    setScenes(nextScenes.map(item => ({ ...item, active: item.id === nextActiveScene?.id })))
    setActiveScene(nextActiveScene)
    setSelectedTokenId(null)
    updateTokens(prev => prev.filter(token => token.sceneId !== scene.id))
    pushActivity('Cena apagada', scene.name)

    deleteScene(scene.id).catch(() => {
      pushActivity('Falha ao apagar cena', `${scene.name} saiu da tela, mas nao foi removida do disco.`)
    })
  }

  async function handleCreateChatMessage(payload: Omit<ApiChatMessage, 'id' | 'world_id' | 'created_at'>) {
    const message = await createMessage(worldId, payload)
    setMessages(prev => [...prev, message])
    void broadcastCompanionEvent({
      type: 'chat.message.created',
      world_id: worldId,
      actor_id: '',
      message,
    })
    return message
  }

  function handleDeleteChatMessage(message: ApiChatMessage) {
    setMessages(prev => prev.filter(item => item.id !== message.id))
    deleteMessage(message.id)
      .then(() => {
        void broadcastCompanionEvent({
          type: 'chat.message.deleted',
          world_id: worldId,
          message_id: message.id,
        })
      })
      .catch(() => {
        setMessages(prev => [...prev, message].sort((a, b) => a.created_at.localeCompare(b.created_at)))
      })
  }

  function handleMacroRun(macro: MacroAction) {
    if (!macro.formula) {
      handleCreateChatMessage({
        speaker: 'Gamemaster',
        type: 'text',
        text: `${macro.label}: ${macro.description}`,
        formula: '',
        rolls: [],
      }).catch(() => pushActivity('Falha no chat', 'A macro executou, mas nao entrou no historico.'))
      return
    }

    const result = rollFormula(macro.formula)
    if (!result) {
      handleCreateChatMessage({
        speaker: 'Gamemaster',
        type: 'text',
        text: `${macro.label}: ${macro.formula}`,
        formula: '',
        rolls: [],
      }).catch(() => pushActivity('Falha no chat', 'A macro executou, mas nao entrou no historico.'))
      return
    }

    handleCreateChatMessage({
      speaker: 'Gamemaster',
      type: 'roll',
      text: macro.label,
      formula: macro.formula,
      result: result.total,
      rolls: result.rolls,
    }).catch(() => {
      pushActivity(macro.label, `${macro.formula} = ${result.total} (${formatRoll(result)})`)
    })
  }

  async function handleActorSheetRoll(payload: { speaker: string; label: string; formula: string }) {
    const result = rollFormula(payload.formula)
    if (!result) {
      await handleCreateChatMessage({
        speaker: payload.speaker,
        type: 'text',
        text: `${payload.label}: ${payload.formula}`,
        formula: '',
        rolls: [],
      })
      return
    }

    await handleCreateChatMessage({
      speaker: payload.speaker,
      type: 'roll',
      text: payload.label,
      formula: payload.formula,
      result: result.total,
      rolls: result.rolls,
    })
    pushActivity(payload.label, `${payload.formula} = ${result.total} (${formatRoll(result)})`)
  }

  function applySceneMap(asset: ApiAsset, scene: Scene) {
    setActiveScene(prev => (prev?.id === scene.id ? { ...prev, backgroundAssetId: asset.id } : prev))
    setScenes(prev => prev.map(item => (item.id === scene.id ? { ...item, backgroundAssetId: asset.id } : item)))
    pushActivity('Mapa aplicado', `${asset.name} foi definido como fundo da cena.`)

    patchScene(scene.id, { background_asset_id: asset.id })
      .then(() => pushActivity('Cena salva', `${scene.name} atualizada no save local.`))
      .catch(() => pushActivity('Falha ao salvar mapa', `${scene.name} mudou na tela, mas nao foi gravada no disco.`))
  }

  function handleAssetUploaded(asset: ApiAsset) {
    setAssets(prev => [asset, ...prev.filter(item => item.id !== asset.id)])
    pushActivity('Asset salvo', `${asset.name} foi gravado na biblioteca local.`)

    if (activeScene && asset.kind === 'map' && asset.scene_id === activeScene.id) {
      applySceneMap(asset, activeScene)
    }
  }

  function handleUseAssetAsSceneMap(asset: ApiAsset) {
    const scene = requireActiveScene('Crie uma cena antes de aplicar um mapa.')
    if (!scene) return

    applySceneMap(asset, scene)
  }

  function handleDeleteAsset(asset: ApiAsset) {
    const confirmed = window.confirm(`Apagar o asset "${asset.name}"?`)
    if (!confirmed) return

    setAssets(prev => prev.filter(item => item.id !== asset.id))
    setActiveScene(prev => (
      prev && (prev.backgroundAssetId === asset.id || prev.foregroundAssetId === asset.id || prev.fogOverlayAssetId === asset.id)
        ? {
            ...prev,
            backgroundAssetId: prev.backgroundAssetId === asset.id ? '' : prev.backgroundAssetId,
            foregroundAssetId: prev.foregroundAssetId === asset.id ? '' : prev.foregroundAssetId,
            fogOverlayAssetId: prev.fogOverlayAssetId === asset.id ? '' : prev.fogOverlayAssetId,
          }
        : prev
    ))
    setScenes(prev => prev.map(scene => (
      scene.backgroundAssetId === asset.id || scene.foregroundAssetId === asset.id || scene.fogOverlayAssetId === asset.id
        ? {
            ...scene,
            backgroundAssetId: scene.backgroundAssetId === asset.id ? '' : scene.backgroundAssetId,
            foregroundAssetId: scene.foregroundAssetId === asset.id ? '' : scene.foregroundAssetId,
            fogOverlayAssetId: scene.fogOverlayAssetId === asset.id ? '' : scene.fogOverlayAssetId,
          }
        : scene
    )))
    pushActivity('Asset apagado', asset.name)

    deleteAsset(asset.id).catch(() => {
      pushActivity('Falha ao apagar asset', `${asset.name} saiu da tela, mas nao foi removido do disco.`)
    })
  }

  async function handleCreateActor(payload: CreateActorPayload) {
    const actor = await createActor(worldId, payload)
    setActors(prev => [...prev.filter(item => item.id !== actor.id), actor])
    setOpenActorSheetId(actor.id)
    return actor
  }

  async function handlePatchActor(actorId: string, payload: Partial<ApiActor>) {
    const actor = await patchActor(actorId, payload)
    setActors(prev => prev.map(item => (item.id === actor.id ? actor : item)))
    void broadcastCompanionEvent({
      type: 'actor.updated',
      world_id: worldId,
      actor_id: actor.id,
      actor,
    })
    return actor
  }

  function closeCompanionDialog() {
    setCompanionError('')
    setCompanionLink(null)
    setCompanionActor(null)
    setCompanionPlayerName('')
    setCompanionPublicBaseUrl('')
    setCompanionPermissions(DEFAULT_COMPANION_PERMISSIONS)
    setIsCreatingCompanionLink(false)
  }

  function handleOpenCompanionDialog(actor: ApiActor) {
    setCompanionError('')
    setCompanionLink(null)
    setCompanionActor(actor)
    const savedGrant = actor.companion_permissions?.[0]
    setCompanionPlayerName(savedGrant?.player_name || actor.name)
    setCompanionPublicBaseUrl('')
    setCompanionPermissions(savedGrant?.permissions || DEFAULT_COMPANION_PERMISSIONS)
  }

  function toggleCompanionPermission(permission: keyof ApiCompanionPermissions) {
    if (permission === 'view_actor') return
    setCompanionPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission],
    }))
  }

  async function handleCreateCompanionLink() {
    if (!companionActor) return
    setCompanionError('')
    setIsCreatingCompanionLink(true)

    try {
      const link = await createCompanionSession(worldId, companionActor.id, {
        player_name: companionPlayerName.trim() || companionActor.name,
        permissions: companionPermissions,
        public_base_url: companionPublicBaseUrl.trim(),
        remember_permissions: true,
      })
      setCompanionLink(link)
      const playerName = link.player_name || companionPlayerName.trim() || companionActor.name
      const nextActor = upsertCompanionPermission(companionActor, playerName, link.permissions || companionPermissions)
      setCompanionActor(nextActor)
      setActors(prev => prev.map(actor => (actor.id === nextActor.id ? nextActor : actor)))
      const preferredUrl = preferredCompanionUrl(link)
      await navigator.clipboard?.writeText(preferredUrl).catch(() => undefined)
    } catch (error) {
      setCompanionError(error instanceof Error ? error.message : 'Falha ao criar sessao mobile.')
    } finally {
      setIsCreatingCompanionLink(false)
    }
  }

  function handleCopyCompanionLinks() {
    if (!companionLink) return
    const text = preferredCompanionUrl(companionLink)
    void navigator.clipboard?.writeText(text)
  }

  async function handleUploadSceneMap(file: File, scene: Scene) {
    const asset = await uploadAsset({
      file,
      kind: 'map',
      worldId,
      sceneId: scene.id,
      name: getNameFromFile(file),
    })
    setAssets(prev => [asset, ...prev.filter(item => item.id !== asset.id)])
    pushActivity('Mapa salvo', `${asset.name} foi adicionado a biblioteca do mundo.`)
    return asset
  }

  return (
    <div className={styles.root} id="vtt-root">
      <div
        ref={mapRef}
        className={`${styles.mapCanvas} ${isPanning ? styles.mapCanvasPanning : ''}`}
        id="map-canvas"
        onPointerDown={startPan}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerEnd}
        onPointerCancel={handleCanvasPointerEnd}
        onWheel={handleWheel}
        onAuxClick={event => event.preventDefault()}
      >
        <div className={styles.sceneWorld} style={sceneWorldStyle}>
          {activeSceneBackground && (
            <div
              className={styles.mapBackdrop}
              style={{ backgroundImage: `url(${resolveAssetUrl(activeSceneBackground.url)})` }}
            />
          )}

          {gridEnabled && <div className={styles.gridOverlay} />}

          {!activeSceneBackground && (
            <div className={styles.mapPlaceholder}>
              {activeScene?.name ?? 'Crie uma cena para comecar'}
            </div>
          )}

          {activeSceneForeground && (
            <div
              className={styles.mapForeground}
              style={{ backgroundImage: `url(${resolveAssetUrl(activeSceneForeground.url)})` }}
            />
          )}

          {activeSceneFogOverlay && activeScene?.fogExploration && (
            <div
              className={styles.mapFogOverlay}
              style={{ backgroundImage: `url(${resolveAssetUrl(activeSceneFogOverlay.url)})` }}
            />
          )}

          <div className={styles.darknessOverlay} style={darknessStyle} />

          <div className={styles.tokensLayer} aria-label="Tokens no mapa">
            {visibleTokens.map(token => {
              const tokenAsset = token.assetId ? assets.find(asset => asset.id === token.assetId) : undefined
              const tokenImageUrl = tokenAsset?.content_type.startsWith('image/')
                ? resolveAssetUrl(tokenAsset.url)
                : ''

              return (
                <button
                  key={token.id}
                  type="button"
                  className={`${styles.token} ${selectedTokenId === token.id ? styles.tokenSelected : ''} ${tokenImageUrl ? styles.tokenWithImage : ''}`}
                  data-token="true"
                  style={{
                    left: gridOffsetX + (token.x + 0.5) * gridSize,
                    top: gridOffsetY + (token.y + 0.5) * gridSize,
                    transform: 'translate(-50%, -50%)',
                    background: token.color,
                  }}
                  onPointerDown={event => {
                    if (activeTool !== 'token') return
                    event.stopPropagation()
                    event.currentTarget.setPointerCapture(event.pointerId)
                    setSelectedTokenId(token.id)
                    setDraggingTokenId(token.id)
                  }}
                  onPointerMove={event => {
                    if (activeTool !== 'token') return
                    event.stopPropagation()
                    moveDraggedToken(event)
                  }}
                  onPointerUp={event => {
                    if (activeTool !== 'token') return
                    event.stopPropagation()
                    finishDrag()
                  }}
                  onPointerCancel={event => {
                    if (activeTool !== 'token') return
                    event.stopPropagation()
                    finishDrag()
                  }}
                  title={`${token.name} - ${token.hp}/${token.maxHp} PV`}
                >
                  {tokenImageUrl ? <img src={tokenImageUrl} alt="" /> : <span>{token.initial}</span>}
                </button>
              )
            })}
          </div>

          {measure && (
            <div className={styles.measureLayer} aria-label="Medicao no mapa">
              <svg className={styles.measureSvg} viewBox={`0 0 ${sceneWidthPx} ${sceneHeightPx}`}>
                <line
                  className={styles.measureLineShadow}
                  x1={measure.start.x}
                  y1={measure.start.y}
                  x2={measure.end.x}
                  y2={measure.end.y}
                />
                <line
                  className={styles.measureLine}
                  x1={measure.start.x}
                  y1={measure.start.y}
                  x2={measure.end.x}
                  y2={measure.end.y}
                />
                <circle className={styles.measurePoint} cx={measure.start.x} cy={measure.start.y} r="5" />
                <circle className={styles.measurePoint} cx={measure.end.x} cy={measure.end.y} r="5" />
              </svg>
              <div className={styles.measureLabel} style={measureLabelPosition}>
                {measureLabel}
              </div>
            </div>
          )}
        </div>

        <div className={styles.sceneNav} data-map-ui="true">
          <button
            className={styles.sceneNavActive}
            type="button"
            onClick={() => setSceneNavOpen(prev => !prev)}
            aria-expanded={sceneNavOpen}
            title="Cenas fixadas"
          >
            <span className={`${styles.sceneNavArrow} ${sceneNavOpen ? styles.sceneNavArrowOpen : ''}`}>▾</span>
            <span>{activeScene?.navigationName || activeScene?.name || 'Nenhuma cena'}</span>
          </button>

          {sceneNavOpen && (
            <div className={styles.sceneNavMenu}>
              {pinnedScenes.length === 0 && (
                <div className={styles.sceneNavEmpty}>Nenhuma cena fixada</div>
              )}

              {pinnedScenes.map(scene => (
                <button
                  key={scene.id}
                  className={`${styles.sceneNavItem} ${scene.id === activeScene?.id ? styles.sceneNavItemActive : ''}`}
                  type="button"
                  onClick={() => handleSceneActivate(scene)}
                >
                  {scene.navigationName || scene.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <LeftToolbar activeTool={activeTool} onToolChange={handleToolChange} />

      <div className={styles.rightRail} id="right-rail">
        <ChatToggleButton isOpen={activePanel === 'chat'} onToggle={() => togglePanel('chat')} />
        <ScenesToggleButton isOpen={activePanel === 'scenes'} onToggle={() => togglePanel('scenes')} />
        <AssetsToggleButton isOpen={activePanel === 'assets'} onToggle={() => togglePanel('assets')} />

        <div className={styles.rightRailDivider} />

        {RIGHT_TABS.map(tab => (
          <RightTabBtn
            key={tab.id}
            title={tab.title}
            icon={tab.icon}
            isOpen={activePanel === tab.id}
            onClick={() => {
              if (tab.id === 'actors') {
                togglePanel('actors')
                return
              }

              pushActivity('Painel em desenvolvimento', `${tab.title} ainda nao esta ligado a um modulo funcional.`)
            }}
          />
        ))}

        <div className={styles.rightRailDivider} />

        <button className={styles.exitBtn} title="Voltar ao Launcher" onClick={onExit} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {(activePanel === 'chat' || exitingPanel === 'chat') && (
        <ChatPanel
          isOpen={activePanel === 'chat'}
          isExiting={exitingPanel === 'chat'}
          messages={messages}
          onCreateMessage={handleCreateChatMessage}
          onDeleteMessage={handleDeleteChatMessage}
        />
      )}

      {(activePanel === 'scenes' || exitingPanel === 'scenes') && (
        <ScenesPanel
          isOpen={activePanel === 'scenes'}
          isExiting={exitingPanel === 'scenes'}
          scenes={scenes}
          sceneFolders={sceneFolders}
          activeSceneId={activeScene?.id}
          mapAssets={mapAssets}
          onActivateScene={handleSceneActivate}
          onCreateScene={handleCreateScene}
          onCreateFolder={handleCreateSceneFolder}
          onDeleteFolder={handleDeleteSceneFolder}
          onSaveScene={handleSaveScene}
          onDuplicateScene={handleDuplicateScene}
          onDeleteScene={handleDeleteScene}
          onUploadSceneMap={handleUploadSceneMap}
        />
      )}

      {(activePanel === 'assets' || exitingPanel === 'assets') && (
        <AssetsPanel
          isOpen={activePanel === 'assets'}
          isExiting={exitingPanel === 'assets'}
          assets={assets}
          worldId={worldId}
          activeSceneId={activeScene?.id}
          onUploaded={handleAssetUploaded}
          onUseAsSceneMap={handleUseAssetAsSceneMap}
          onDeleteAsset={handleDeleteAsset}
        />
      )}

      {(activePanel === 'actors' || exitingPanel === 'actors') && (
        <ActorsPanel
          isOpen={activePanel === 'actors'}
          isExiting={exitingPanel === 'actors'}
          actors={actors}
          system={system}
          onRequestCreateActor={() => setIsActorCreateOpen(true)}
          onOpenActor={setOpenActorSheetId}
          onCreateMobileSession={handleOpenCompanionDialog}
        />
      )}

      {isActorCreateOpen && (
        <ActorCreateDialog
          system={system}
          onClose={() => setIsActorCreateOpen(false)}
          onCreateActor={handleCreateActor}
        />
      )}

      {openActorSheetId && actors.find(actor => actor.id === openActorSheetId) && (
        <ActorSheetWindow
          key={openActorSheetId}
          actor={actors.find(actor => actor.id === openActorSheetId)!}
          system={system}
          onClose={() => setOpenActorSheetId(null)}
          onSave={handlePatchActor}
          onRoll={handleActorSheetRoll}
        />
      )}

      {(companionActor || companionLink || companionError || isCreatingCompanionLink) && (
        <div className={styles.companionOverlay} data-map-ui="true">
          <section className={styles.companionDialog} role="dialog" aria-modal="true" aria-label="Companion mobile">
            <div className={styles.companionHeader}>
              <div>
                <span>Companion mobile</span>
                <strong>{companionLink?.actor_name || companionActor?.name || 'Preparando ficha'}</strong>
              </div>
              <button type="button" onClick={closeCompanionDialog}>
                X
              </button>
            </div>

            <div className={styles.companionBody}>
              {isCreatingCompanionLink && <p className={styles.companionHint}>Subindo host local e criando token da ficha...</p>}

              {companionError && (
                <p className={styles.companionError}>{companionError}</p>
              )}

              {companionActor && !companionLink && (
                <div className={styles.companionForm}>
                  <label className={styles.companionField}>
                    <span>Nome do jogador</span>
                    <input
                      value={companionPlayerName}
                      onChange={event => setCompanionPlayerName(event.target.value)}
                      placeholder={companionActor.name}
                    />
                  </label>

                  <label className={styles.companionField}>
                    <span>URL externa/tunel opcional</span>
                    <input
                      value={companionPublicBaseUrl}
                      onChange={event => setCompanionPublicBaseUrl(event.target.value)}
                      placeholder="https://seu-tunel.exemplo"
                    />
                    <small>Use apenas se essa URL apontar para o host mobile deste programa.</small>
                  </label>

                  <div className={styles.companionPermissionList}>
                    {COMPANION_PERMISSION_OPTIONS.map(permission => (
                      <label key={permission.id} className={permission.locked ? styles.companionPermissionLocked : styles.companionPermission}>
                        <input
                          type="checkbox"
                          checked={Boolean(companionPermissions[permission.id])}
                          disabled={permission.locked || isCreatingCompanionLink}
                          onChange={() => toggleCompanionPermission(permission.id)}
                        />
                        <span>
                          <strong>{permission.label}</strong>
                          <small>{permission.detail}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {companionLink && (
                <>
                  <div className={styles.companionResult}>
                    <div className={styles.companionQrBox}>
                      <QRCodeSVG
                        value={preferredCompanionUrl(companionLink)}
                        size={168}
                        level="M"
                        includeMargin
                        bgColor="#f8ead0"
                        fgColor="#111113"
                      />
                    </div>
                    <div>
                      <p className={styles.companionHint}>
                        Aponte a camera do celular para o QR Code ou abra um link abaixo na mesma rede. O link principal ja foi copiado quando possivel.
                      </p>
                      <div className={styles.companionLinks}>
                        {companionLink.urls.map(url => (
                          <a key={url} href={url} target="_blank" rel="noreferrer">
                            {url}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className={styles.companionFooter}>
              {companionLink && (
                <button type="button" className={styles.companionSecondary} onClick={handleCopyCompanionLinks}>
                  Copiar link principal
                </button>
              )}
              {companionActor && !companionLink && (
                <button type="button" className={styles.companionPrimary} onClick={handleCreateCompanionLink} disabled={isCreatingCompanionLink}>
                  Gerar link
                </button>
              )}
              <button type="button" className={companionLink ? styles.companionPrimary : styles.companionSecondary} onClick={closeCompanionDialog}>
                Fechar
              </button>
            </div>
          </section>
        </div>
      )}

      <MacroBar onMacroRun={handleMacroRun} />
    </div>
  )
}
