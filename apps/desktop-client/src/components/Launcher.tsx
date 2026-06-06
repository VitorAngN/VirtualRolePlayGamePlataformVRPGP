import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import {
  createSystem,
  createWorld,
  deleteSystem,
  deleteWorld,
  getSystems,
  getWorlds,
  openSystemFolder,
  patchSystem,
  patchWorld,
  type ApiGameSystem,
  type ApiSystemActorType,
  type ApiSystemField,
  type ApiWorld,
  type SystemFieldType,
} from '../services/vttApi'
import styles from './Launcher.module.css'

interface LauncherProps {
  onEnterWorld: (worldId: string) => void
}

interface SystemTemplate {
  id: string
  label: string
  description: string
  ruleset: string
  actorTypeLabel: string
  gridDistance: string
  gridUnits: string
  fields: ApiSystemField[]
}

const NEWS_ITEMS = [
  {
    label: 'Workspace 0.1',
    title: 'Aplicativo local em construcao',
    body: 'Launcher, sistemas e saves em disco ja estao rodando como programa desktop.',
  },
  {
    label: 'Roadmap',
    title: 'Base da mesa',
    body: 'As proximas entregas focam em cenas, assets, grid, tokens e configuracoes de mapa.',
  },
]

const JOIN_THEMES = [
  { id: 'default', label: 'Padrao' },
  { id: 'dark', label: 'Escuro' },
  { id: 'classic', label: 'Classico' },
]

const FIELD_TYPES: SystemFieldType[] = ['text', 'number', 'textarea', 'checkbox']
const SYSTEM_SECTION_PRESETS = [
  'Identidade',
  'Combate',
  'Atributos',
  'Salvaguardas',
  'Pericias',
  'Acoes',
  'Inventario',
  'Magias',
  'Tracos',
  'Notas',
]

const DEFAULT_ACTOR_FIELDS: ApiSystemField[] = [
  { id: 'level', label: 'Nivel', type: 'number', section: 'Identidade', default_value: 1 },
  { id: 'class_name', label: 'Classe', type: 'text', section: 'Identidade', default_value: '' },
  { id: 'ancestry', label: 'Ancestralidade', type: 'text', section: 'Identidade', default_value: '' },
  { id: 'background', label: 'Antecedente', type: 'text', section: 'Identidade', default_value: '' },
  { id: 'proficiency_bonus', label: 'Bonus de proficiencia', type: 'number', section: 'Identidade', default_value: 2 },
  { id: 'hp', label: 'PV atual', type: 'number', section: 'Combate', default_value: 10 },
  { id: 'max_hp', label: 'PV maximo', type: 'number', section: 'Combate', default_value: 10 },
  { id: 'temp_hp', label: 'PV temporario', type: 'number', section: 'Combate', default_value: 0 },
  { id: 'ac', label: 'CA', type: 'number', section: 'Combate', default_value: 10 },
  { id: 'speed', label: 'Deslocamento', type: 'number', section: 'Combate', default_value: 9 },
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
  { id: 'currency', label: 'Moedas/recursos', type: 'text', section: 'Inventario', default_value: '' },
  { id: 'equipment', label: 'Equipamentos', type: 'textarea', section: 'Inventario', default_value: '' },
  { id: 'inventory', label: 'Inventario geral', type: 'textarea', section: 'Inventario', default_value: '' },
  { id: 'spellcasting_ability', label: 'Atributo de conjuracao', type: 'text', section: 'Magias', default_value: '' },
  { id: 'spell_attack_bonus', label: 'Bonus de ataque magico', type: 'number', section: 'Magias', default_value: 0, roll_formula: '1d20 + @spell_attack_bonus' },
  { id: 'spell_save_dc', label: 'CD de magia', type: 'number', section: 'Magias', default_value: 10 },
  { id: 'spells', label: 'Magias conhecidas/preparadas', type: 'textarea', section: 'Magias', default_value: '' },
  { id: 'senses', label: 'Sentidos', type: 'text', section: 'Tracos', default_value: '' },
  { id: 'languages', label: 'Idiomas', type: 'text', section: 'Tracos', default_value: '' },
  { id: 'resistances', label: 'Resistencias', type: 'text', section: 'Tracos', default_value: '' },
  { id: 'features', label: 'Caracteristicas e talentos', type: 'textarea', section: 'Tracos', default_value: '' },
  { id: 'personality', label: 'Personalidade', type: 'textarea', section: 'Notas', default_value: '' },
  { id: 'appearance', label: 'Aparencia', type: 'textarea', section: 'Notas', default_value: '' },
  { id: 'notes', label: 'Notas', type: 'textarea', section: 'Notas', default_value: '' },
]

const SIMPLE_ACTOR_FIELDS: ApiSystemField[] = [
  { id: 'hp', label: 'PV atual', type: 'number', section: 'Combate', default_value: 10 },
  { id: 'max_hp', label: 'PV maximo', type: 'number', section: 'Combate', default_value: 10 },
  { id: 'ac', label: 'Defesa/CA', type: 'number', section: 'Combate', default_value: 10 },
  { id: 'notes', label: 'Notas', type: 'textarea', section: 'Notas', default_value: '' },
]

