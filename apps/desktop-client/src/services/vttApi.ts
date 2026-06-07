const desktopConfig = window.vttLite
const queryApiBaseUrl = new URLSearchParams(window.location.search).get('apiBaseUrl')
const API_BASE_URL = desktopConfig?.apiBaseUrl ?? queryApiBaseUrl ?? import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8080'
const localStorageApi = desktopConfig?.storage
const companionApi = desktopConfig?.companion

export interface ApiWorld {
  id: string
  name: string
  description: string
  system_id?: string
  system: string
  data_path?: string
  background_image?: string
  join_theme?: string
  next_session?: string
  favorite?: boolean
  locked?: boolean
  safe_configuration?: boolean
}

export type SystemFieldType = 'text' | 'number' | 'textarea' | 'checkbox'

export interface ApiSystemField {
  id: string
  label: string
  type: SystemFieldType
  section: string
  default_value: string | number | boolean
  roll_formula?: string
}

export interface ApiSystemActorType {
  id: string
  label: string
  fields: ApiSystemField[]
}

export interface ApiSystemItemType {
  id: string
  label: string
  fields: ApiSystemField[]
}

export interface ApiGameSystem {
  id: string
  name: string
  ruleset: string
  version: string
  description: string
  package_path?: string
  manifest_path?: string
  actor_types: ApiSystemActorType[]
  item_types?: ApiSystemItemType[]
  primary_token_attribute?: string
  grid?: {
    distance: number
    units: string
  }
}

export interface CreateSystemPayload {
  name: string
  ruleset?: string
  version?: string
  description?: string
  actor_types?: ApiSystemActorType[]
  item_types?: ApiSystemItemType[]
  primary_token_attribute?: string
  grid?: {
    distance: number
    units: string
  }
}

export interface ApiScene {
  id: string
  world_id: string
  name: string
  folder_id?: string
  background_asset_id?: string
  foreground_asset_id?: string
  thumbnail_asset_id?: string
  show_navigation?: boolean
  permission?: string
  navigation_name?: string
  background_color?: string
  preserve_aspect_ratio?: boolean
  scene_padding?: number
  background_elevation?: number
  foreground_elevation?: number
  initial_x?: number
  initial_y?: number
  initial_zoom?: number
  lock_view?: boolean
  grid_type?: string
  grid_size: number
  grid_offset_x?: number
  grid_offset_y?: number
  grid_color?: string
  grid_opacity?: number
  grid_distance?: number
  grid_units?: string
  darkness?: number
  global_light?: boolean
  global_light_threshold?: number
  playlist?: string
  description?: string
  fog_exploration?: boolean
  reset_fog_on_activation?: boolean
  fog_overlay_asset_id?: string
  width: number
  height: number
  active: boolean
}

export interface ApiSceneFolder {
  id: string
  world_id: string
  name: string
  collapsed?: boolean
  created_at?: string
  updated_at?: string
}

export interface ApiChatMessage {
  id: string
  world_id: string
  speaker: string
  type: 'text' | 'roll'
  text: string
  formula?: string
  result?: number
  rolls?: number[]
  created_at: string
}

export interface ApiActorCompanionPermission {
  id: string
  player_name: string
  permissions: ApiCompanionPermissions
  updated_at?: string
}

export interface ApiToken {
  id: string
  scene_id: string
  asset_id?: string
  name: string
  x: number
  y: number
  hp: number
  max_hp: number
  ac: number
  hidden: boolean
}

export interface ActorAttributes {
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}

export interface ApiActor {
  id: string
  world_id: string
  system_id?: string
  name: string
  type: string
  data?: Record<string, string | number | boolean>
  level?: number
  ancestry?: string
  class_name?: string
  hp?: number
  max_hp?: number
  ac?: number
  attributes?: ActorAttributes
  notes?: string
  portrait_asset_id?: string
  companion_permissions?: ApiActorCompanionPermission[]
}

export interface ApiItem {
  id: string
  world_id: string
  actor_id?: string
  type: string
  name: string
  data?: Record<string, string | number | boolean>
  equipped?: boolean
  quantity?: number
  created_at?: string
  updated_at?: string
}

