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
  type ApiCompendiumItem,
  type ApiGameSystem,
  type ApiSystemActorType,
  type ApiSystemField,
  type ApiSystemItemType,
  type ApiWorld,
  type SystemFieldType,
} from '../services/vttApi'
import styles from './Launcher.module.css'

interface LauncherProps {
  onEnterWorld: (worldId: string) => void
}

interface SystemTemplateActorType {
  label: string
  fields: ApiSystemField[]
}

interface SystemTemplate {
  id: string
  label: string
  description: string
  ruleset: string
  gridDistance: string
  gridUnits: string
  actorTypes: SystemTemplateActorType[]
  itemTypes: ApiSystemItemType[]
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

const SIMPLE_ACTOR_FIELDS: ApiSystemField[] = [
  { id: 'hp', label: 'PV atual', type: 'number', section: 'Combate', default_value: 10 },
  { id: 'max_hp', label: 'PV maximo', type: 'number', section: 'Combate', default_value: 10 },
  { id: 'ac', label: 'Defesa/CA', type: 'number', section: 'Combate', default_value: 10 },
  { id: 'notes', label: 'Notas', type: 'textarea', section: 'Notas', default_value: '' },
]

const DND_NPC_FIELDS: ApiSystemField[] = [
  { id: 'creature_type', label: 'Tipo de criatura', type: 'text', section: 'Identidade', default_value: '' },
  { id: 'challenge', label: 'Desafio', type: 'text', section: 'Identidade', default_value: '0' },
  { id: 'hp', label: 'PV atual', type: 'number', section: 'Combate', default_value: 8 },
  { id: 'max_hp', label: 'PV maximo', type: 'number', section: 'Combate', default_value: 8 },
  { id: 'ac', label: 'CA', type: 'number', section: 'Combate', default_value: 10 },
  { id: 'speed', label: 'Deslocamento', type: 'number', section: 'Combate', default_value: 9 },
  { id: 'str', label: 'Forca', type: 'number', section: 'Atributos', default_value: 10, roll_formula: '1d20 + @str.mod' },
  { id: 'dex', label: 'Destreza', type: 'number', section: 'Atributos', default_value: 10, roll_formula: '1d20 + @dex.mod' },
  { id: 'con', label: 'Constituicao', type: 'number', section: 'Atributos', default_value: 10, roll_formula: '1d20 + @con.mod' },
  { id: 'int', label: 'Inteligencia', type: 'number', section: 'Atributos', default_value: 10, roll_formula: '1d20 + @int.mod' },
  { id: 'wis', label: 'Sabedoria', type: 'number', section: 'Atributos', default_value: 10, roll_formula: '1d20 + @wis.mod' },
  { id: 'cha', label: 'Carisma', type: 'number', section: 'Atributos', default_value: 10, roll_formula: '1d20 + @cha.mod' },
  { id: 'senses', label: 'Sentidos', type: 'text', section: 'Tracos', default_value: '' },
  { id: 'languages', label: 'Idiomas', type: 'text', section: 'Tracos', default_value: '' },
  { id: 'traits', label: 'Tracos', type: 'textarea', section: 'Tracos', default_value: '' },
  { id: 'actions', label: 'Acoes', type: 'textarea', section: 'Acoes', default_value: '' },
  { id: 'reactions', label: 'Reacoes', type: 'textarea', section: 'Acoes', default_value: '' },
  { id: 'loot', label: 'Tesouro/loot', type: 'textarea', section: 'Inventario', default_value: '' },
  { id: 'notes', label: 'Notas do mestre', type: 'textarea', section: 'Notas', default_value: '' },
]

const DND_MONSTER_FIELDS: ApiSystemField[] = [
  ...DND_NPC_FIELDS,
  { id: 'legendary_actions', label: 'Acoes lendarias', type: 'textarea', section: 'Acoes', default_value: '' },
  { id: 'lair_actions', label: 'Acoes de covil', type: 'textarea', section: 'Acoes', default_value: '' },
]

const DEFAULT_ITEM_TYPES: ApiSystemItemType[] = [
  {
    id: 'weapon',
    label: 'Arma',
    fields: [
      { id: 'attack_bonus', label: 'Bonus de ataque', type: 'number', section: 'Uso', default_value: 0, roll_formula: '1d20 + @attack_bonus' },
      { id: 'damage', label: 'Dano', type: 'text', section: 'Uso', default_value: '1d6', roll_formula: '@damage' },
      { id: 'damage_type', label: 'Tipo de dano', type: 'text', section: 'Uso', default_value: '' },
      { id: 'properties', label: 'Propriedades', type: 'text', section: 'Uso', default_value: '' },
      { id: 'bonus_attack_bonus', label: 'Bonus no ataque da ficha', type: 'number', section: 'Efeitos', default_value: 0 },
      { id: 'description', label: 'Descricao', type: 'textarea', section: 'Notas', default_value: '' },
    ],
  },
  {
    id: 'armor',
    label: 'Armadura',
    fields: [
        { id: 'armor_class', label: 'CA base', type: 'number', section: 'Uso', default_value: 10 },
        { id: 'bonus_ac', label: 'Bonus de CA', type: 'number', section: 'Efeitos', default_value: 0 },
        { id: 'set_ac', label: 'Definir CA', type: 'number', section: 'Efeitos', default_value: 0 },
        { id: 'properties', label: 'Propriedades', type: 'text', section: 'Uso', default_value: '' },
        { id: 'description', label: 'Descricao', type: 'textarea', section: 'Notas', default_value: '' },
    ],
  },
  {
    id: 'spell',
    label: 'Magia',
    fields: [
      { id: 'level', label: 'Circulo/Nivel', type: 'number', section: 'Magia', default_value: 0 },
      { id: 'school', label: 'Escola', type: 'text', section: 'Magia', default_value: '' },
      { id: 'casting_time', label: 'Tempo de conjuracao', type: 'text', section: 'Magia', default_value: '' },
      { id: 'range', label: 'Alcance', type: 'text', section: 'Magia', default_value: '' },
      { id: 'duration', label: 'Duracao', type: 'text', section: 'Magia', default_value: '' },
      { id: 'damage', label: 'Dano/cura', type: 'text', section: 'Uso', default_value: '', roll_formula: '@damage' },
      { id: 'description', label: 'Descricao', type: 'textarea', section: 'Notas', default_value: '' },
    ],
  },
  {
    id: 'equipment',
    label: 'Equipamento',
    fields: [
      { id: 'quantity', label: 'Quantidade', type: 'number', section: 'Uso', default_value: 1 },
      { id: 'bonus_ac', label: 'Bonus de CA', type: 'number', section: 'Efeitos', default_value: 0 },
      { id: 'bonus_str', label: 'Bonus de Forca', type: 'number', section: 'Efeitos', default_value: 0 },
      { id: 'bonus_dex', label: 'Bonus de Destreza', type: 'number', section: 'Efeitos', default_value: 0 },
      { id: 'bonus_speed', label: 'Bonus de deslocamento', type: 'number', section: 'Efeitos', default_value: 0 },
      { id: 'description', label: 'Descricao', type: 'textarea', section: 'Notas', default_value: '' },
    ],
  },
  {
    id: 'condition',
    label: 'Condicao',
    fields: [
      { id: 'effect', label: 'Efeito', type: 'textarea', section: 'Regra', default_value: '' },
      { id: 'duration', label: 'Duracao', type: 'text', section: 'Regra', default_value: '' },
      { id: 'bonus_ac', label: 'Bonus de CA', type: 'number', section: 'Efeitos', default_value: 0 },
      { id: 'bonus_str', label: 'Bonus de Forca', type: 'number', section: 'Efeitos', default_value: 0 },
      { id: 'bonus_dex', label: 'Bonus de Destreza', type: 'number', section: 'Efeitos', default_value: 0 },
      { id: 'bonus_con', label: 'Bonus de Constituicao', type: 'number', section: 'Efeitos', default_value: 0 },
      { id: 'bonus_int', label: 'Bonus de Inteligencia', type: 'number', section: 'Efeitos', default_value: 0 },
      { id: 'bonus_wis', label: 'Bonus de Sabedoria', type: 'number', section: 'Efeitos', default_value: 0 },
      { id: 'bonus_cha', label: 'Bonus de Carisma', type: 'number', section: 'Efeitos', default_value: 0 },
      { id: 'set_speed', label: 'Definir deslocamento', type: 'number', section: 'Efeitos', default_value: 0 },
      { id: 'max_speed', label: 'Limite max. deslocamento', type: 'number', section: 'Efeitos', default_value: 0 },
      { id: 'multiply_speed', label: 'Multiplicar deslocamento', type: 'number', section: 'Efeitos', default_value: 1 },
    ],
  },
]

const SYSTEM_TEMPLATES: SystemTemplate[] = [
  {
    id: 'dnd5e-lite',
    label: 'D&D 5e Lite',
    description: 'Ficha SRD d20 com identidade, combate, atributos, pericias, acoes, inventario, magias e notas.',
    ruleset: 'd20',
    gridDistance: '5',
    gridUnits: 'ft',
    actorTypes: [
      { label: 'Personagem', fields: DEFAULT_ACTOR_FIELDS },
      { label: 'NPC', fields: DND_NPC_FIELDS },
      { label: 'Monstro', fields: DND_MONSTER_FIELDS },
    ],
    itemTypes: DEFAULT_ITEM_TYPES,
  },
  {
    id: 'simple-rpg',
    label: 'RPG simples',
    description: 'Ficha curta com PV, defesa e notas. Boa para comecar do zero.',
    ruleset: 'custom',
    gridDistance: '1',
    gridUnits: 'quadrado',
    actorTypes: [
      { label: 'Personagem', fields: SIMPLE_ACTOR_FIELDS },
      { label: 'NPC', fields: SIMPLE_ACTOR_FIELDS },
    ],
    itemTypes: [
      { id: 'item', label: 'Item', fields: [{ id: 'description', label: 'Descricao', type: 'textarea', section: 'Notas', default_value: '' }] },
    ],
  },
  {
    id: 'blank',
    label: 'Em branco',
    description: 'Comeca quase vazio para montar um sistema totalmente proprio.',
    ruleset: 'custom',
    gridDistance: '1',
    gridUnits: 'unidade',
    actorTypes: [
      { label: 'Personagem', fields: [{ id: 'notes', label: 'Notas', type: 'textarea', section: 'Notas', default_value: '' }] },
    ],
    itemTypes: [],
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

function cloneActorTypes(actorTypes: ApiSystemActorType[] = []) {
  return actorTypes.map((actorType, index) => ({
    id: fieldId(actorType.id || actorType.label, index === 0 ? 'personagem' : `ator_${index + 1}`),
    label: String(actorType.label || actorType.id || `Ator ${index + 1}`),
    fields: cloneActorFields(actorType.fields || []),
  }))
}

function cloneItemTypes(itemTypes: ApiSystemItemType[] = []) {
  return itemTypes.map((itemType, index) => ({
    id: fieldId(itemType.id || itemType.label, `item_${index + 1}`),
    label: String(itemType.label || itemType.id || `Item ${index + 1}`),
    fields: cloneActorFields(itemType.fields || []),
  }))
}

function cloneCompendiumItems(items: ApiCompendiumItem[] = [], itemTypes: ApiSystemItemType[] = []) {
  if (itemTypes.length === 0) return []

  return items
    .map((item, index) => {
      const itemType = itemTypes.find(type => type.id === item.type) ?? itemTypes[0]
      const name = String(item.name || `Item ${index + 1}`).trim() || `Item ${index + 1}`
      return {
        id: fieldId(item.id || name, `compendium_item_${index + 1}`),
        type: itemType.id,
        name,
        data: item.data || {},
        equipped: Boolean(item.equipped),
        quantity: Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 1,
      }
    })
    .filter(item => item.id && item.name)
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

function makeActorType(label: string, fields: ApiSystemField[], id?: string, index = 0): ApiSystemActorType {
  const safeLabel = label.trim() || 'Personagem'

  return {
    id: fieldId(id || safeLabel, index === 0 ? 'personagem' : `ator_${index + 1}`),
    label: safeLabel,
    fields: normalizeActorFields(fields),
  }
}

function makeActorTypeDraft(label: string, fields: ApiSystemField[], index = 0): ApiSystemActorType {
  return makeActorType(label, cloneActorFields(fields), undefined, index)
}

function normalizeActorTypesForSave(actorTypes: ApiSystemActorType[]) {
  return actorTypes.map((actorType, index) => makeActorType(actorType.label, actorType.fields, actorType.id, index))
}

function normalizeItemTypesForSave(itemTypes: ApiSystemItemType[]) {
  return itemTypes
    .map((itemType, index) => {
      const label = String(itemType.label || `Item ${index + 1}`).trim() || `Item ${index + 1}`
      return {
        id: fieldId(itemType.id || label, `item_${index + 1}`),
        label,
        fields: normalizeActorFields(itemType.fields || []),
      }
    })
    .filter(itemType => itemType.label)
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

function newItemType(index: number): ApiSystemItemType {
  return {
    id: `item_${index + 1}`,
    label: `Item ${index + 1}`,
    fields: [
      { id: 'description', label: 'Descricao', type: 'textarea', section: 'Notas', default_value: '', roll_formula: '' },
    ],
  }
}

function actorTypesFromTemplate(template: SystemTemplate) {
  return template.actorTypes.map((actorType, index) => makeActorTypeDraft(actorType.label, actorType.fields, index))
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

function validateSystemFields(fields: ApiSystemField[], scopeLabel: string) {
  const errors: string[] = []

  const duplicatedFieldIds = duplicatedValues(fields.map(field => field.id))
  if (duplicatedFieldIds.length > 0) {
    errors.push(`IDs de campo duplicados em ${scopeLabel}: ${duplicatedFieldIds.join(', ')}.`)
  }

  fields.forEach((field, index) => {
    if (!field.id.trim()) errors.push(`Campo ${index + 1} de ${scopeLabel} precisa ter ID.`)
    if (!field.label.trim()) errors.push(`Campo ${field.id || index + 1} de ${scopeLabel} precisa ter rotulo.`)
    if (!FIELD_TYPES.includes(field.type)) errors.push(`Campo ${field.label || field.id} de ${scopeLabel} usa tipo invalido.`)
  })

  return errors
}

function validateSystemDraft(
  systemName: string,
  actorTypes: ApiSystemActorType[],
  itemTypes: ApiSystemItemType[],
  gridDistance: string,
  gridUnits: string,
) {
  const errors: string[] = []

  if (!systemName.trim()) errors.push('Nome do sistema e obrigatorio.')
  if (actorTypes.length === 0) errors.push('Adicione pelo menos um tipo de ator.')

  const duplicatedActorTypeIds = duplicatedValues(actorTypes.map(actorType => actorType.id))
  if (duplicatedActorTypeIds.length > 0) {
    errors.push(`IDs de tipo de ator duplicados: ${duplicatedActorTypeIds.join(', ')}.`)
  }

  actorTypes.forEach((actorType, index) => {
    const scopeLabel = actorType.label || `tipo de ator ${index + 1}`
    if (!actorType.id.trim()) errors.push(`Tipo de ator ${index + 1} precisa ter ID.`)
    if (!actorType.label.trim()) errors.push(`Tipo de ator ${actorType.id || index + 1} precisa ter nome.`)
    if (actorType.fields.length === 0) errors.push(`${scopeLabel} precisa ter pelo menos um campo.`)
    errors.push(...validateSystemFields(actorType.fields, scopeLabel))
  })

  const duplicatedItemTypeIds = duplicatedValues(itemTypes.map(itemType => itemType.id))
  if (duplicatedItemTypeIds.length > 0) {
    errors.push(`IDs de tipo de item duplicados: ${duplicatedItemTypeIds.join(', ')}.`)
  }

  itemTypes.forEach((itemType, index) => {
    const scopeLabel = `item ${itemType.label || index + 1}`
    if (!itemType.id.trim()) errors.push(`Tipo de item ${index + 1} precisa ter ID.`)
    if (!itemType.label.trim()) errors.push(`Tipo de item ${itemType.id || index + 1} precisa ter nome.`)
    errors.push(...validateSystemFields(itemType.fields || [], scopeLabel))
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
  const [activeActorTypeIndex, setActiveActorTypeIndex] = useState(0)
  const [activeItemTypeIndex, setActiveItemTypeIndex] = useState(0)
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
    actorTypes: actorTypesFromTemplate(SYSTEM_TEMPLATES[0]),
    itemTypes: cloneItemTypes(DEFAULT_ITEM_TYPES),
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
    const template = SYSTEM_TEMPLATES[0]
    setSystemForm({
      name: '',
      ruleset: '',
      version: '0.1',
      description: '',
      templateId: template.id,
      actorTypes: actorTypesFromTemplate(template),
      itemTypes: cloneItemTypes(template.itemTypes),
      gridDistance: template.gridDistance,
      gridUnits: template.gridUnits,
    })
    setActiveActorTypeIndex(0)
    setActiveItemTypeIndex(0)
    setSelectedSystem(null)
    setFormError('')
    setModal('system')
  }

  function openEditSystemModal(system: ApiGameSystem) {
    const actorTypes = cloneActorTypes(system.actor_types?.length ? system.actor_types : [makeActorTypeDraft('Personagem', DEFAULT_ACTOR_FIELDS)])
    setSystemForm({
      name: system.name,
      ruleset: system.ruleset || '',
      version: system.version || '0.1',
      description: system.description || '',
      templateId: 'custom',
      actorTypes,
      itemTypes: cloneItemTypes(system.item_types || []),
      gridDistance: String(system.grid?.distance ?? 5),
      gridUnits: system.grid?.units || 'ft',
    })
    setActiveActorTypeIndex(0)
    setActiveItemTypeIndex(0)
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
      actorTypes: actorTypesFromTemplate(template),
      itemTypes: cloneItemTypes(template.itemTypes),
      gridDistance: template.gridDistance,
      gridUnits: template.gridUnits,
    }))
    setActiveActorTypeIndex(0)
    setActiveItemTypeIndex(0)
  }

  function updateActorType(index: number, patch: Partial<ApiSystemActorType>) {
    setSystemForm(prev => ({
      ...prev,
      templateId: 'custom',
      actorTypes: prev.actorTypes.map((actorType, actorTypeIndex) => (
        actorTypeIndex === index ? { ...actorType, ...patch } : actorType
      )),
    }))
  }

  function addActorType() {
    setSystemForm(prev => ({
      ...prev,
      templateId: 'custom',
      actorTypes: [
        ...prev.actorTypes,
        makeActorTypeDraft(`Ator ${prev.actorTypes.length + 1}`, SIMPLE_ACTOR_FIELDS, prev.actorTypes.length),
      ],
    }))
    setActiveActorTypeIndex(systemForm.actorTypes.length)
  }

  function duplicateActorType(index: number) {
    setSystemForm(prev => ({
      ...prev,
      templateId: 'custom',
      actorTypes: [
        ...prev.actorTypes,
        makeActorTypeDraft(
          `${prev.actorTypes[index]?.label || 'Ator'} copia`,
          prev.actorTypes[index]?.fields || SIMPLE_ACTOR_FIELDS,
          prev.actorTypes.length,
        ),
      ],
    }))
    setActiveActorTypeIndex(systemForm.actorTypes.length)
  }

  function removeActorType(index: number) {
    setSystemForm(prev => {
      if (prev.actorTypes.length <= 1) return prev
      return {
        ...prev,
        templateId: 'custom',
        actorTypes: prev.actorTypes.filter((_, actorTypeIndex) => actorTypeIndex !== index),
      }
    })
    setActiveActorTypeIndex(prev => Math.max(0, Math.min(prev, systemForm.actorTypes.length - 2)))
  }

  function updateSystemField(index: number, patch: Partial<ApiSystemField>) {
    setSystemForm(prev => ({
      ...prev,
      templateId: 'custom',
      actorTypes: prev.actorTypes.map((actorType, actorTypeIndex) => (
        actorTypeIndex === activeActorTypeIndex
          ? {
              ...actorType,
              fields: actorType.fields.map((field, fieldIndex) => (
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
            }
          : actorType
      )),
    }))
  }

  function addSystemField() {
    setSystemForm(prev => ({
      ...prev,
      templateId: 'custom',
      actorTypes: prev.actorTypes.map((actorType, actorTypeIndex) => (
        actorTypeIndex === activeActorTypeIndex
          ? { ...actorType, fields: [...actorType.fields, newSystemField(actorType.fields.length)] }
          : actorType
      )),
    }))
  }

  function removeSystemField(index: number) {
    setSystemForm(prev => ({
      ...prev,
      templateId: 'custom',
      actorTypes: prev.actorTypes.map((actorType, actorTypeIndex) => (
        actorTypeIndex === activeActorTypeIndex
          ? { ...actorType, fields: actorType.fields.filter((_, fieldIndex) => fieldIndex !== index) }
          : actorType
      )),
    }))
  }

  function updateItemType(index: number, patch: Partial<ApiSystemItemType>) {
    setSystemForm(prev => ({
      ...prev,
      templateId: 'custom',
      itemTypes: prev.itemTypes.map((itemType, itemTypeIndex) => (
        itemTypeIndex === index ? { ...itemType, ...patch } : itemType
      )),
    }))
  }

  function addItemType() {
    setSystemForm(prev => ({
      ...prev,
      templateId: 'custom',
      itemTypes: [...prev.itemTypes, newItemType(prev.itemTypes.length)],
    }))
    setActiveItemTypeIndex(systemForm.itemTypes.length)
  }

  function removeItemType(index: number) {
    setSystemForm(prev => ({
      ...prev,
      templateId: 'custom',
      itemTypes: prev.itemTypes.filter((_, itemTypeIndex) => itemTypeIndex !== index),
    }))
    setActiveItemTypeIndex(prev => Math.max(0, Math.min(prev, systemForm.itemTypes.length - 2)))
  }

  function updateItemField(index: number, patch: Partial<ApiSystemField>) {
    setSystemForm(prev => ({
      ...prev,
      templateId: 'custom',
      itemTypes: prev.itemTypes.map((itemType, itemTypeIndex) => (
        itemTypeIndex === activeItemTypeIndex
          ? {
              ...itemType,
              fields: itemType.fields.map((field, fieldIndex) => (
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
            }
          : itemType
      )),
    }))
  }

  function addItemField() {
    setSystemForm(prev => ({
      ...prev,
      templateId: 'custom',
      itemTypes: prev.itemTypes.map((itemType, itemTypeIndex) => (
        itemTypeIndex === activeItemTypeIndex
          ? { ...itemType, fields: [...itemType.fields, newSystemField(itemType.fields.length)] }
          : itemType
      )),
    }))
  }

  function removeItemField(index: number) {
    setSystemForm(prev => ({
      ...prev,
      templateId: 'custom',
      itemTypes: prev.itemTypes.map((itemType, itemTypeIndex) => (
        itemTypeIndex === activeItemTypeIndex
          ? { ...itemType, fields: itemType.fields.filter((_, fieldIndex) => fieldIndex !== index) }
          : itemType
      )),
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
    const actorTypes = normalizeActorTypesForSave(systemForm.actorTypes)
    const itemTypes = normalizeItemTypesForSave(systemForm.itemTypes)

    const validationErrors = validateSystemDraft(systemForm.name, actorTypes, itemTypes, systemForm.gridDistance, systemForm.gridUnits)
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
        actor_types: actorTypes,
        item_types: itemTypes,
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
    const actorTypes = normalizeActorTypesForSave(systemForm.actorTypes)
    const itemTypes = normalizeItemTypesForSave(systemForm.itemTypes)

    const validationErrors = validateSystemDraft(systemForm.name, actorTypes, itemTypes, systemForm.gridDistance, systemForm.gridUnits)
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
        actor_types: actorTypes,
        item_types: itemTypes,
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

  function handleExportSystem(system: ApiGameSystem) {
    const manifest = { ...system }
    delete manifest.package_path
    delete manifest.manifest_path
    const blob = new Blob([`${JSON.stringify(manifest, null, 2)}\n`], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fieldId(system.name || system.id, 'sistema')}.system.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  async function importSystemFile(file: File) {
    setCreatingSystem(true)
    try {
      const raw = JSON.parse(await file.text()) as Partial<ApiGameSystem>
      const rawManifest = raw as Partial<ApiGameSystem> & {
        actorTypes?: ApiSystemActorType[]
        itemTypes?: ApiSystemItemType[]
        compendiumItems?: ApiCompendiumItem[]
      }
      const actorTypes = normalizeActorTypesForSave(cloneActorTypes(rawManifest.actor_types || rawManifest.actorTypes || []))
      const itemTypes = normalizeItemTypesForSave(cloneItemTypes(rawManifest.item_types || rawManifest.itemTypes || []))
      const compendiumItems = cloneCompendiumItems(rawManifest.compendium_items || rawManifest.compendiumItems || [], itemTypes)
      const name = String(raw.name || file.name.replace(/\.json$/i, '')).trim()
      const gridDistance = String(raw.grid?.distance ?? 5)
      const gridUnits = String(raw.grid?.units || 'ft')
      const validationErrors = validateSystemDraft(name, actorTypes, itemTypes, gridDistance, gridUnits)

      if (validationErrors.length > 0) {
        window.alert(`Sistema importado invalido:\n- ${validationErrors.join('\n- ')}`)
        return
      }

      const system = await createSystem({
        name,
        ruleset: String(raw.ruleset || ''),
        version: String(raw.version || '0.1'),
        description: String(raw.description || ''),
        actor_types: actorTypes,
        item_types: itemTypes,
        compendium_items: compendiumItems,
        primary_token_attribute: raw.primary_token_attribute || 'hp',
        grid: {
          distance: Number(gridDistance) || 5,
          units: gridUnits.trim() || 'ft',
        },
      })
      setSystems(prev => [...prev, system])
      setActiveTab('systems')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Nao consegui importar esse sistema.')
    } finally {
      setCreatingSystem(false)
    }
  }

  function openSystemImportFile() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) void importSystemFile(file)
    }
    input.click()
  }

  function renderFieldRows(
    fields: ApiSystemField[],
    updateField: (index: number, patch: Partial<ApiSystemField>) => void,
    removeField: (index: number) => void,
    minimumFields = 1,
  ) {
    return (
      <div className={styles.fieldBuilderRows}>
        {fields.map((field, index) => (
          <div className={styles.fieldBuilderRow} key={`${field.id}-${index}`}>
            <label>
              <span>Rotulo</span>
              <input
                className={styles.formInput}
                value={field.label}
                onChange={event => updateField(index, {
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
                onChange={event => updateField(index, { id: fieldId(event.target.value, field.id) })}
              />
            </label>
            <label>
              <span>Tipo</span>
              <select
                className={styles.formSelect}
                value={field.type}
                onChange={event => updateField(index, { type: event.target.value as SystemFieldType })}
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
                    onChange={event => updateField(index, { default_value: event.target.checked })}
                  />
                  Ligado
                </span>
              ) : (
                <input
                  className={styles.formInput}
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={String(field.default_value ?? '')}
                  onChange={event => updateField(index, { default_value: parseDefaultValue(field.type, event.target.value) })}
                />
              )}
            </label>
            <label>
              <span>Secao</span>
              <input
                className={styles.formInput}
                list="system-section-presets"
                value={field.section}
                onChange={event => updateField(index, { section: event.target.value })}
              />
            </label>
            <label>
              <span>Rolagem</span>
              <input
                className={styles.formInput}
                value={field.roll_formula || ''}
                onChange={event => updateField(index, { roll_formula: event.target.value })}
                placeholder="1d20 + @campo.mod"
              />
            </label>
            <button
              className={styles.fieldRemoveBtn}
              type="button"
              onClick={() => removeField(index)}
              disabled={fields.length <= minimumFields}
            >
              Apagar
            </button>
          </div>
        ))}
      </div>
    )
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
  const activeSystemActorType = systemForm.actorTypes[activeActorTypeIndex] ?? systemForm.actorTypes[0]
  const activeSystemItemType = systemForm.itemTypes[activeItemTypeIndex] ?? systemForm.itemTypes[0]
  const systemSectionPreview = sectionNames(activeSystemActorType?.fields || [])
  const itemSectionPreview = sectionNames(activeSystemItemType?.fields || [])

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
                  <button className={styles.secondaryBtn} type="button" onClick={openSystemImportFile} disabled={creatingSystem || status === 'offline'}>
                    Importar JSON
                  </button>
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
                        <span>{system.item_types?.length || 0} tipos de item</span>
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
                          className={styles.systemActionBtn}
                          type="button"
                          onClick={() => handleExportSystem(system)}
                        >
                          Exportar
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
              <datalist id="system-section-presets">
                {SYSTEM_SECTION_PRESETS.map(section => (
                  <option key={section} value={section} />
                ))}
              </datalist>

              <section className={styles.creatorPanel}>
                <div className={styles.creatorPanelHeader}>
                  <div>
                    <span className={styles.formLabel}>Tipos de ator</span>
                    <small>Personagem, NPC, monstro ou qualquer outro documento que o sistema permitir criar.</small>
                  </div>
                  <button className={styles.systemActionBtn} type="button" onClick={addActorType}>
                    Adicionar tipo
                  </button>
                </div>
                <div className={styles.actorTypeTabs}>
                  {systemForm.actorTypes.map((actorType, index) => (
                    <button
                      key={`${actorType.id}-${index}`}
                      className={`${styles.actorTypeTab} ${index === activeActorTypeIndex ? styles.actorTypeTabActive : ''}`}
                      type="button"
                      onClick={() => setActiveActorTypeIndex(index)}
                    >
                      <strong>{actorType.label || `Ator ${index + 1}`}</strong>
                      <span>{actorType.fields.length} campos</span>
                    </button>
                  ))}
                </div>
                {activeSystemActorType && (
                  <>
                    <div className={styles.formGrid}>
                      <label className={styles.formRow}>
                        <span className={styles.formLabel}>Nome do tipo</span>
                        <input
                          className={styles.formInput}
                          value={activeSystemActorType.label}
                          onChange={event => updateActorType(activeActorTypeIndex, {
                            label: event.target.value,
                            id: fieldId(event.target.value, activeSystemActorType.id),
                          })}
                        />
                      </label>
                      <label className={styles.formRow}>
                        <span className={styles.formLabel}>ID do tipo</span>
                        <input
                          className={styles.formInput}
                          value={activeSystemActorType.id}
                          onChange={event => updateActorType(activeActorTypeIndex, { id: fieldId(event.target.value, activeSystemActorType.id) })}
                        />
                      </label>
                    </div>
                    <div className={styles.inlineActions}>
                      <button className={styles.systemActionBtn} type="button" onClick={() => duplicateActorType(activeActorTypeIndex)}>
                        Duplicar tipo
                      </button>
                      <button
                        className={styles.systemDeleteBtn}
                        type="button"
                        onClick={() => removeActorType(activeActorTypeIndex)}
                        disabled={systemForm.actorTypes.length <= 1}
                      >
                        Apagar tipo
                      </button>
                    </div>
                  </>
                )}
              </section>

              <section className={styles.fieldBuilder}>
                <div className={styles.fieldBuilderHeader}>
                  <div>
                    <span className={styles.formLabel}>Campos da ficha</span>
                    <p>Estes campos vao para o `system.json`; cada secao vira uma aba da ficha no desktop e no mobile.</p>
                  </div>
                  <button className={styles.systemActionBtn} type="button" onClick={addSystemField}>
                    Adicionar campo
                  </button>
                </div>
                <div className={styles.builderSplit}>
                  <div className={styles.sectionPreview}>
                    <span>Abas geradas</span>
                    <div>
                      {systemSectionPreview.map(section => (
                        <strong key={section}>{section}</strong>
                      ))}
                    </div>
                  </div>
                  <div className={styles.sheetPreview}>
                    <span>Previa da ficha</span>
                    <strong>{activeSystemActorType?.label || 'Ator'}</strong>
                    {systemSectionPreview.slice(0, 4).map(section => (
                      <div key={section}>
                        <b>{section}</b>
                        <small>
                          {(activeSystemActorType?.fields || [])
                            .filter(field => field.section === section)
                            .slice(0, 4)
                            .map(field => field.label)
                            .join(', ') || 'Sem campos'}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
                {renderFieldRows(activeSystemActorType?.fields || [], updateSystemField, removeSystemField)}
              </section>

              <section className={styles.creatorPanel}>
                <div className={styles.creatorPanelHeader}>
                  <div>
                    <span className={styles.formLabel}>Tipos de item do sistema</span>
                    <small>Define o manifesto de arma, magia, equipamento e condicao para a proxima etapa de inventario/compendio.</small>
                  </div>
                  <button className={styles.systemActionBtn} type="button" onClick={addItemType}>
                    Adicionar item
                  </button>
                </div>
                {systemForm.itemTypes.length > 0 ? (
                  <>
                    <div className={styles.actorTypeTabs}>
                      {systemForm.itemTypes.map((itemType, index) => (
                        <button
                          key={`${itemType.id}-${index}`}
                          className={`${styles.actorTypeTab} ${index === activeItemTypeIndex ? styles.actorTypeTabActive : ''}`}
                          type="button"
                          onClick={() => setActiveItemTypeIndex(index)}
                        >
                          <strong>{itemType.label || `Item ${index + 1}`}</strong>
                          <span>{itemType.fields.length} campos</span>
                        </button>
                      ))}
                    </div>
                    {activeSystemItemType && (
                      <>
                        <div className={styles.formGrid}>
                          <label className={styles.formRow}>
                            <span className={styles.formLabel}>Nome do item</span>
                            <input
                              className={styles.formInput}
                              value={activeSystemItemType.label}
                              onChange={event => updateItemType(activeItemTypeIndex, {
                                label: event.target.value,
                                id: fieldId(event.target.value, activeSystemItemType.id),
                              })}
                            />
                          </label>
                          <label className={styles.formRow}>
                            <span className={styles.formLabel}>ID do item</span>
                            <input
                              className={styles.formInput}
                              value={activeSystemItemType.id}
                              onChange={event => updateItemType(activeItemTypeIndex, { id: fieldId(event.target.value, activeSystemItemType.id) })}
                            />
                          </label>
                        </div>
                        <div className={styles.inlineActions}>
                          <button className={styles.systemActionBtn} type="button" onClick={addItemField}>
                            Adicionar campo do item
                          </button>
                          <button className={styles.systemDeleteBtn} type="button" onClick={() => removeItemType(activeItemTypeIndex)}>
                            Apagar tipo de item
                          </button>
                        </div>
                        <div className={styles.sectionPreview}>
                          <span>Secoes do item</span>
                          <div>
                            {itemSectionPreview.map(section => (
                              <strong key={section}>{section}</strong>
                            ))}
                          </div>
                        </div>
                        {renderFieldRows(activeSystemItemType.fields || [], updateItemField, removeItemField, 0)}
                      </>
                    )}
                  </>
                ) : (
                  <div className={styles.emptyMini}>
                    Nenhum tipo de item definido. O sistema ainda pode criar atores, mas nao tera manifesto de itens.
                  </div>
                )}
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