const SYSTEM_TEMPLATES: SystemTemplate[] = [
  {
    id: 'dnd5e-lite',
    label: 'D&D 5e Lite',
    description: 'Atributos, PV, CA, salvaguardas e pericias para um sistema d20.',
    ruleset: 'd20',
    actorTypeLabel: 'Personagem',
    gridDistance: '5',
    gridUnits: 'ft',
    fields: DEFAULT_ACTOR_FIELDS,
  },
  {
    id: 'simple-rpg',
    label: 'RPG simples',
    description: 'Ficha curta com PV, defesa e notas. Boa para comecar do zero.',
    ruleset: 'custom',
    actorTypeLabel: 'Personagem',
    gridDistance: '1',
    gridUnits: 'quadrado',
    fields: SIMPLE_ACTOR_FIELDS,
  },
  {
    id: 'blank',
    label: 'Em branco',
    description: 'Comeca quase vazio para montar um sistema totalmente proprio.',
    ruleset: 'custom',
    actorTypeLabel: 'Personagem',
    gridDistance: '1',
    gridUnits: 'unidade',
    fields: [{ id: 'notes', label: 'Notas', type: 'textarea', section: 'Notas', default_value: '' }],
  },
]

function fieldId(value: string, fallback = 'campo') {
  return (value || fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 36) || fallback
}

function parseDefaultValue(type: SystemFieldType, value: unknown) {
  if (type === 'number') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (type === 'checkbox') {
    if (typeof value === 'boolean') return value
    return ['1', 'true', 'sim', 'yes', 'on'].includes(String(value ?? '').trim().toLowerCase())
  }

  return String(value ?? '')
}

function cloneActorFields(fields: ApiSystemField[] = []) {
  return fields.map(field => ({ ...field }))
}

function sectionNames(fields: ApiSystemField[]) {
  return Array.from(new Set(fields.map(field => String(field.section || 'Basico').trim() || 'Basico')))
}

function normalizeActorFields(fields: ApiSystemField[]) {
  return fields
    .map((field, index) => {
      const type = FIELD_TYPES.includes(field.type) ? field.type : 'text'
      const label = String(field.label || field.id || `Campo ${index + 1}`).trim() || `Campo ${index + 1}`

      return {
        id: fieldId(field.id || label, `campo_${index + 1}`),
        label,
        type,
        section: String(field.section || 'Basico').trim() || 'Basico',
        default_value: parseDefaultValue(type, field.default_value),
        roll_formula: String(field.roll_formula || '').trim(),
      }
    })
}

function makeActorType(label: string, fields: ApiSystemField[]): ApiSystemActorType {
  const safeLabel = label.trim() || 'Personagem'

  return {
    id: fieldId(safeLabel, 'personagem'),
    label: safeLabel,
    fields: normalizeActorFields(fields),
  }
}

function newSystemField(index: number): ApiSystemField {
  return {
    id: `campo_${index + 1}`,
    label: `Campo ${index + 1}`,
    type: 'text',
    section: 'Basico',
    default_value: '',
    roll_formula: '',
  }
}

function duplicatedValues(values: string[]) {
  const seen = new Set<string>()
  const duplicated = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) duplicated.add(value)
    seen.add(value)
  }

  return Array.from(duplicated)
}

function validateSystemDraft(systemName: string, actorType: ApiSystemActorType, gridDistance: string, gridUnits: string) {
  const errors: string[] = []

  if (!systemName.trim()) errors.push('Nome do sistema e obrigatorio.')
  if (!actorType.label.trim()) errors.push('Tipo inicial de ator precisa ter nome.')
  if (actorType.fields.length === 0) errors.push('Adicione pelo menos um campo na ficha.')

  const duplicatedFieldIds = duplicatedValues(actorType.fields.map(field => field.id))
  if (duplicatedFieldIds.length > 0) {
    errors.push(`IDs de campo duplicados: ${duplicatedFieldIds.join(', ')}.`)
  }

  actorType.fields.forEach((field, index) => {
    if (!field.id.trim()) errors.push(`Campo ${index + 1} precisa ter ID.`)
    if (!field.label.trim()) errors.push(`Campo ${field.id || index + 1} precisa ter rotulo.`)
    if (!FIELD_TYPES.includes(field.type)) errors.push(`Campo ${field.label || field.id} usa tipo invalido.`)
  })

  const distance = Number(gridDistance)
  if (!Number.isFinite(distance) || distance <= 0) errors.push('Distancia do grid precisa ser maior que zero.')
  if (!gridUnits.trim()) errors.push('Unidade do grid e obrigatoria.')

  return errors
}

function formatLocalCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural} ${count === 1 ? 'local' : 'locais'}`
}

function formatDateTime(value?: string) {
  if (!value) return 'Nao agendada'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function toDateTimeInputValue(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function fromDateTimeInputValue(value: string) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

function backgroundStyle(world?: ApiWorld) {
  const image = world?.background_image?.trim()
  if (!image) return undefined
  return { backgroundImage: `url("${image.replace(/"/g, '\\"')}")` }
}

