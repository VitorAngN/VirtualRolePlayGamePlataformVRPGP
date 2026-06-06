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

const SYSTEM_FIELD_TYPES = new Set(['text', 'number', 'textarea', 'checkbox'])
const SYSTEM_ID_PATTERN = /^[a-z0-9_]+$/
const DEFAULT_COMPANION_PERMISSIONS = Object.freeze({
  view_actor: true,
  adjust_hp: true,
  roll: true,
  patch_actor: false,
  chat: false,
})

function fieldId(value, fallback = 'campo') {
  return String(value || fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 36) || fallback
}

function normalizeDefaultValue(type, value) {
  if (type === 'number') return asNumber(value, 0)
  if (type === 'checkbox') {
    if (typeof value === 'string') {
      return ['1', 'true', 'sim', 'yes', 'on'].includes(value.trim().toLowerCase())
    }
    return Boolean(value)
  }
  return String(value ?? '')
}

function normalizeCompanionPermissions(permissions = {}) {
  const normalized = { ...DEFAULT_COMPANION_PERMISSIONS }
  for (const key of Object.keys(DEFAULT_COMPANION_PERMISSIONS)) {
    if (Object.prototype.hasOwnProperty.call(permissions, key)) {
      normalized[key] = Boolean(permissions[key])
    }
  }
  normalized.view_actor = true
  return normalized
}

function normalizeActorCompanionPermissions(value) {
  if (!Array.isArray(value)) return []
  return value
    .map(entry => {
      const playerName = String(entry?.player_name || entry?.playerName || '').trim()
      if (!playerName) return null
      return {
        id: String(entry?.id || newId('companion_permission')),
        player_name: playerName,
        permissions: normalizeCompanionPermissions(entry?.permissions),
        updated_at: String(entry?.updated_at || entry?.updatedAt || now()),
      }
    })
    .filter(Boolean)
}

function normalizeSystemField(field, index = 0) {
  const type = SYSTEM_FIELD_TYPES.has(field?.type) ? field.type : 'text'
  const label = String(field?.label || field?.name || `Campo ${index + 1}`).trim() || `Campo ${index + 1}`
  const id = fieldId(field?.id || label, `campo_${index + 1}`)
  const rollFormula = String(field?.roll_formula ?? field?.rollFormula ?? '').trim()

  return {
    id,
    label,
    type,
    section: String(field?.section || 'Basico').trim() || 'Basico',
    default_value: normalizeDefaultValue(type, field?.default_value ?? field?.defaultValue),
    roll_formula: rollFormula,
  }
}