export type ApiCompanionEvent =
  | {
      type: 'actor.updated'
      world_id: string
      actor_id: string
      actor: ApiActor
    }
  | {
      type: 'chat.message.created'
      world_id: string
      actor_id: string
      message: ApiChatMessage
    }
  | {
      type: 'chat.message.deleted'
      world_id: string
      message_id: string
    }

export interface ApiAsset {
  id: string
  world_id?: string
  scene_id?: string
  kind: 'map' | 'token' | 'portrait'
  name: string
  filename: string
  content_type: string
  size_bytes: number
  url: string
}

export interface ApiWorldSnapshot {
  world: ApiWorld
  system?: ApiGameSystem | null
  scenes: ApiScene[]
  scene_folders: ApiSceneFolder[]
  assets: ApiAsset[]
  actors: ApiActor[]
  items: ApiItem[]
  messages: ApiChatMessage[]
  tokens_by_scene: Record<string, ApiToken[]>
}

export interface ApiCompanionStatus {
  running: boolean
  port: number | null
  urls: string[]
}

export interface ApiCompanionPermissions {
  view_actor: boolean
  adjust_hp: boolean
  roll: boolean
  patch_actor: boolean
  chat: boolean
}

export interface ApiCompanionSessionLink {
  token: string
  actor_id: string
  actor_name: string
  world_id: string
  world_name: string
  player_name?: string
  permissions?: ApiCompanionPermissions
  loopback_url: string
  public_url?: string
  urls: string[]
}

export interface CreateCompanionSessionPayload {
  player_name?: string
  permissions?: Partial<ApiCompanionPermissions>
  public_base_url?: string
  remember_permissions?: boolean
}

export interface UploadAssetPayload {
  file: File
  kind: ApiAsset['kind']
  worldId?: string
  sceneId?: string
  name?: string
}

export interface CreateTokenPayload {
  asset_id?: string
  name: string
  x: number
  y: number
  hp?: number
  max_hp?: number
  ac?: number
  hidden?: boolean
}

export interface CreateActorPayload {
  name: string
  type?: string
  data?: Record<string, string | number | boolean>
  level?: number
  ancestry?: string
  class_name?: string
  hp?: number
  max_hp?: number
  ac?: number
  attributes?: Partial<ActorAttributes>
  notes?: string
  portrait_asset_id?: string
}

export interface CreateItemPayload {
  name: string
  type?: string
  actor_id?: string
  data?: Record<string, string | number | boolean>
  equipped?: boolean
  quantity?: number
}

export async function getSystems() {
  if (localStorageApi) {
    return localStorageApi.getSystems()
  }

  return [] as ApiGameSystem[]
}

export async function createSystem(payload: CreateSystemPayload) {
  if (localStorageApi) {
    return localStorageApi.createSystem(payload)
  }

  throw new Error('Sistemas locais exigem o modo programa.')
}

export async function patchSystem(systemId: string, payload: Partial<CreateSystemPayload>) {
  if (localStorageApi) {
    return localStorageApi.patchSystem(systemId, payload)
  }

  throw new Error('Sistemas locais exigem o modo programa.')
}

export async function deleteSystem(systemId: string) {
  if (localStorageApi) {
    return localStorageApi.deleteSystem(systemId)
  }

  throw new Error('Sistemas locais exigem o modo programa.')
}

export async function openSystemFolder(systemId: string) {
  if (localStorageApi?.openSystemFolder) {
    return localStorageApi.openSystemFolder(systemId)
  }

  throw new Error('Abrir pasta de sistema exige o modo programa.')
}

export async function getCompanionStatus() {
  if (companionApi) {
    return companionApi.getStatus()
  }

  throw new Error('Companion mobile exige o modo programa.')
}

export async function createCompanionSession(worldId: string, actorId: string, payload?: CreateCompanionSessionPayload) {
  if (companionApi) {
    return companionApi.createSession(worldId, actorId, payload)
  }

  throw new Error('Companion mobile exige o modo programa.')
}