export default function Launcher({ onEnterWorld }: LauncherProps) {
  const [worlds, setWorlds] = useState<ApiWorld[]>([])
  const [systems, setSystems] = useState<ApiGameSystem[]>([])
  const [activeTab, setActiveTab] = useState<'worlds' | 'systems'>('worlds')
  const [status, setStatus] = useState<'loading' | 'ready' | 'offline'>('loading')
  const [creatingWorld, setCreatingWorld] = useState(false)
  const [creatingSystem, setCreatingSystem] = useState(false)
  const [savingWorld, setSavingWorld] = useState(false)
  const [savingSystem, setSavingSystem] = useState(false)
  const [modal, setModal] = useState<'world' | 'system' | 'editWorld' | 'editSystem' | null>(null)
  const [selectedWorld, setSelectedWorld] = useState<ApiWorld | null>(null)
  const [selectedSystem, setSelectedSystem] = useState<ApiGameSystem | null>(null)
  const [contextMenu, setContextMenu] = useState<{ world: ApiWorld; x: number; y: number } | null>(null)
  const [formError, setFormError] = useState('')
  const [worldForm, setWorldForm] = useState({
    name: '',
    description: '',
    systemId: '',
    dataPath: '',
    backgroundImage: '',
    joinTheme: 'default',
    nextSession: '',
    safeConfiguration: false,
  })
  const [systemForm, setSystemForm] = useState({
    name: '',
    ruleset: '',
    version: '',
    description: '',
    templateId: 'dnd5e-lite',
    actorTypeLabel: 'Personagem',
    actorFields: cloneActorFields(DEFAULT_ACTOR_FIELDS),
    gridDistance: '5',
    gridUnits: 'ft',
  })

  useEffect(() => {
    function closeContextMenu() {
      setContextMenu(null)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setContextMenu(null)
        setSelectedWorld(null)
        setSelectedSystem(null)
        setModal(null)
      }
    }

    window.addEventListener('click', closeContextMenu)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('click', closeContextMenu)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    Promise.all([getWorlds(), getSystems()])
      .then(([nextWorlds, nextSystems]) => {
        if (cancelled) return
        setWorlds(nextWorlds)
        setSystems(nextSystems)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('offline')
      })

    return () => {
      cancelled = true
    }
  }, [])

  function openWorldModal() {
    if (systems.length === 0) {
      setActiveTab('systems')
      return
    }

    setWorldForm({
      name: '',
      description: '',
      systemId: systems[0].id,
      dataPath: '',
      backgroundImage: '',
      joinTheme: 'default',
      nextSession: '',
      safeConfiguration: false,
    })
    setFormError('')
    setModal('world')
  }

  function openEditWorldModal(world: ApiWorld) {
    setWorldForm({
      name: world.name,
      description: world.description || '',
      systemId: world.system_id || systems[0]?.id || '',
      dataPath: world.data_path || '',
      backgroundImage: world.background_image || '',
      joinTheme: world.join_theme || 'default',
      nextSession: toDateTimeInputValue(world.next_session),
      safeConfiguration: Boolean(world.safe_configuration),
    })
    setContextMenu(null)
    setFormError('')
    setSelectedWorld(world)
    setModal('editWorld')
  }

  function openSystemModal() {
    setSystemForm({
      name: '',
      ruleset: '',
      version: '0.1',
      description: '',
      templateId: 'dnd5e-lite',
      actorTypeLabel: 'Personagem',
      actorFields: cloneActorFields(DEFAULT_ACTOR_FIELDS),
      gridDistance: '5',
      gridUnits: 'ft',
    })
    setSelectedSystem(null)
    setFormError('')
    setModal('system')
  }

  function openEditSystemModal(system: ApiGameSystem) {
    const actorType = system.actor_types?.[0]
    setSystemForm({
      name: system.name,
      ruleset: system.ruleset || '',
      version: system.version || '0.1',
      description: system.description || '',
      templateId: 'custom',
      actorTypeLabel: actorType?.label || 'Personagem',
      actorFields: cloneActorFields(actorType?.fields?.length ? actorType.fields : DEFAULT_ACTOR_FIELDS),
      gridDistance: String(system.grid?.distance ?? 5),
      gridUnits: system.grid?.units || 'ft',
    })
    setSelectedSystem(system)
    setFormError('')
    setModal('editSystem')
  }

  function applySystemTemplate(templateId: string) {
    const template = SYSTEM_TEMPLATES.find(item => item.id === templateId)
    if (!template) return

    setSystemForm(prev => ({
      ...prev,
      templateId: template.id,
      ruleset: template.ruleset,
      actorTypeLabel: template.actorTypeLabel,
      actorFields: cloneActorFields(template.fields),
      gridDistance: template.gridDistance,
      gridUnits: template.gridUnits,
    }))
  }

  function updateSystemField(index: number, patch: Partial<ApiSystemField>) {
    setSystemForm(prev => ({
      ...prev,
      templateId: 'custom',
      actorFields: prev.actorFields.map((field, fieldIndex) => (
        fieldIndex === index
          ? {
              ...field,
              ...patch,
              default_value: patch.type && patch.type !== field.type
                ? parseDefaultValue(patch.type, field.default_value)
                : patch.default_value ?? field.default_value,
            }
          : field
      )),
    }))
  }

  function addSystemField() {
    setSystemForm(prev => ({
      ...prev,
      templateId: 'custom',
      actorFields: [...prev.actorFields, newSystemField(prev.actorFields.length)],
    }))
  }

  function removeSystemField(index: number) {
    setSystemForm(prev => ({
      ...prev,
      templateId: 'custom',
      actorFields: prev.actorFields.filter((_, fieldIndex) => fieldIndex !== index),
    }))
  }

  async function handleCreateWorld(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!worldForm.name.trim()) return
    const selectedSystem = systems.find(system => system.id === worldForm.systemId)
    if (!selectedSystem) {
      setFormError('Cadastre e selecione um sistema antes de criar um mundo.')
      return
    }

    setCreatingWorld(true)
    setFormError('')
    try {
      const world = await createWorld({
        name: worldForm.name.trim(),
        description: worldForm.description.trim(),
        system: selectedSystem.name,
        system_id: selectedSystem.id,
        data_path: worldForm.dataPath.trim(),
        background_image: worldForm.backgroundImage.trim(),
        join_theme: worldForm.joinTheme,
        next_session: fromDateTimeInputValue(worldForm.nextSession),
        safe_configuration: worldForm.safeConfiguration,
      })
      setWorlds(prev => [...prev, world])
      setModal(null)
      setSelectedWorld(world)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nao consegui criar o mundo.')
    } finally {
      setCreatingWorld(false)
    }
  }

  async function handleCreateSystem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!systemForm.name.trim()) return
    const actorType = makeActorType(systemForm.actorTypeLabel, systemForm.actorFields)

    const validationErrors = validateSystemDraft(systemForm.name, actorType, systemForm.gridDistance, systemForm.gridUnits)
    if (validationErrors.length > 0) {
      setFormError(validationErrors.map(error => `- ${error}`).join('\n'))
      return
    }

    setCreatingSystem(true)
    setFormError('')
    try {
      const system = await createSystem({
        name: systemForm.name.trim(),
        ruleset: systemForm.ruleset.trim(),
        version: systemForm.version.trim(),
        description: systemForm.description.trim(),
        actor_types: [actorType],
        grid: {
          distance: Number(systemForm.gridDistance) || 5,
          units: systemForm.gridUnits.trim() || 'ft',
        },
      })
      setSystems(prev => [...prev, system])
      setActiveTab('systems')
      setModal(null)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nao consegui criar o sistema.')
    } finally {
      setCreatingSystem(false)
    }
  }

  async function handleEditSystem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedSystem || !systemForm.name.trim()) return
    const actorType = makeActorType(systemForm.actorTypeLabel, systemForm.actorFields)

    const validationErrors = validateSystemDraft(systemForm.name, actorType, systemForm.gridDistance, systemForm.gridUnits)
    if (validationErrors.length > 0) {
      setFormError(validationErrors.map(error => `- ${error}`).join('\n'))
      return
    }

    setSavingSystem(true)
    setFormError('')
    try {
      const updatedSystem = await patchSystem(selectedSystem.id, {
        name: systemForm.name.trim(),
        ruleset: systemForm.ruleset.trim(),
        version: systemForm.version.trim(),
        description: systemForm.description.trim(),
        actor_types: [actorType],
        grid: {
          distance: Number(systemForm.gridDistance) || 5,
          units: systemForm.gridUnits.trim() || 'ft',
        },
      })
      setSystems(prev => prev.map(system => (system.id === updatedSystem.id ? updatedSystem : system)))
      setWorlds(prev => prev.map(world => (
        world.system_id === updatedSystem.id
          ? { ...world, system: updatedSystem.name }
          : world
      )))
      setSelectedSystem(null)
      setModal(null)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nao consegui atualizar o sistema.')
    } finally {
      setSavingSystem(false)
    }
  }

  async function handleEditWorld(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedWorld || !worldForm.name.trim()) return
    const selectedSystem = systems.find(system => system.id === worldForm.systemId)
    if (!selectedSystem) {
      setFormError('Selecione um sistema cadastrado para este mundo.')
      return
    }

    setSavingWorld(true)
    setFormError('')
    try {
      const updatedWorld = await patchWorld(selectedWorld.id, {
        name: worldForm.name.trim(),
        description: worldForm.description.trim(),
        system_id: selectedSystem.id,
        data_path: worldForm.dataPath.trim(),
        background_image: worldForm.backgroundImage.trim(),
        join_theme: worldForm.joinTheme,
        next_session: fromDateTimeInputValue(worldForm.nextSession),
        safe_configuration: worldForm.safeConfiguration,
      })
      setWorlds(prev => prev.map(world => (world.id === updatedWorld.id ? updatedWorld : world)))
      setSelectedWorld(null)
      setModal(null)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nao consegui atualizar o mundo.')
    } finally {
      setSavingWorld(false)
    }
  }

  async function toggleWorldFlag(world: ApiWorld, flag: 'favorite' | 'locked') {
    setContextMenu(null)
    const updatedWorld = await patchWorld(world.id, { [flag]: !world[flag] })
    setWorlds(prev => prev.map(item => (item.id === updatedWorld.id ? updatedWorld : item)))
    setSelectedWorld(prev => (prev?.id === updatedWorld.id ? updatedWorld : prev))
  }

  function openContextMenu(event: MouseEvent<HTMLElement>, world: ApiWorld) {
    event.preventDefault()
    event.stopPropagation()
    setContextMenu({ world, x: event.clientX, y: event.clientY })
  }

  async function handleDeleteWorld(world: ApiWorld) {
    setContextMenu(null)
    const confirmed = window.confirm(`Apagar o mundo "${world.name}" e todos os arquivos dele?`)
    if (!confirmed) return

    await deleteWorld(world.id)
    setWorlds(prev => prev.filter(item => item.id !== world.id))
    setSelectedWorld(prev => (prev?.id === world.id ? null : prev))
  }

  async function handleDeleteSystem(system: ApiGameSystem) {
    const confirmed = window.confirm(`Apagar o sistema "${system.name}"? Isso so funciona se nenhum mundo estiver usando ele.`)
    if (!confirmed) return

    try {
      await deleteSystem(system.id)
      setSystems(prev => prev.filter(item => item.id !== system.id))
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Nao consegui apagar esse sistema.')
    }
  }

  async function handleOpenSystemFolder(system: ApiGameSystem) {
    try {
      await openSystemFolder(system.id)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Nao consegui abrir a pasta desse sistema.')
    }
  }

  const isWorldsTab = activeTab === 'worlds'
  const worldsStatusText =
    status === 'loading'
      ? 'Carregando mundos...'
      : status === 'offline'
        ? 'Nao consegui acessar os saves locais agora.'
        : formatLocalCount(worlds.length, 'mundo', 'mundos')
  const systemsStatusText =
    status === 'loading'
      ? 'Carregando sistemas...'
      : status === 'offline'
        ? 'Nao consegui acessar os sistemas locais agora.'
        : formatLocalCount(systems.length, 'sistema', 'sistemas')
  const systemSectionPreview = sectionNames(systemForm.actorFields)

  if (selectedWorld && modal !== 'editWorld') {
    return (
      <div className={`${styles.detailsRoot} ${styles[`detailsTheme_${selectedWorld.join_theme || 'default'}`] || ''}`}>
        <div className={styles.detailsBg} style={backgroundStyle(selectedWorld)} />
        <div className={styles.detailsFrame} />
        <button className={styles.returnSetupBtn} type="button" onClick={() => setSelectedWorld(null)}>
          Voltar ao setup
        </button>

        <div className={styles.detailsContent}>
          <h1 className={styles.detailsTitle}>{selectedWorld.name}</h1>
          <div className={styles.detailsBody}>
            <div className={styles.detailsLeft}>
              <div className={styles.detailsCard}>
                <div className={styles.sectionDivider}>Entrar na sessao</div>
                <label className={styles.formGroup}>
                  <span className={styles.formIcon}>P</span>
                  <select className={styles.formSelect} defaultValue="gm">
                    <option value="gm">Mestre do Jogo</option>
                    <option value="player">Jogador</option>
                  </select>
                </label>
                <label className={styles.formGroup}>
                  <span className={styles.formIcon}>K</span>
                  <input className={styles.formInput} placeholder="Senha local, se existir" type="password" />
                </label>
                <button className={styles.joinBtn} type="button" onClick={() => onEnterWorld(selectedWorld.id)}>
                  Entrar no mundo
                </button>
              </div>

              <div className={styles.detailsCard}>
                <div className={styles.sectionDivider}>Detalhes</div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Sistema</span>
                  <strong>{selectedWorld.system}</strong>
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Proxima sessao</span>
                  <strong>{formatDateTime(selectedWorld.next_session)}</strong>
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Jogadores locais</span>
                  <strong>0 / 7</strong>
                </div>
              </div>
            </div>

            <div className={`${styles.detailsCard} ${styles.detailsRight}`}>
              <div className={styles.sectionDivider}>Descricao do mundo</div>
              <p className={styles.detailsText}>
                {selectedWorld.description || 'Este mundo ainda nao tem descricao. Edite o mundo no setup para preencher o texto que aparece aqui.'}
              </p>
            </div>
          </div>
          <div className={styles.versionTag}>Workspace 0.1</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.bgTexture} />

      <div className={styles.logo}>
        <span className={styles.logoText}>VTT</span>
        <div className={styles.logoDie}>
          <span className={styles.logoDieNum}>20</span>
        </div>
        <span className={styles.logoText}>LITE</span>
      </div>

      <div className={styles.container}>
        <div className={styles.mainPanel}>
          <div className={styles.tabBar}>
            <button
              className={`${styles.tab} ${isWorldsTab ? styles.tabActive : ''}`}
              type="button"
              onClick={() => setActiveTab('worlds')}
            >
              <span className={styles.tabIcon}>W</span>
              Mundos
            </button>
            <button
              className={`${styles.tab} ${!isWorldsTab ? styles.tabActive : ''}`}
              type="button"
              onClick={() => setActiveTab('systems')}
            >
              <span className={styles.tabIcon}>S</span>
              Sistemas
            </button>
          </div>

          <div className={styles.panelBody}>
            {isWorldsTab ? (
              <>
                <div className={styles.panelToolbar}>
                  <div className={styles.filterInput} aria-live="polite">
                    {worldsStatusText}
                  </div>
                  <button
                    className={styles.secondaryBtn}
                    type="button"
                    onClick={openWorldModal}
                    disabled={creatingWorld || status === 'offline' || systems.length === 0}
                    title={systems.length === 0 ? 'Cadastre um sistema antes de criar um mundo.' : 'Criar mundo'}
                  >
                    {creatingWorld ? 'Criando...' : 'Criar mundo'}
                  </button>
                </div>

                <div className={styles.worldsGrid}>
                  {worlds.map(world => (
                    <article
                      key={world.id}
                      className={`${styles.worldCard} ${world.favorite ? styles.worldCardFavorite : ''} ${world.locked ? styles.worldCardLocked : ''}`}
                      onContextMenu={event => openContextMenu(event, world)}
                    >
                      <button className={styles.worldOpenArea} onClick={() => setSelectedWorld(world)} type="button">
                        {world.background_image && <div className={styles.worldCardImg} style={backgroundStyle(world)} />}
                        <div className={styles.worldCardOverlay} />
                        {world.favorite && <span className={styles.worldFavoriteMark}>*</span>}
                        <h3 className={styles.worldCardTitle}>{world.name}</h3>
                        <div className={styles.worldCardFooter}>
                          <span className={styles.worldCardDate}>{world.next_session ? formatDateTime(world.next_session) : world.system}</span>
                          <div className={styles.worldCardBadges}>
                            <span className={styles.badgeGreen}>local</span>
                            {world.locked && <span className={styles.badgeBlue}>lock</span>}
                          </div>
                        </div>
                      </button>
                      <button
                        className={styles.worldDeleteBtn}
                        type="button"
                        title="Apagar mundo"
                        onClick={() => handleDeleteWorld(world)}
                      >
                        x
                      </button>
                    </article>
                  ))}

                  {status === 'ready' && worlds.length === 0 && (
                    <div className={styles.emptyWorlds}>
                      <strong>Nenhum mundo criado.</strong>
                      <span>
                        {systems.length === 0
                          ? 'Cadastre um sistema antes de criar um mundo.'
                          : 'Crie um mundo para gerar uma pasta de save local.'}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className={styles.panelToolbar}>
                  <div className={styles.filterInput} aria-live="polite">
                    {systemsStatusText}
                  </div>
                  <button className={styles.secondaryBtn} type="button" onClick={openSystemModal} disabled={creatingSystem || status === 'offline'}>
                    {creatingSystem ? 'Criando...' : 'Criar sistema'}
                  </button>
                </div>

                <div className={styles.systemsGrid}>
                  {systems.map(system => (
                    <article key={system.id} className={styles.systemCard}>
                      <div className={styles.systemCardHeader}>
                        <span className={styles.systemEyebrow}>{system.ruleset || 'Sistema custom'}</span>
                        <span className={styles.systemVersion}>{system.version || 'sem versao'}</span>
                      </div>
                      <h3 className={styles.systemTitle}>{system.name}</h3>
                      <p className={styles.systemDescription}>
                        {system.description || 'Sistema local criado para vincular mundos e futuras regras da mesa.'}
                      </p>
                      <div className={styles.systemMeta}>
                        <span>{system.actor_types?.length || 0} tipos de ator</span>
                        <span>{system.actor_types?.reduce((sum, type) => sum + type.fields.length, 0) || 0} campos</span>
                        <span>{system.grid?.distance ?? 5} {system.grid?.units || 'ft'}</span>
                      </div>
                      <code className={styles.systemPath}>{system.manifest_path || 'systems/.../system.json'}</code>
                      <div className={styles.systemActions}>
                        <button
                          className={styles.systemActionBtn}
                          type="button"
                          onClick={() => handleOpenSystemFolder(system)}
                        >
                          Pasta
                        </button>
                        <button
                          className={styles.systemActionBtn}
                          type="button"
                          onClick={() => openEditSystemModal(system)}
                        >
                          Editar
                        </button>
                        <button
                          className={styles.systemDeleteBtn}
                          type="button"
                          onClick={() => handleDeleteSystem(system)}
                        >
                          Apagar
                        </button>
                      </div>
                    </article>
                  ))}

                  {status === 'ready' && systems.length === 0 && (
                    <div className={styles.emptyWorlds}>
                      <strong>Nenhum sistema criado.</strong>
                      <span>Crie um sistema para vincular aos mundos da sua mesa.</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <div className={styles.sectionDivider}>Novidades</div>
            <div className={styles.newsList}>
              {NEWS_ITEMS.map(item => (
                <article className={styles.newsItem} key={item.title}>
                  <span className={styles.newsLabel}>{item.label}</span>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
          <div className={styles.versionTag}>Workspace 0.1</div>
        </div>
      </div>

      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={event => event.stopPropagation()}
        >
          <button type="button" onClick={() => { setSelectedWorld(contextMenu.world); setContextMenu(null) }}>
            Abrir mundo
          </button>
          <button type="button" onClick={() => openEditWorldModal(contextMenu.world)}>
            Editar mundo
          </button>
          <button type="button" onClick={() => toggleWorldFlag(contextMenu.world, 'favorite')}>
            {contextMenu.world.favorite ? 'Remover favorito' : 'Marcar favorito'}
          </button>
          <button type="button" onClick={() => toggleWorldFlag(contextMenu.world, 'locked')}>
            {contextMenu.world.locked ? 'Desbloquear mundo' : 'Bloquear mundo'}
          </button>
          <button className={styles.contextDanger} type="button" onClick={() => handleDeleteWorld(contextMenu.world)}>
            Apagar mundo
          </button>
        </div>
      )}

      {modal === 'world' && (
        <div className={styles.modalOverlay} onMouseDown={() => !creatingWorld && setModal(null)}>
          <form className={styles.modal} onSubmit={handleCreateWorld} onMouseDown={event => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <strong>Criar mundo</strong>
              <button className={styles.modalClose} type="button" onClick={() => setModal(null)} disabled={creatingWorld}>
                x
              </button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Nome</span>
                <input
                  className={styles.formInput}
                  value={worldForm.name}
                  onChange={event => setWorldForm(prev => ({ ...prev, name: event.target.value }))}
                  autoFocus
                  placeholder="Ex: Campanha de sexta"
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Sistema</span>
                <select
                  className={styles.formSelect}
                  value={worldForm.systemId}
                  onChange={event => setWorldForm(prev => ({ ...prev, systemId: event.target.value }))}
                >
                  {systems.map(system => (
                    <option key={system.id} value={system.id}>
                      {system.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.formGrid}>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Caminho dos dados</span>
                  <input
                    className={styles.formInput}
                    value={worldForm.dataPath}
                    onChange={event => setWorldForm(prev => ({ ...prev, dataPath: event.target.value }))}
                    placeholder="Gerado pelo nome se vazio"
                  />
                </label>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Tema de entrada</span>
                  <select
                    className={styles.formSelect}
                    value={worldForm.joinTheme}
                    onChange={event => setWorldForm(prev => ({ ...prev, joinTheme: event.target.value }))}
                  >
                    {JOIN_THEMES.map(theme => (
                      <option key={theme.id} value={theme.id}>{theme.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Imagem de fundo da entrada</span>
                <input
                  className={styles.formInput}
                  value={worldForm.backgroundImage}
                  onChange={event => setWorldForm(prev => ({ ...prev, backgroundImage: event.target.value }))}
                  placeholder="Caminho ou URL da imagem"
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Proxima sessao</span>
                <input
                  className={styles.formInput}
                  type="datetime-local"
                  value={worldForm.nextSession}
                  onChange={event => setWorldForm(prev => ({ ...prev, nextSession: event.target.value }))}
                />
              </label>
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={worldForm.safeConfiguration}
                  onChange={event => setWorldForm(prev => ({ ...prev, safeConfiguration: event.target.checked }))}
                />
                <span>Iniciar em configuracao segura</span>
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Descricao</span>
                <textarea
                  className={styles.formTextarea}
                  rows={3}
                  value={worldForm.description}
                  onChange={event => setWorldForm(prev => ({ ...prev, description: event.target.value }))}
                  placeholder="Opcional"
                />
              </label>
              {formError && <div className={styles.formError}>{formError}</div>}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryBtn} type="button" onClick={() => setModal(null)} disabled={creatingWorld}>
                Cancelar
              </button>
              <button className={styles.primaryBtn} type="submit" disabled={!worldForm.name.trim() || !worldForm.systemId || creatingWorld}>
                {creatingWorld ? 'Criando...' : 'Criar mundo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === 'editWorld' && selectedWorld && (
        <div className={styles.modalOverlay} onMouseDown={() => { if (!savingWorld) { setModal(null); setSelectedWorld(null) } }}>
          <form className={styles.modalLarge} onSubmit={handleEditWorld} onMouseDown={event => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <strong>Editar mundo</strong>
              <button className={styles.modalClose} type="button" onClick={() => { setModal(null); setSelectedWorld(null) }} disabled={savingWorld}>
                x
              </button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Titulo do mundo</span>
                <input
                  className={styles.formInput}
                  value={worldForm.name}
                  onChange={event => setWorldForm(prev => ({ ...prev, name: event.target.value }))}
                  autoFocus
                />
              </label>
              <div className={styles.formGrid}>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Caminho dos dados</span>
                  <input
                    className={styles.formInput}
                    value={worldForm.dataPath}
                    onChange={event => setWorldForm(prev => ({ ...prev, dataPath: event.target.value }))}
                  />
                </label>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Sistema</span>
                  <select
                    className={styles.formSelect}
                    value={worldForm.systemId}
                    onChange={event => setWorldForm(prev => ({ ...prev, systemId: event.target.value }))}
                  >
                    {systems.map(system => (
                      <option key={system.id} value={system.id}>{system.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Imagem de fundo da entrada</span>
                <input
                  className={styles.formInput}
                  value={worldForm.backgroundImage}
                  onChange={event => setWorldForm(prev => ({ ...prev, backgroundImage: event.target.value }))}
                  placeholder="Caminho ou URL da imagem"
                />
              </label>
              <div className={styles.formGrid}>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Tema de entrada</span>
                  <select
                    className={styles.formSelect}
                    value={worldForm.joinTheme}
                    onChange={event => setWorldForm(prev => ({ ...prev, joinTheme: event.target.value }))}
                  >
                    {JOIN_THEMES.map(theme => (
                      <option key={theme.id} value={theme.id}>{theme.label}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Proxima sessao</span>
                  <input
                    className={styles.formInput}
                    type="datetime-local"
                    value={worldForm.nextSession}
                    onChange={event => setWorldForm(prev => ({ ...prev, nextSession: event.target.value }))}
                  />
                </label>
              </div>
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={worldForm.safeConfiguration}
                  onChange={event => setWorldForm(prev => ({ ...prev, safeConfiguration: event.target.checked }))}
                />
                <span>Iniciar em configuracao segura</span>
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Descricao do mundo</span>
                <textarea
                  className={styles.formTextarea}
                  rows={7}
                  value={worldForm.description}
                  onChange={event => setWorldForm(prev => ({ ...prev, description: event.target.value }))}
                  placeholder="Texto que aparece na tela de entrada da sessao"
                />
              </label>
              {formError && <div className={styles.formError}>{formError}</div>}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryBtn} type="button" onClick={() => { setModal(null); setSelectedWorld(null) }} disabled={savingWorld}>
                Cancelar
              </button>
              <button className={styles.primaryBtn} type="submit" disabled={!worldForm.name.trim() || !worldForm.systemId || savingWorld}>
                {savingWorld ? 'Salvando...' : 'Salvar mundo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {(modal === 'system' || modal === 'editSystem') && (
        <div className={styles.modalOverlay} onMouseDown={() => {
          if (!creatingSystem && !savingSystem) {
            setSelectedSystem(null)
            setModal(null)
          }
        }}>
          <form
            className={styles.modalLarge}
            onSubmit={modal === 'editSystem' ? handleEditSystem : handleCreateSystem}
            onMouseDown={event => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <strong>{modal === 'editSystem' ? 'Editar sistema' : 'Criar sistema'}</strong>
              <button
                className={styles.modalClose}
                type="button"
                onClick={() => {
                  setSelectedSystem(null)
                  setModal(null)
                }}
                disabled={creatingSystem || savingSystem}
              >
                x
              </button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Nome</span>
                <input
                  className={styles.formInput}
                  value={systemForm.name}
                  onChange={event => setSystemForm(prev => ({ ...prev, name: event.target.value }))}
                  autoFocus
                  placeholder="Ex: D&D 5e Lite, Tormenta, Ordem, sistema proprio"
                />
              </label>
              <div className={styles.formGrid}>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Regra/base</span>
                  <input
                    className={styles.formInput}
                    value={systemForm.ruleset}
                    onChange={event => setSystemForm(prev => ({ ...prev, ruleset: event.target.value }))}
                    placeholder="Opcional"
                  />
                </label>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Versao</span>
                  <input
                    className={styles.formInput}
                    value={systemForm.version}
                    onChange={event => setSystemForm(prev => ({ ...prev, version: event.target.value }))}
                    placeholder="Opcional"
                  />
                </label>
              </div>
              <div className={styles.formGrid}>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Distancia do grid</span>
                  <input
                    className={styles.formInput}
                    type="number"
                    min="1"
                    value={systemForm.gridDistance}
                    onChange={event => setSystemForm(prev => ({ ...prev, gridDistance: event.target.value }))}
                  />
                </label>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Unidade do grid</span>
                  <input
                    className={styles.formInput}
                    value={systemForm.gridUnits}
                    onChange={event => setSystemForm(prev => ({ ...prev, gridUnits: event.target.value }))}
                    placeholder="ft, m, quadrados..."
                  />
                </label>
              </div>
              <section className={styles.creatorPanel}>
                <div className={styles.creatorPanelHeader}>
                  <span className={styles.formLabel}>Templates</span>
                  <small>Escolha uma base e ajuste os campos sem mexer em JSON.</small>
                </div>
                <div className={styles.templateGrid}>
                  {SYSTEM_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      className={`${styles.templateCard} ${systemForm.templateId === template.id ? styles.templateCardActive : ''}`}
                      type="button"
                      onClick={() => applySystemTemplate(template.id)}
                    >
                      <strong>{template.label}</strong>
                      <span>{template.description}</span>
                    </button>
                  ))}
                </div>
              </section>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Tipo inicial de ator</span>
                <input
                  className={styles.formInput}
                  value={systemForm.actorTypeLabel}
                  onChange={event => setSystemForm(prev => ({ ...prev, actorTypeLabel: event.target.value }))}
                  placeholder="Personagem, NPC, Criatura..."
                />
              </label>
              <section className={styles.fieldBuilder}>
                <div className={styles.fieldBuilderHeader}>
                  <div>
                    <span className={styles.formLabel}>Campos da ficha</span>
                    <p>Estes campos vao para o `system.json`; cada secao vira uma aba da ficha no mobile.</p>
                  </div>
                  <button className={styles.systemActionBtn} type="button" onClick={addSystemField}>
                    Adicionar campo
                  </button>
                </div>
                <div className={styles.sectionPreview}>
                  <span>Abas geradas</span>
                  <div>
                    {systemSectionPreview.map(section => (
                      <strong key={section}>{section}</strong>
                    ))}
                  </div>
                </div>
                <datalist id="system-section-presets">
                  {SYSTEM_SECTION_PRESETS.map(section => (
                    <option key={section} value={section} />
                  ))}
                </datalist>
                <div className={styles.fieldBuilderRows}>
                  {systemForm.actorFields.map((field, index) => (
                    <div className={styles.fieldBuilderRow} key={`${field.id}-${index}`}>
                      <label>
                        <span>Rotulo</span>
                        <input
                          className={styles.formInput}
                          value={field.label}
                          onChange={event => updateSystemField(index, {
                            label: event.target.value,
                            id: fieldId(event.target.value, field.id),
                          })}
                        />
                      </label>
                      <label>
                        <span>ID</span>
                        <input
                          className={styles.formInput}
                          value={field.id}
                          onChange={event => updateSystemField(index, { id: fieldId(event.target.value, field.id) })}
                        />
                      </label>
                      <label>
                        <span>Tipo</span>
                        <select
                          className={styles.formSelect}
                          value={field.type}
                          onChange={event => updateSystemField(index, { type: event.target.value as SystemFieldType })}
                        >
                          {FIELD_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Padrao</span>
                        {field.type === 'checkbox' ? (
                          <span className={styles.builderCheck}>
                            <input
                              type="checkbox"
                              checked={Boolean(field.default_value)}
                              onChange={event => updateSystemField(index, { default_value: event.target.checked })}
                            />
                            Ligado
                          </span>
                        ) : (
                          <input
                            className={styles.formInput}
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={String(field.default_value ?? '')}
                            onChange={event => updateSystemField(index, { default_value: parseDefaultValue(field.type, event.target.value) })}
                          />
                        )}
                      </label>
                      <label>
                        <span>Secao</span>
                        <input
                          className={styles.formInput}
                          list="system-section-presets"
                          value={field.section}
                          onChange={event => updateSystemField(index, { section: event.target.value })}
                        />
                      </label>
                      <label>
                        <span>Rolagem</span>
                        <input
                          className={styles.formInput}
                          value={field.roll_formula || ''}
                          onChange={event => updateSystemField(index, { roll_formula: event.target.value })}
                          placeholder="1d20 + @campo.mod"
                        />
                      </label>
                      <button
                        className={styles.fieldRemoveBtn}
                        type="button"
                        onClick={() => removeSystemField(index)}
                        disabled={systemForm.actorFields.length <= 1}
                      >
                        Apagar
                      </button>
                    </div>
                  ))}
                </div>
              </section>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Descricao</span>
                <textarea
                  className={styles.formTextarea}
                  rows={3}
                  value={systemForm.description}
                  onChange={event => setSystemForm(prev => ({ ...prev, description: event.target.value }))}
                  placeholder="Opcional"
                />
              </label>
              {formError && <div className={styles.formError}>{formError}</div>}
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.secondaryBtn}
                type="button"
                onClick={() => {
                  setSelectedSystem(null)
                  setModal(null)
                }}
                disabled={creatingSystem || savingSystem}
              >
                Cancelar
              </button>
              <button className={styles.primaryBtn} type="submit" disabled={!systemForm.name.trim() || creatingSystem || savingSystem}>
                {modal === 'editSystem'
                  ? (savingSystem ? 'Salvando...' : 'Salvar sistema')
                  : (creatingSystem ? 'Criando...' : 'Criar sistema')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