function defaultActorFields() {
  return [
    { id: 'level', label: 'Nivel', type: 'number', section: 'Identidade', default_value: 1 },
    { id: 'class_name', label: 'Classe', type: 'text', section: 'Identidade', default_value: '' },
    { id: 'ancestry', label: 'Ancestralidade', type: 'text', section: 'Identidade', default_value: '' },
    { id: 'background', label: 'Antecedente', type: 'text', section: 'Identidade', default_value: '' },
    { id: 'alignment', label: 'Tendencia', type: 'text', section: 'Identidade', default_value: '' },
    { id: 'proficiency_bonus', label: 'Bonus de proficiencia', type: 'number', section: 'Identidade', default_value: 2 },
    { id: 'experience', label: 'Experiencia', type: 'number', section: 'Identidade', default_value: 0 },
    { id: 'hp', label: 'PV atual', type: 'number', section: 'Combate', default_value: 10 },
    { id: 'max_hp', label: 'PV maximo', type: 'number', section: 'Combate', default_value: 10 },
    { id: 'temp_hp', label: 'PV temporario', type: 'number', section: 'Combate', default_value: 0 },
    { id: 'ac', label: 'CA', type: 'number', section: 'Combate', default_value: 10 },
    { id: 'speed', label: 'Deslocamento', type: 'number', section: 'Combate', default_value: 9 },
    { id: 'hit_dice', label: 'Dados de vida', type: 'text', section: 'Combate', default_value: '1d8' },
    { id: 'death_saves', label: 'Testes contra morte', type: 'text', section: 'Combate', default_value: '' },
    { id: 'passive_perception', label: 'Percepcao passiva', type: 'number', section: 'Combate', default_value: 10 },
    { id: 'str', label: 'Forca', type: 'number', section: 'Atributos', default_value: 10, roll_formula: '1d20 + @str.mod' },
    { id: 'dex', label: 'Destreza', type: 'number', section: 'Atributos', default_value: 10, roll_formula: '1d20 + @dex.mod' },
    { id: 'con', label: 'Constituicao', type: 'number', section: 'Atributos', default_value: 10, roll_formula: '1d20 + @con.mod' },
    { id: 'int', label: 'Inteligencia', type: 'number', section: 'Atributos', default_value: 10, roll_formula: '1d20 + @int.mod' },
    { id: 'wis', label: 'Sabedoria', type: 'number', section: 'Atributos', default_value: 10, roll_formula: '1d20 + @wis.mod' },
    { id: 'cha', label: 'Carisma', type: 'number', section: 'Atributos', default_value: 10, roll_formula: '1d20 + @cha.mod' },
    { id: 'save_str_prof', label: 'Prof. teste Forca', type: 'checkbox', section: 'Salvaguardas', default_value: false },
    { id: 'save_dex_prof', label: 'Prof. teste Destreza', type: 'checkbox', section: 'Salvaguardas', default_value: false },
    { id: 'save_con_prof', label: 'Prof. teste Constituicao', type: 'checkbox', section: 'Salvaguardas', default_value: false },
    { id: 'save_int_prof', label: 'Prof. teste Inteligencia', type: 'checkbox', section: 'Salvaguardas', default_value: false },
    { id: 'save_wis_prof', label: 'Prof. teste Sabedoria', type: 'checkbox', section: 'Salvaguardas', default_value: false },
    { id: 'save_cha_prof', label: 'Prof. teste Carisma', type: 'checkbox', section: 'Salvaguardas', default_value: false },
    { id: 'skill_acrobatics_prof', label: 'Prof. Acrobacia', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'skill_animal_handling_prof', label: 'Prof. Adestrar Animais', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'skill_arcana_prof', label: 'Prof. Arcanismo', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'skill_athletics_prof', label: 'Prof. Atletismo', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'skill_deception_prof', label: 'Prof. Enganacao', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'skill_history_prof', label: 'Prof. Historia', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'skill_insight_prof', label: 'Prof. Intuicao', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'skill_intimidation_prof', label: 'Prof. Intimidacao', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'skill_investigation_prof', label: 'Prof. Investigacao', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'skill_medicine_prof', label: 'Prof. Medicina', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'skill_nature_prof', label: 'Prof. Natureza', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'skill_perception_prof', label: 'Prof. Percepcao', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'skill_performance_prof', label: 'Prof. Performance', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'skill_persuasion_prof', label: 'Prof. Persuasao', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'skill_religion_prof', label: 'Prof. Religiao', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'skill_sleight_of_hand_prof', label: 'Prof. Prestidigitacao', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'skill_stealth_prof', label: 'Prof. Furtividade', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'skill_survival_prof', label: 'Prof. Sobrevivencia', type: 'checkbox', section: 'Pericias', default_value: false },
    { id: 'initiative_bonus', label: 'Bonus de iniciativa', type: 'number', section: 'Acoes', default_value: 0, roll_formula: '1d20 + @dex.mod + @initiative_bonus' },
    { id: 'attack_bonus', label: 'Bonus de ataque', type: 'number', section: 'Acoes', default_value: 0, roll_formula: '1d20 + @attack_bonus' },
    { id: 'damage_formula', label: 'Formula de dano padrao', type: 'text', section: 'Acoes', default_value: '1d8' },
    { id: 'actions', label: 'Acoes e ataques', type: 'textarea', section: 'Acoes', default_value: '' },
    { id: 'bonus_actions', label: 'Acoes bonus', type: 'textarea', section: 'Acoes', default_value: '' },
    { id: 'reactions', label: 'Reacoes', type: 'textarea', section: 'Acoes', default_value: '' },
    { id: 'currency', label: 'Moedas/recursos', type: 'text', section: 'Inventario', default_value: '' },
    { id: 'equipment', label: 'Equipamentos', type: 'textarea', section: 'Inventario', default_value: '' },
    { id: 'inventory', label: 'Inventario geral', type: 'textarea', section: 'Inventario', default_value: '' },
    { id: 'treasure', label: 'Tesouros', type: 'textarea', section: 'Inventario', default_value: '' },
    { id: 'spellcasting_ability', label: 'Atributo de conjuracao', type: 'text', section: 'Magias', default_value: '' },
    { id: 'spell_attack_bonus', label: 'Bonus de ataque magico', type: 'number', section: 'Magias', default_value: 0, roll_formula: '1d20 + @spell_attack_bonus' },
    { id: 'spell_save_dc', label: 'CD de magia', type: 'number', section: 'Magias', default_value: 10 },
    { id: 'spell_slots', label: 'Espacos de magia', type: 'textarea', section: 'Magias', default_value: '' },
    { id: 'cantrips', label: 'Truques', type: 'textarea', section: 'Magias', default_value: '' },
    { id: 'spells', label: 'Magias conhecidas/preparadas', type: 'textarea', section: 'Magias', default_value: '' },
    { id: 'senses', label: 'Sentidos', type: 'text', section: 'Tracos', default_value: '' },
    { id: 'languages', label: 'Idiomas', type: 'text', section: 'Tracos', default_value: '' },
    { id: 'immunities', label: 'Imunidades', type: 'text', section: 'Tracos', default_value: '' },
    { id: 'vulnerabilities', label: 'Vulnerabilidades', type: 'text', section: 'Tracos', default_value: '' },
    { id: 'resistances', label: 'Resistencias', type: 'text', section: 'Tracos', default_value: '' },
    { id: 'conditions', label: 'Condicoes', type: 'text', section: 'Tracos', default_value: '' },
    { id: 'features', label: 'Caracteristicas e talentos', type: 'textarea', section: 'Tracos', default_value: '' },
    { id: 'personality', label: 'Personalidade', type: 'textarea', section: 'Notas', default_value: '' },
    { id: 'ideals', label: 'Ideais', type: 'textarea', section: 'Notas', default_value: '' },
    { id: 'bonds', label: 'Vinculos', type: 'textarea', section: 'Notas', default_value: '' },
    { id: 'flaws', label: 'Defeitos', type: 'textarea', section: 'Notas', default_value: '' },
    { id: 'appearance', label: 'Aparencia', type: 'textarea', section: 'Notas', default_value: '' },
    { id: 'backstory', label: 'Historia', type: 'textarea', section: 'Notas', default_value: '' },
    { id: 'notes', label: 'Notas', type: 'textarea', section: 'Notas', default_value: '' },
  ]
}