export function onCompanionEvent(callback: (event: ApiCompanionEvent) => void) {
  if (companionApi?.onEvent) {
    return companionApi.onEvent(callback)
  }

  return () => undefined
}

export async function broadcastCompanionEvent(event: ApiCompanionEvent) {
  if (companionApi?.broadcastEvent) {
    return companionApi.broadcastEvent(event)
  }

  return { ok: false }
}

export async function getWorlds() {
  if (localStorageApi) {
    return localStorageApi.getWorlds()
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/worlds`)
  if (!response.ok) {
    throw new Error(`Erro ao carregar mundos: ${response.status}`)
  }
  return response.json() as Promise<ApiWorld[]>
}

export type CreateWorldPayload = Pick<ApiWorld, 'name'> & Partial<ApiWorld>

export async function createWorld(payload: CreateWorldPayload) {
  if (localStorageApi) {
    return localStorageApi.createWorld(payload)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/worlds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`Erro ao criar mundo: ${response.status}`)
  }
  return response.json() as Promise<ApiWorld>
}

export async function patchWorld(worldId: string, payload: Partial<ApiWorld>) {
  if (localStorageApi) {
    return localStorageApi.patchWorld(worldId, payload)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/worlds/${worldId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`Erro ao atualizar mundo: ${response.status}`)
  }
  return response.json() as Promise<ApiWorld>
}

export async function deleteWorld(worldId: string) {
  if (localStorageApi) {
    return localStorageApi.deleteWorld(worldId)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/worlds/${worldId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`Erro ao apagar mundo: ${response.status}`)
  }
  return response.json() as Promise<{ deleted_id: string }>
}

export function resolveAssetUrl(url: string) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return url
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`
}

export async function createSceneFolder(worldId: string, payload: { name: string }) {
  if (localStorageApi) {
    return localStorageApi.createSceneFolder(worldId, payload)
  }

  throw new Error('Pastas de cena exigem o modo programa.')
}

export async function deleteSceneFolder(folderId: string) {
  if (localStorageApi) {
    return localStorageApi.deleteSceneFolder(folderId)
  }

  throw new Error('Pastas de cena exigem o modo programa.')
}

export async function getWorldSnapshot(worldId: string) {
  if (localStorageApi) {
    return localStorageApi.getWorldSnapshot(worldId)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/worlds/${worldId}/snapshot`)
  if (!response.ok) {
    throw new Error(`Erro ao carregar snapshot: ${response.status}`)
  }
  return response.json() as Promise<ApiWorldSnapshot>
}

export async function getAssets(params: { worldId?: string; sceneId?: string } = {}) {
  if (localStorageApi && params.worldId) {
    const snapshot = await localStorageApi.getWorldSnapshot(params.worldId)
    return snapshot.assets.filter(asset => !params.sceneId || asset.scene_id === params.sceneId)
  }

  const search = new URLSearchParams()
  if (params.worldId) search.set('worldId', params.worldId)
  if (params.sceneId) search.set('sceneId', params.sceneId)

  const query = search.toString()
  const response = await fetch(`${API_BASE_URL}/api/v1/assets${query ? `?${query}` : ''}`)
  if (!response.ok) {
    throw new Error(`Erro ao carregar assets: ${response.status}`)
  }
  return response.json() as Promise<ApiAsset[]>
}

export async function uploadAsset(payload: UploadAssetPayload) {
  if (localStorageApi) {
    const bytes = await payload.file.arrayBuffer()
    return localStorageApi.uploadAsset({
      bytes,
      filename: payload.file.name,
      contentType: payload.file.type,
      kind: payload.kind,
      worldId: payload.worldId,
      sceneId: payload.sceneId,
      name: payload.name,
    })
  }

  const form = new FormData()
  form.set('file', payload.file)
  form.set('kind', payload.kind)
  if (payload.worldId) form.set('worldId', payload.worldId)
  if (payload.sceneId) form.set('sceneId', payload.sceneId)
  if (payload.name?.trim()) form.set('name', payload.name.trim())

  const response = await fetch(`${API_BASE_URL}/api/v1/assets`, {
    method: 'POST',
    body: form,
  })
  if (!response.ok) {
    throw new Error(`Erro ao enviar asset: ${response.status}`)
  }
  return response.json() as Promise<ApiAsset>
}

export async function deleteAsset(assetId: string) {
  if (localStorageApi) {
    return localStorageApi.deleteAsset(assetId)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/assets/${assetId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`Erro ao apagar asset: ${response.status}`)
  }
  return response.json() as Promise<{ deleted_id: string }>
}

export async function createScene(worldId: string, payload: Partial<ApiScene> & { name: string }) {
  if (localStorageApi) {
    return localStorageApi.createScene(worldId, payload)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/worlds/${worldId}/scenes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`Erro ao criar cena: ${response.status}`)
  }
  return response.json() as Promise<ApiScene>
}

export async function duplicateScene(sceneId: string) {
  if (localStorageApi) {
    return localStorageApi.duplicateScene(sceneId)
  }

  throw new Error('Duplicar cenas exige o modo programa.')
}

export async function deleteScene(sceneId: string) {
  if (localStorageApi) {
    return localStorageApi.deleteScene(sceneId)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`Erro ao apagar cena: ${response.status}`)
  }
  return response.json() as Promise<{ deleted_id: string; active_scene_id: string }>
}

export async function createMessage(worldId: string, payload: Omit<ApiChatMessage, 'id' | 'world_id' | 'created_at'>) {
  if (localStorageApi) {
    return localStorageApi.createMessage(worldId, payload)
  }

  throw new Error('Chat local exige o modo programa.')
}

export async function deleteMessage(messageId: string) {
  if (localStorageApi) {
    return localStorageApi.deleteMessage(messageId)
  }

  throw new Error('Chat local exige o modo programa.')
}

export async function createToken(sceneId: string, payload: CreateTokenPayload) {
  if (localStorageApi) {
    return localStorageApi.createToken(sceneId, payload)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`Erro ao criar token: ${response.status}`)
  }
  return response.json() as Promise<ApiToken>
}

export async function patchToken(tokenId: string, payload: Partial<ApiToken>) {
  if (localStorageApi) {
    return localStorageApi.patchToken(tokenId, payload)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/tokens/${tokenId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`Erro ao atualizar token: ${response.status}`)
  }
  return response.json() as Promise<ApiToken>
}

export async function deleteToken(tokenId: string) {
  if (localStorageApi) {
    return localStorageApi.deleteToken(tokenId)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/tokens/${tokenId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`Erro ao apagar token: ${response.status}`)
  }
  return { deleted_id: tokenId }
}

export async function createActor(worldId: string, payload: CreateActorPayload) {
  if (localStorageApi) {
    return localStorageApi.createActor(worldId, payload)
  }

  throw new Error('Fichas locais exigem o modo programa.')
}

export async function patchActor(actorId: string, payload: Partial<ApiActor>) {
  if (localStorageApi) {
    return localStorageApi.patchActor(actorId, payload)
  }

  throw new Error('Fichas locais exigem o modo programa.')
}

export async function deleteActor(actorId: string) {
  if (localStorageApi) {
    return localStorageApi.deleteActor(actorId)
  }

  throw new Error('Fichas locais exigem o modo programa.')
}

export async function createItem(worldId: string, payload: CreateItemPayload) {
  if (localStorageApi) {
    return localStorageApi.createItem(worldId, payload)
  }

  throw new Error('Itens locais exigem o modo programa.')
}

export async function patchItem(itemId: string, payload: Partial<ApiItem>) {
  if (localStorageApi) {
    return localStorageApi.patchItem(itemId, payload)
  }

  throw new Error('Itens locais exigem o modo programa.')
}

export async function deleteItem(itemId: string) {
  if (localStorageApi) {
    return localStorageApi.deleteItem(itemId)
  }

  throw new Error('Itens locais exigem o modo programa.')
}

export async function patchScene(sceneId: string, payload: Partial<ApiScene>) {
  if (localStorageApi) {
    return localStorageApi.patchScene(sceneId, payload)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`Erro ao atualizar cena: ${response.status}`)
  }
  return response.json() as Promise<ApiScene>
}
