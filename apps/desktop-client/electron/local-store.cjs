const crypto = require('node:crypto')
const fs = require('node:fs/promises')
const path = require('node:path')

function now() {
  return new Date().toISOString()
}

function slugify(value) {
  return String(value || 'mundo')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42) || 'mundo'
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`
}

function asNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function sceneDimensionToPixels(width, height, gridSize) {
  const rawWidth = asNumber(width, 1600)
  const rawHeight = asNumber(height, 1200)
  const isLegacyCellSize = rawWidth > 0 && rawHeight > 0 && rawWidth <= 200 && rawHeight <= 200

  return {
    width: Math.round(isLegacyCellSize ? rawWidth * gridSize : rawWidth),
    height: Math.round(isLegacyCellSize ? rawHeight * gridSize : rawHeight),
  }
}

function sanitizeFilename(name) {
  const fallback = 'asset.bin'
  const base = path.basename(String(name || '').trim())
  if (!base || base === '.' || base === '..') return fallback
  return base.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-')
}

function normalizeAssetKind(kind) {
  return ['map', 'token', 'portrait'].includes(kind) ? kind : 'map'
}

function safeJoin(root, ...parts) {
  const target = path.resolve(root, ...parts)
  const normalizedRoot = path.resolve(root)
  const normalizedRootWithSep = normalizedRoot.endsWith(path.sep) ? normalizedRoot : `${normalizedRoot}${path.sep}`
  if (target !== normalizedRoot && !target.startsWith(normalizedRootWithSep)) {
    throw new Error('Caminho fora da pasta de saves.')
  }
  return target
}

async function readJSON(filePath, fallback) {
  try {
    const text = await fs.readFile(filePath, 'utf-8')
    if (!text.trim()) return fallback
    return JSON.parse(text)
  } catch (error) {
    if (error.code === 'ENOENT') return fallback
    throw error
  }
}

async function writeJSON(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const tmpPath = `${filePath}.tmp`
  await fs.writeFile(tmpPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
  await fs.rename(tmpPath, filePath)
}

function createLocalStore(savesDir) {
  const root = path.resolve(savesDir)
  const indexPath = path.join(root, 'index.json')
  const worldsDir = path.join(root, 'worlds')

  async function ensureRoot() {
    await fs.mkdir(worldsDir, { recursive: true })
    const index = await readJSON(indexPath, null)
    if (!index) {
      await writeJSON(indexPath, { worlds: [], systems: [] })
      return
    }

    if (!Array.isArray(index.worlds) || !Array.isArray(index.systems)) {
      await writeJSON(indexPath, {
        ...index,
        worlds: Array.isArray(index.worlds) ? index.worlds : [],
        systems: Array.isArray(index.systems) ? index.systems : [],
      })
    }
  }

  function worldDir(worldId) {
    return safeJoin(worldsDir, worldId)
  }

  function worldFile(worldId) {
    return path.join(worldDir(worldId), 'world.json')
  }

  async function readIndex() {
    await ensureRoot()
    const index = await readJSON(indexPath, { worlds: [], systems: [] })
    return {
      worlds: Array.isArray(index.worlds) ? index.worlds : [],
      systems: Array.isArray(index.systems) ? index.systems : [],
    }
  }

  async function writeIndex(index) {
    await writeJSON(indexPath, index)
  }

  async function readWorld(worldId) {
    const data = await readJSON(worldFile(worldId), null)
    if (!data) throw new Error('Mundo nao encontrado.')
    data.scenes ??= []
    data.scene_folders ??= []
    data.assets ??= []
    data.tokens ??= []
    data.messages ??= []
    data.actors ??= []
    return data
  }

  async function writeWorld(data) {
    data.world.updated_at = now()
    await writeJSON(worldFile(data.world.id), data)

    const index = await readIndex()
    index.worlds = index.worlds.filter(world => world.id !== data.world.id)
    index.worlds.push(data.world)
    await writeIndex(index)
  }

  async function findWorldByEntity(predicate) {
    const index = await readIndex()
    for (const world of index.worlds) {
      const data = await readWorld(world.id)
      if (predicate(data)) return data
    }
    throw new Error('Registro nao encontrado.')
  }

  function toSnapshot(data) {
    const tokensByScene = {}
    for (const scene of data.scenes) {
      tokensByScene[scene.id] = []
    }
    for (const token of data.tokens) {
      if (!tokensByScene[token.scene_id]) tokensByScene[token.scene_id] = []
      tokensByScene[token.scene_id].push(token)
    }
    return {
      world: data.world,
      scenes: data.scenes,
      scene_folders: data.scene_folders,
      assets: data.assets,
      actors: data.actors,
      messages: data.messages,
      tokens_by_scene: tokensByScene,
    }
  }

  async function listWorlds() {
    const index = await readIndex()
    return index.worlds.sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }

  async function listSystems() {
    const index = await readIndex()
    return index.systems.sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }

  async function createSystem(payload) {
    const index = await readIndex()
    const timestamp = now()
    const system = {
      id: newId('system'),
      name: String(payload?.name || '').trim(),
      ruleset: String(payload?.ruleset || ''),
      version: String(payload?.version || ''),
      description: String(payload?.description || ''),
      created_at: timestamp,
      updated_at: timestamp,
    }
    if (!system.name) throw new Error('Nome do sistema e obrigatorio.')

    index.systems = index.systems.filter(item => item.id !== system.id)
    index.systems.push(system)
    await writeIndex(index)
    return system
  }

  async function deleteSystem(systemId) {
    const index = await readIndex()
    const nextSystems = index.systems.filter(system => system.id !== systemId)
    if (nextSystems.length === index.systems.length) {
      throw new Error('Sistema nao encontrado.')
    }
    index.systems = nextSystems
    await writeIndex(index)
    return { deleted_id: systemId }
  }

  async function createWorld(payload) {
    await ensureRoot()
    const index = await readIndex()
    const selectedSystemId = String(payload?.system_id || '').trim()
    if (!selectedSystemId) {
      throw new Error('Cadastre e selecione um sistema antes de criar um mundo.')
    }

    const selectedSystem = index.systems.find(system => system.id === selectedSystemId)
    if (!selectedSystem) {
      throw new Error('Sistema selecionado nao encontrado.')
    }

    const timestamp = now()
    const world = {
      id: newId('world'),
      name: String(payload?.name || '').trim(),
      description: String(payload?.description || ''),
      system_id: selectedSystem.id,
      system: selectedSystem.name,
      data_path: String(payload?.data_path || slugify(payload?.name)),
      background_image: String(payload?.background_image || ''),
      join_theme: String(payload?.join_theme || 'default'),
      next_session: String(payload?.next_session || ''),
      favorite: Boolean(payload?.favorite),
      locked: Boolean(payload?.locked),
      safe_configuration: Boolean(payload?.safe_configuration),
      created_at: timestamp,
      updated_at: timestamp,
    }
    if (!world.name) throw new Error('Nome do mundo e obrigatorio.')

    const data = {
      world,
      scenes: [],
      scene_folders: [],
      assets: [],
      tokens: [],
      actors: [],
      messages: [],
    }

    await fs.mkdir(path.join(worldDir(world.id), 'assets'), { recursive: true })
    await writeWorld(data)
    return world
  }

  async function patchWorld(worldId, patch) {
    const data = await readWorld(worldId)
    const index = await readIndex()
    const nextWorld = { ...data.world }

    if (Object.prototype.hasOwnProperty.call(patch || {}, 'name')) {
      nextWorld.name = String(patch.name || '').trim()
      if (!nextWorld.name) throw new Error('Nome do mundo e obrigatorio.')
    }

    if (Object.prototype.hasOwnProperty.call(patch || {}, 'description')) {
      nextWorld.description = String(patch.description || '')
    }

    if (Object.prototype.hasOwnProperty.call(patch || {}, 'data_path')) {
      nextWorld.data_path = String(patch.data_path || slugify(nextWorld.name)).trim() || slugify(nextWorld.name)
    }

    if (Object.prototype.hasOwnProperty.call(patch || {}, 'background_image')) {
      nextWorld.background_image = String(patch.background_image || '')
    }

    if (Object.prototype.hasOwnProperty.call(patch || {}, 'join_theme')) {
      nextWorld.join_theme = String(patch.join_theme || 'default')
    }

    if (Object.prototype.hasOwnProperty.call(patch || {}, 'next_session')) {
      nextWorld.next_session = String(patch.next_session || '')
    }

    if (Object.prototype.hasOwnProperty.call(patch || {}, 'favorite')) {
      nextWorld.favorite = Boolean(patch.favorite)
    }

    if (Object.prototype.hasOwnProperty.call(patch || {}, 'locked')) {
      nextWorld.locked = Boolean(patch.locked)
    }

    if (Object.prototype.hasOwnProperty.call(patch || {}, 'safe_configuration')) {
      nextWorld.safe_configuration = Boolean(patch.safe_configuration)
    }

    if (Object.prototype.hasOwnProperty.call(patch || {}, 'system_id')) {
      const selectedSystemId = String(patch.system_id || '').trim()
      const selectedSystem = index.systems.find(system => system.id === selectedSystemId)
      if (!selectedSystem) throw new Error('Sistema selecionado nao encontrado.')
      nextWorld.system_id = selectedSystem.id
      nextWorld.system = selectedSystem.name
    }

    data.world = nextWorld
    await writeWorld(data)
    return data.world
  }

  async function deleteWorld(worldId) {
    const index = await readIndex()
    const nextWorlds = index.worlds.filter(world => world.id !== worldId)
    if (nextWorlds.length === index.worlds.length) {
      throw new Error('Mundo nao encontrado.')
    }

    await fs.rm(worldDir(worldId), { recursive: true, force: true })
    await writeIndex({ ...index, worlds: nextWorlds })
    return { deleted_id: worldId }
  }

  async function getWorldSnapshot(worldId) {
    return toSnapshot(await readWorld(worldId))
  }

  async function createSceneFolder(worldId, payload) {
    const data = await readWorld(worldId)
    const timestamp = now()
    const folder = {
      id: newId('scene_folder'),
      world_id: worldId,
      name: String(payload?.name || 'Nova pasta').trim() || 'Nova pasta',
      collapsed: Boolean(payload?.collapsed),
      created_at: timestamp,
      updated_at: timestamp,
    }

    data.scene_folders.push(folder)
    await writeWorld(data)
    return folder
  }

  async function deleteSceneFolder(folderId) {
    const data = await findWorldByEntity(world => world.scene_folders?.some(folder => folder.id === folderId))
    data.scene_folders = data.scene_folders.filter(folder => folder.id !== folderId)
    data.scenes = data.scenes.map(scene => (
      scene.folder_id === folderId
        ? { ...scene, folder_id: '', updated_at: now() }
        : scene
    ))
    await writeWorld(data)
    return { deleted_id: folderId }
  }

  async function createScene(worldId, payload) {
    const data = await readWorld(worldId)
    const timestamp = now()
    const scene = {
      id: newId('scene'),
      world_id: worldId,
      name: String(payload?.name || 'Nova cena').trim() || 'Nova cena',
      folder_id: payload?.folder_id || '',
      background_asset_id: payload?.background_asset_id || '',
      foreground_asset_id: payload?.foreground_asset_id || '',
      thumbnail_asset_id: payload?.thumbnail_asset_id || payload?.background_asset_id || '',
      show_navigation: payload?.show_navigation ?? true,
      permission: payload?.permission || 'gm',
      navigation_name: payload?.navigation_name || '',
      background_color: payload?.background_color || '#111111',
      preserve_aspect_ratio: payload?.preserve_aspect_ratio ?? true,
      scene_padding: Number(payload?.scene_padding ?? 0.25),
      background_elevation: Number(payload?.background_elevation || 0),
      foreground_elevation: Number(payload?.foreground_elevation || 0),
      initial_x: Number(payload?.initial_x || 0),
      initial_y: Number(payload?.initial_y || 0),
      initial_zoom: Number(payload?.initial_zoom || 1),
      lock_view: Boolean(payload?.lock_view),
      grid_type: payload?.grid_type || 'square',
      grid_size: Number(payload?.grid_size || 40),
      grid_offset_x: Number(payload?.grid_offset_x || 0),
      grid_offset_y: Number(payload?.grid_offset_y || 0),
      grid_color: payload?.grid_color || '#ffffff',
      grid_opacity: Number(payload?.grid_opacity ?? 0.35),
      grid_distance: Number(payload?.grid_distance || 5),
      grid_units: payload?.grid_units || 'ft',
      darkness: Number(payload?.darkness || 0),
      global_light: Boolean(payload?.global_light),
      global_light_threshold: Number(payload?.global_light_threshold || 0),
      playlist: payload?.playlist || '',
      description: payload?.description || '',
      fog_exploration: payload?.fog_exploration ?? true,
      reset_fog_on_activation: Boolean(payload?.reset_fog_on_activation),
      fog_overlay_asset_id: payload?.fog_overlay_asset_id || '',
      width: Number(payload?.width || 1600),
      height: Number(payload?.height || 1200),
      active: data.scenes.length === 0 || Boolean(payload?.active),
      created_at: timestamp,
      updated_at: timestamp,
    }
    if (scene.active) {
      data.scenes = data.scenes.map(item => ({ ...item, active: false, updated_at: timestamp }))
    }
    data.scenes.push(scene)
    await writeWorld(data)
    return scene
  }

  async function duplicateScene(sceneId) {
    const data = await findWorldByEntity(world => world.scenes.some(scene => scene.id === sceneId))
    const source = data.scenes.find(scene => scene.id === sceneId)
    if (!source) throw new Error('Cena nao encontrada.')

    const timestamp = now()
    const scene = {
      ...source,
      id: newId('scene'),
      name: `${source.name} (copia)`,
      active: false,
      created_at: timestamp,
      updated_at: timestamp,
    }

    data.scenes.push(scene)
    data.tokens = [
      ...data.tokens,
      ...data.tokens
        .filter(token => token.scene_id === source.id)
        .map(token => ({
          ...token,
          id: newId('token'),
          scene_id: scene.id,
          created_at: timestamp,
          updated_at: timestamp,
        })),
    ]
    await writeWorld(data)
    return scene
  }

  async function deleteScene(sceneId) {
    const data = await findWorldByEntity(world => world.scenes.some(scene => scene.id === sceneId))
    const deletedScene = data.scenes.find(scene => scene.id === sceneId)
    if (!deletedScene) throw new Error('Cena nao encontrada.')

    data.scenes = data.scenes.filter(scene => scene.id !== sceneId)
    data.tokens = data.tokens.filter(token => token.scene_id !== sceneId)
    data.assets = data.assets.map(asset => (
      asset.scene_id === sceneId ? { ...asset, scene_id: '' } : asset
    ))

    if (deletedScene.active && data.scenes.length > 0) {
      data.scenes = data.scenes.map((scene, index) => ({
        ...scene,
        active: index === 0,
        updated_at: now(),
      }))
    }

    await writeWorld(data)
    return {
      deleted_id: sceneId,
      active_scene_id: data.scenes.find(scene => scene.active)?.id ?? '',
    }
  }

  async function patchScene(sceneId, patch) {
    const data = await findWorldByEntity(world => world.scenes.some(scene => scene.id === sceneId))
    const timestamp = now()
    data.scenes = data.scenes.map(scene => {
      if (scene.id !== sceneId) {
        return patch?.active ? { ...scene, active: false, updated_at: timestamp } : scene
      }
      return {
        ...scene,
        name: patch?.name ?? scene.name,
        folder_id: patch?.folder_id ?? scene.folder_id ?? '',
        background_asset_id: patch?.background_asset_id ?? scene.background_asset_id,
        foreground_asset_id: patch?.foreground_asset_id ?? scene.foreground_asset_id ?? '',
        thumbnail_asset_id: patch?.thumbnail_asset_id ?? scene.thumbnail_asset_id ?? scene.background_asset_id ?? '',
        show_navigation: patch?.show_navigation ?? scene.show_navigation ?? true,
        permission: patch?.permission ?? scene.permission ?? 'gm',
        navigation_name: patch?.navigation_name ?? scene.navigation_name ?? '',
        background_color: patch?.background_color ?? scene.background_color ?? '#111111',
        preserve_aspect_ratio: patch?.preserve_aspect_ratio ?? scene.preserve_aspect_ratio ?? true,
        scene_padding: patch?.scene_padding ?? scene.scene_padding ?? 0.25,
        background_elevation: patch?.background_elevation ?? scene.background_elevation ?? 0,
        foreground_elevation: patch?.foreground_elevation ?? scene.foreground_elevation ?? 0,
        initial_x: patch?.initial_x ?? scene.initial_x ?? 0,
        initial_y: patch?.initial_y ?? scene.initial_y ?? 0,
        initial_zoom: patch?.initial_zoom ?? scene.initial_zoom ?? 1,
        lock_view: patch?.lock_view ?? scene.lock_view ?? false,
        grid_type: patch?.grid_type ?? scene.grid_type ?? 'square',
        grid_size: patch?.grid_size ?? scene.grid_size,
        grid_offset_x: patch?.grid_offset_x ?? scene.grid_offset_x ?? 0,
        grid_offset_y: patch?.grid_offset_y ?? scene.grid_offset_y ?? 0,
        grid_color: patch?.grid_color ?? scene.grid_color ?? '#ffffff',
        grid_opacity: patch?.grid_opacity ?? scene.grid_opacity ?? 0.35,
        grid_distance: patch?.grid_distance ?? scene.grid_distance ?? 5,
        grid_units: patch?.grid_units ?? scene.grid_units ?? 'ft',
        darkness: patch?.darkness ?? scene.darkness ?? 0,
        global_light: patch?.global_light ?? scene.global_light ?? false,
        global_light_threshold: patch?.global_light_threshold ?? scene.global_light_threshold ?? 0,
        playlist: patch?.playlist ?? scene.playlist ?? '',
        description: patch?.description ?? scene.description ?? '',
        fog_exploration: patch?.fog_exploration ?? scene.fog_exploration ?? true,
        reset_fog_on_activation: patch?.reset_fog_on_activation ?? scene.reset_fog_on_activation ?? false,
        fog_overlay_asset_id: patch?.fog_overlay_asset_id ?? scene.fog_overlay_asset_id ?? '',
        width: patch?.width ?? scene.width,
        height: patch?.height ?? scene.height,
        active: patch?.active ?? scene.active,
        updated_at: timestamp,
      }
    })
    await writeWorld(data)
    return data.scenes.find(scene => scene.id === sceneId)
  }

  async function createMessage(worldId, payload) {
    const data = await readWorld(worldId)
    const timestamp = now()
    const message = {
      id: newId('message'),
      world_id: worldId,
      speaker: String(payload?.speaker || 'Gamemaster').trim() || 'Gamemaster',
      type: payload?.type === 'roll' ? 'roll' : 'text',
      text: String(payload?.text || ''),
      formula: String(payload?.formula || ''),
      result: Number.isFinite(Number(payload?.result)) ? Number(payload.result) : undefined,
      rolls: Array.isArray(payload?.rolls) ? payload.rolls.map(Number).filter(Number.isFinite) : [],
      created_at: timestamp,
    }

    data.messages.push(message)
    await writeWorld(data)
    return message
  }

  async function deleteMessage(messageId) {
    const data = await findWorldByEntity(world => world.messages?.some(message => message.id === messageId))
    data.messages = data.messages.filter(message => message.id !== messageId)
    await writeWorld(data)
    return { deleted_id: messageId }
  }

  async function patchToken(tokenId, patch) {
    const data = await findWorldByEntity(world => world.tokens.some(token => token.id === tokenId))
    const timestamp = now()
    data.tokens = data.tokens.map(token => (
      token.id === tokenId
        ? { ...token, ...patch, updated_at: timestamp }
        : token
    ))
    await writeWorld(data)
    return data.tokens.find(token => token.id === tokenId)
  }

  async function createToken(sceneId, payload) {
    if (!sceneId) throw new Error('sceneId e obrigatorio para criar token.')

    const data = await findWorldByEntity(world => world.scenes.some(scene => scene.id === sceneId))
    const scene = data.scenes.find(item => item.id === sceneId)
    if (!scene) throw new Error('Cena nao encontrada.')

    const timestamp = now()
    const sceneGridSize = Number(scene.grid_size || 40)
    const sceneSize = sceneDimensionToPixels(scene.width, scene.height, sceneGridSize)
    const centerX = Math.floor(sceneSize.width / sceneGridSize / 2)
    const centerY = Math.floor(sceneSize.height / sceneGridSize / 2)
    const maxHp = Number(payload?.max_hp ?? payload?.maxHp ?? 10)
    const hp = Number(payload?.hp ?? maxHp)
    const token = {
      id: newId('token'),
      scene_id: sceneId,
      asset_id: payload?.asset_id || payload?.assetId || '',
      name: String(payload?.name || 'Novo token').trim() || 'Novo token',
      x: Number.isFinite(Number(payload?.x)) ? Number(payload.x) : centerX,
      y: Number.isFinite(Number(payload?.y)) ? Number(payload.y) : centerY,
      hp: hp > 0 ? hp : maxHp,
      max_hp: maxHp > 0 ? maxHp : 10,
      ac: Number(payload?.ac || 10),
      hidden: Boolean(payload?.hidden),
      created_at: timestamp,
      updated_at: timestamp,
    }

    data.tokens.push(token)
    await writeWorld(data)
    return token
  }

  async function deleteToken(tokenId) {
    const data = await findWorldByEntity(world => world.tokens.some(token => token.id === tokenId))
    data.tokens = data.tokens.filter(token => token.id !== tokenId)
    await writeWorld(data)
    return { deleted_id: tokenId }
  }

  function normalizeActorAttributes(attributes = {}) {
    return {
      str: asNumber(attributes.str, 10),
      dex: asNumber(attributes.dex, 10),
      con: asNumber(attributes.con, 10),
      int: asNumber(attributes.int, 10),
      wis: asNumber(attributes.wis, 10),
      cha: asNumber(attributes.cha, 10),
    }
  }

  async function createActor(worldId, payload) {
    const data = await readWorld(worldId)
    const timestamp = now()
    const maxHp = asNumber(payload?.max_hp ?? payload?.maxHp, 10)
    const actor = {
      id: newId('actor'),
      world_id: worldId,
      name: String(payload?.name || 'Nova ficha').trim() || 'Nova ficha',
      type: String(payload?.type || 'personagem'),
      level: asNumber(payload?.level, 1),
      ancestry: String(payload?.ancestry || ''),
      class_name: String(payload?.class_name || payload?.className || ''),
      hp: asNumber(payload?.hp, maxHp),
      max_hp: maxHp,
      ac: asNumber(payload?.ac, 10),
      attributes: normalizeActorAttributes(payload?.attributes),
      notes: String(payload?.notes || ''),
      portrait_asset_id: String(payload?.portrait_asset_id || payload?.portraitAssetId || ''),
      created_at: timestamp,
      updated_at: timestamp,
    }

    data.actors.push(actor)
    await writeWorld(data)
    return actor
  }

  async function patchActor(actorId, patch) {
    const data = await findWorldByEntity(world => world.actors?.some(actor => actor.id === actorId))
    const timestamp = now()
    data.actors = data.actors.map(actor => {
      if (actor.id !== actorId) return actor
      return {
        ...actor,
        name: patch?.name ?? actor.name,
        type: patch?.type ?? actor.type,
        level: patch?.level ?? actor.level,
        ancestry: patch?.ancestry ?? actor.ancestry ?? '',
        class_name: patch?.class_name ?? actor.class_name ?? '',
        hp: patch?.hp ?? actor.hp,
        max_hp: patch?.max_hp ?? actor.max_hp,
        ac: patch?.ac ?? actor.ac,
        attributes: {
          ...normalizeActorAttributes(actor.attributes),
          ...(patch?.attributes || {}),
        },
        notes: patch?.notes ?? actor.notes ?? '',
        portrait_asset_id: patch?.portrait_asset_id ?? actor.portrait_asset_id ?? '',
        updated_at: timestamp,
      }
    })
    await writeWorld(data)
    return data.actors.find(actor => actor.id === actorId)
  }

  async function deleteActor(actorId) {
    const data = await findWorldByEntity(world => world.actors?.some(actor => actor.id === actorId))
    data.actors = data.actors.filter(actor => actor.id !== actorId)
    await writeWorld(data)
    return { deleted_id: actorId }
  }

  async function deleteAsset(assetId) {
    const data = await findWorldByEntity(world => world.assets.some(asset => asset.id === assetId))
    const asset = data.assets.find(item => item.id === assetId)
    if (!asset) throw new Error('Asset nao encontrado.')

    data.assets = data.assets.filter(item => item.id !== assetId)
    data.scenes = data.scenes.map(scene => (
      scene.background_asset_id === assetId || scene.foreground_asset_id === assetId || scene.fog_overlay_asset_id === assetId
        ? {
            ...scene,
            background_asset_id: scene.background_asset_id === assetId ? '' : scene.background_asset_id,
            foreground_asset_id: scene.foreground_asset_id === assetId ? '' : scene.foreground_asset_id,
            fog_overlay_asset_id: scene.fog_overlay_asset_id === assetId ? '' : scene.fog_overlay_asset_id,
            updated_at: now(),
          }
        : scene
    ))

    await fs.rm(path.join(worldDir(data.world.id), 'assets', assetId), { recursive: true, force: true })
    await writeWorld(data)
    return { deleted_id: assetId }
  }

  async function uploadAsset(payload) {
    const worldId = payload?.worldId
    if (!worldId) throw new Error('worldId e obrigatorio para salvar asset.')

    const data = await readWorld(worldId)
    const assetId = newId('asset')
    const filename = sanitizeFilename(payload.filename)
    const assetDir = path.join(worldDir(worldId), 'assets', assetId)
    const filePath = path.join(assetDir, filename)
    const bytes = Buffer.from(payload.bytes)

    await fs.mkdir(assetDir, { recursive: true })
    await fs.writeFile(filePath, bytes)

    const asset = {
      id: assetId,
      world_id: worldId,
      scene_id: payload.sceneId || '',
      kind: normalizeAssetKind(payload.kind),
      name: String(payload.name || path.basename(filename, path.extname(filename))),
      filename,
      content_type: String(payload.contentType || 'application/octet-stream'),
      size_bytes: bytes.byteLength,
      url: `vttlocal://asset/${worldId}/${assetId}/${filename}`,
      created_at: now(),
    }

    data.assets.push(asset)
    await writeWorld(data)
    return asset
  }

  function resolveAssetPath(urlString) {
    const url = new URL(urlString)
    if (url.protocol !== 'vttlocal:' || url.hostname !== 'asset') {
      throw new Error('URL de asset invalida.')
    }
    const [worldId, assetId, ...filenameParts] = url.pathname.split('/').filter(Boolean)
    const filename = filenameParts.join('/')
    return safeJoin(worldsDir, worldId, 'assets', assetId, filename)
  }

  return {
    root,
    listWorlds,
    listSystems,
    createSystem,
    deleteSystem,
    createWorld,
    patchWorld,
    deleteWorld,
    getWorldSnapshot,
    createSceneFolder,
    deleteSceneFolder,
    createScene,
    duplicateScene,
    deleteScene,
    patchScene,
    createMessage,
    deleteMessage,
    createToken,
    patchToken,
    deleteToken,
    createActor,
    patchActor,
    deleteActor,
    uploadAsset,
    deleteAsset,
    resolveAssetPath,
  }
}

module.exports = {
  createLocalStore,
}