function normalizeActorType(actorType, index = 0) {
  const label = String(actorType?.label || actorType?.name || 'Personagem').trim() || 'Personagem'
  const id = fieldId(actorType?.id || label, index === 0 ? 'personagem' : `ator_${index + 1}`)
  const fields = Array.isArray(actorType?.fields)
    ? actorType.fields.map(normalizeSystemField)
    : []

  return {
    id,
    label,
    fields: fields.length > 0 ? fields : defaultActorFields(),
  }
}

function normalizeActorTypes(actorTypes) {
  const normalized = Array.isArray(actorTypes)
    ? actorTypes.map(normalizeActorType).filter(actorType => actorType.id)
    : []

  return normalized.length > 0 ? normalized : [normalizeActorType({ id: 'personagem', label: 'Personagem' })]
}

function normalizeSystem(system) {
  const timestamp = now()
  const normalized = {
    id: String(system?.id || newId('system')),
    name: String(system?.name || '').trim(),
    ruleset: String(system?.ruleset || ''),
    version: String(system?.version || '0.1'),
    description: String(system?.description || ''),
    actor_types: normalizeActorTypes(system?.actor_types || system?.actorTypes),
    item_types: Array.isArray(system?.item_types) ? system.item_types : [],
    primary_token_attribute: String(system?.primary_token_attribute || 'hp'),
    grid: {
      distance: asNumber(system?.grid?.distance, 5),
      units: String(system?.grid?.units || 'ft'),
    },
    package_path: String(system?.package_path || system?.packagePath || ''),
    manifest_path: String(system?.manifest_path || system?.manifestPath || ''),
    created_at: String(system?.created_at || timestamp),
    updated_at: String(system?.updated_at || timestamp),
  }

  validateSystemManifest(normalized)
  return normalized
}

function duplicateValues(values) {
  const seen = new Set()
  const duplicated = new Set()

  for (const value of values) {
    if (seen.has(value)) duplicated.add(value)
    seen.add(value)
  }

  return Array.from(duplicated)
}

function validateSystemManifest(system) {
  const errors = []

  if (!system.name) errors.push('Nome do sistema e obrigatorio.')
  if (!Array.isArray(system.actor_types) || system.actor_types.length === 0) {
    errors.push('O sistema precisa ter pelo menos um tipo de ator.')
  }

  const duplicatedActorTypes = duplicateValues((system.actor_types || []).map(actorType => actorType.id))
  for (const actorTypeId of duplicatedActorTypes) {
    errors.push(`Tipo de ator duplicado: "${actorTypeId}".`)
  }

  for (const actorType of system.actor_types || []) {
    if (!actorType.id || !SYSTEM_ID_PATTERN.test(actorType.id)) {
      errors.push(`ID invalido no tipo de ator "${actorType.label || actorType.id}". Use apenas letras, numeros e underscore.`)
    }

    if (!actorType.label) {
      errors.push(`Tipo de ator "${actorType.id}" precisa ter um rotulo.`)
    }

    if (!Array.isArray(actorType.fields) || actorType.fields.length === 0) {
      errors.push(`Tipo de ator "${actorType.label || actorType.id}" precisa ter pelo menos um campo.`)
      continue
    }

    const duplicatedFields = duplicateValues(actorType.fields.map(field => field.id))
    for (const fieldId of duplicatedFields) {
      errors.push(`Campo duplicado em "${actorType.label}": "${fieldId}".`)
    }

    for (const field of actorType.fields) {
      if (!field.id || !SYSTEM_ID_PATTERN.test(field.id)) {
        errors.push(`ID invalido no campo "${field.label || field.id}" de "${actorType.label}".`)
      }

      if (!field.label) {
        errors.push(`Campo "${field.id}" de "${actorType.label}" precisa ter um rotulo.`)
      }

      if (!SYSTEM_FIELD_TYPES.has(field.type)) {
        errors.push(`Campo "${field.label || field.id}" usa tipo invalido: "${field.type}".`)
      }
    }
  }

  if (!Number.isFinite(Number(system.grid?.distance)) || Number(system.grid.distance) <= 0) {
    errors.push('Distancia do grid precisa ser maior que zero.')
  }

  if (!String(system.grid?.units || '').trim()) {
    errors.push('Unidade do grid e obrigatoria.')
  }

  if (errors.length > 0) {
    throw new Error(`Manifesto do sistema invalido:\n- ${errors.join('\n- ')}`)
  }
}

function buildActorData(actorType, payloadData = {}) {
  const data = {}
  for (const field of actorType.fields) {
    data[field.id] = normalizeDefaultValue(field.type, payloadData[field.id] ?? field.default_value)
  }
  return data
}

function actorDataFromPayload(payload = {}, base = {}) {
  const data = { ...base, ...(payload.data || {}) }
  const mappings = [
    ['level', 'level'],
    ['hp', 'hp'],
    ['max_hp', 'max_hp'],
    ['maxHp', 'max_hp'],
    ['ac', 'ac'],
    ['ancestry', 'ancestry'],
    ['class_name', 'class_name'],
    ['className', 'class_name'],
    ['notes', 'notes'],
  ]

  for (const [source, target] of mappings) {
    if (Object.prototype.hasOwnProperty.call(payload, source) && payload[source] !== undefined) {
      data[target] = payload[source]
    }
  }

  return data
}

function legacyActorData(actor) {
  return {
    level: actor?.level ?? 1,
    hp: actor?.hp ?? 10,
    max_hp: actor?.max_hp ?? 10,
    ac: actor?.ac ?? 10,
    ancestry: actor?.ancestry ?? '',
    class_name: actor?.class_name ?? '',
    notes: actor?.notes ?? '',
    ...(actor?.data || {}),
  }
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
  const systemsDir = path.join(root, 'systems')

  async function ensureRoot() {
    await fs.mkdir(worldsDir, { recursive: true })
    await fs.mkdir(systemsDir, { recursive: true })
    const index = await readJSON(indexPath, null)
    if (!index) {
      await writeJSON(indexPath, { worlds: [], systems: [] })
      return
    }

    let shouldRewrite = !Array.isArray(index.worlds) || !Array.isArray(index.systems)
    const nextIndex = {
      ...index,
      worlds: Array.isArray(index.worlds) ? index.worlds : [],
      systems: Array.isArray(index.systems) ? index.systems : [],
    }

    const nextSystems = []
    for (const system of nextIndex.systems) {
      if (!system?.id) {
        shouldRewrite = true
        continue
      }

      const hasInlineManifest = Array.isArray(system.actor_types) || Array.isArray(system.actorTypes)
      const manifestExists = await systemPackageExists(system.id)
      if (hasInlineManifest || !manifestExists) {
        const migratedSystem = await writeSystemPackage(system)
        nextSystems.push(summarizeSystem(migratedSystem))
        shouldRewrite = true
        continue
      }

      nextSystems.push(summarizeSystem(system))
    }

    if (shouldRewrite) {
      await writeJSON(indexPath, {
        ...nextIndex,
        systems: nextSystems,
      })
    }
  }

  function worldDir(worldId) {
    return safeJoin(worldsDir, worldId)
  }

  function systemDir(systemId) {
    return safeJoin(systemsDir, systemId)
  }

  function systemFile(systemId) {
    return path.join(systemDir(systemId), 'system.json')
  }

  function worldFile(worldId) {
    return path.join(worldDir(worldId), 'world.json')
  }

  function systemWithPaths(system) {
    return {
      ...system,
      package_path: `systems/${system.id}`,
      manifest_path: `systems/${system.id}/system.json`,
    }
  }

  function summarizeSystem(system) {
    return systemWithPaths({
      id: system.id,
      name: system.name,
      ruleset: system.ruleset || '',
      version: system.version || '0.1',
      description: system.description || '',
      created_at: system.created_at || now(),
      updated_at: system.updated_at || now(),
    })
  }

  async function systemPackageExists(systemId) {
    try {
      await fs.access(systemFile(systemId))
      return true
    } catch (error) {
      if (error.code === 'ENOENT') return false
      throw error
    }
  }

  async function readSystemPackage(system) {
    const manifest = await readJSON(systemFile(system.id), null)
    if (!manifest) {
      if (Array.isArray(system.actor_types) || Array.isArray(system.actorTypes)) {
        return writeSystemPackage(system)
      }
      throw new Error(`Manifesto do sistema "${system.name || system.id}" nao encontrado.`)
    }

    return systemWithPaths(normalizeSystem({
      ...manifest,
      id: system.id,
      created_at: manifest.created_at || system.created_at,
      updated_at: manifest.updated_at || system.updated_at,
    }))
  }

  async function writeSystemPackage(system) {
    const normalized = normalizeSystem(system)
    const withPaths = systemWithPaths(normalized)
    await writeJSON(systemFile(withPaths.id), withPaths)
    return withPaths
  }

  async function readIndex() {
    await ensureRoot()
    const index = await readJSON(indexPath, { worlds: [], systems: [] })
    const systems = []
    for (const system of Array.isArray(index.systems) ? index.systems : []) {
      systems.push(await readSystemPackage(system))
    }

    return {
      worlds: Array.isArray(index.worlds) ? index.worlds : [],
      systems,
    }
  }

  async function writeIndex(index) {
    await writeJSON(indexPath, {
      ...index,
      worlds: Array.isArray(index.worlds) ? index.worlds : [],
      systems: Array.isArray(index.systems) ? index.systems.map(summarizeSystem) : [],
    })
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
    const index = await readIndex()
    const linkedSystem = index.systems.find(system => system.id === data.world?.system_id)
    if (linkedSystem) {
      data.system = linkedSystem
    } else if (data.system) {
      data.system = normalizeSystem(data.system)
    }
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
    const worldSystem = data.system || null
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
      system: worldSystem,
      scenes: data.scenes,
      scene_folders: data.scene_folders,
      assets: data.assets,
      actors: data.actors.map(actor => ({
        ...actor,
        companion_permissions: normalizeActorCompanionPermissions(actor.companion_permissions),
      })),
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
    const system = await writeSystemPackage({
      id: newId('system'),
      name: String(payload?.name || '').trim(),
      ruleset: String(payload?.ruleset || ''),
      version: String(payload?.version || '0.1'),
      description: String(payload?.description || ''),
      actor_types: payload?.actor_types || payload?.actorTypes,
      item_types: payload?.item_types || payload?.itemTypes,
      primary_token_attribute: payload?.primary_token_attribute || payload?.primaryTokenAttribute,
      grid: payload?.grid,
      created_at: timestamp,
      updated_at: timestamp,
    })

    index.systems = index.systems.filter(item => item.id !== system.id)
    index.systems.push(system)
    await writeIndex(index)
    return system
  }

  async function patchSystem(systemId, patch) {
    const index = await readIndex()
    const current = index.systems.find(system => system.id === systemId)
    if (!current) throw new Error('Sistema nao encontrado.')

    const nextSystem = await writeSystemPackage({
      ...current,
      ...patch,
      id: current.id,
      name: Object.prototype.hasOwnProperty.call(patch || {}, 'name') ? String(patch.name || '').trim() : current.name,
      actor_types: patch?.actor_types || patch?.actorTypes || current.actor_types,
      item_types: patch?.item_types || patch?.itemTypes || current.item_types,
      primary_token_attribute: patch?.primary_token_attribute || patch?.primaryTokenAttribute || current.primary_token_attribute,
      grid: patch?.grid || current.grid,
      updated_at: now(),
    })

    index.systems = index.systems.map(system => (system.id === systemId ? nextSystem : system))
    await writeIndex(index)

    for (const world of index.worlds) {
      if (world.system_id !== systemId) continue
      const data = await readWorld(world.id)
      data.world.system = nextSystem.name
      data.system = nextSystem
      await writeWorld(data)
    }

    return nextSystem
  }

  async function deleteSystem(systemId) {
    const index = await readIndex()
    const usedByWorld = index.worlds.find(world => world.system_id === systemId)
    if (usedByWorld) {
      throw new Error(`Sistema em uso pelo mundo "${usedByWorld.name}". Troque o sistema do mundo antes de apagar.`)
    }

    const nextSystems = index.systems.filter(system => system.id !== systemId)
    if (nextSystems.length === index.systems.length) {
      throw new Error('Sistema nao encontrado.')
    }
    index.systems = nextSystems
    await writeIndex(index)
    await fs.rm(systemDir(systemId), { recursive: true, force: true })
    return { deleted_id: systemId }
  }

  async function getSystemPackagePath(systemId) {
    const index = await readIndex()
    const system = index.systems.find(item => item.id === systemId)
    if (!system) throw new Error('Sistema nao encontrado.')
    return systemDir(systemId)
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
      system: selectedSystem,
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
      data.system = selectedSystem
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

  async function createActor(worldId, payload) {
    const data = await readWorld(worldId)
    const timestamp = now()
    const system = normalizeSystem(data.system || { name: data.world?.system || 'Sistema local' })
    const actorType = system.actor_types.find(type => type.id === payload?.type) ?? system.actor_types[0]
    const actorData = buildActorData(actorType, actorDataFromPayload(payload))

    const actor = {
      id: newId('actor'),
      world_id: worldId,
      system_id: system.id,
      name: String(payload?.name || 'Nova ficha').trim() || 'Nova ficha',
      type: actorType.id,
      data: actorData,
      level: asNumber(actorData.level, 1),
      ancestry: String(actorData.ancestry || ''),
      class_name: String(actorData.class_name || ''),
      hp: asNumber(actorData.hp, 10),
      max_hp: asNumber(actorData.max_hp, 10),
      ac: asNumber(actorData.ac, 10),
      notes: String(actorData.notes || ''),
      portrait_asset_id: String(payload?.portrait_asset_id || payload?.portraitAssetId || ''),
      companion_permissions: normalizeActorCompanionPermissions(payload?.companion_permissions || payload?.companionPermissions),
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
    const system = normalizeSystem(data.system || { name: data.world?.system || 'Sistema local' })
    data.actors = data.actors.map(actor => {
      if (actor.id !== actorId) return actor
      const actorType = system.actor_types.find(type => type.id === (patch?.type ?? actor.type)) ?? system.actor_types[0]
      const nextData = buildActorData(actorType, actorDataFromPayload(patch, legacyActorData(actor)))

      return {
        ...actor,
        name: patch?.name ?? actor.name,
        system_id: system.id,
        type: actorType.id,
        data: nextData,
        level: asNumber(nextData.level, actor.level ?? 1),
        ancestry: String(nextData.ancestry || ''),
        class_name: String(nextData.class_name || ''),
        hp: asNumber(nextData.hp, actor.hp ?? 10),
        max_hp: asNumber(nextData.max_hp, actor.max_hp ?? 10),
        ac: asNumber(nextData.ac, actor.ac ?? 10),
        notes: String(nextData.notes || ''),
        portrait_asset_id: patch?.portrait_asset_id ?? actor.portrait_asset_id ?? '',
        companion_permissions: Array.isArray(patch?.companion_permissions)
          ? normalizeActorCompanionPermissions(patch.companion_permissions)
          : normalizeActorCompanionPermissions(actor.companion_permissions),
        updated_at: timestamp,
      }
    })
    await writeWorld(data)
    return data.actors.find(actor => actor.id === actorId)
  }

  async function saveActorCompanionPermission(actorId, payload) {
    const data = await findWorldByEntity(world => world.actors?.some(actor => actor.id === actorId))
    const timestamp = now()
    const playerName = String(payload?.player_name || payload?.playerName || '').trim()
    if (!playerName) throw new Error('Nome do jogador e obrigatorio para salvar permissao mobile.')

    let updatedActor = null
    data.actors = data.actors.map(actor => {
      if (actor.id !== actorId) return actor

      const savedPermissions = normalizeActorCompanionPermissions(actor.companion_permissions)
      const existingIndex = savedPermissions.findIndex(entry => entry.player_name.toLowerCase() === playerName.toLowerCase())
      const grant = {
        id: existingIndex >= 0 ? savedPermissions[existingIndex].id : newId('companion_permission'),
        player_name: playerName,
        permissions: normalizeCompanionPermissions(payload?.permissions),
        updated_at: timestamp,
      }
      const nextPermissions = existingIndex >= 0
        ? savedPermissions.map((entry, index) => (index === existingIndex ? grant : entry))
        : [...savedPermissions, grant]

      updatedActor = {
        ...actor,
        companion_permissions: nextPermissions,
        updated_at: timestamp,
      }
      return updatedActor
    })

    await writeWorld(data)
    return updatedActor
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
    patchSystem,
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
    saveActorCompanionPermission,
    deleteActor,
    uploadAsset,
    deleteAsset,
    getSystemPackagePath,
    resolveAssetPath,
  }
}

module.exports = {
  createLocalStore,
}
