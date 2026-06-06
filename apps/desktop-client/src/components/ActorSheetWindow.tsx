import { useMemo, useRef, useState, type FormEvent, type PointerEvent } from 'react'
import type {
  ApiActor,
  ApiGameSystem,
  ApiSystemActorType,
  ApiSystemField,
  SystemFieldType,
} from '../services/vttApi'
import styles from './ActorSheetWindow.module.css'

type ActorData = Record<string, string | number | boolean>
type WindowPoint = { x: number; y: number }
type SheetMode = 'active' | 'edit'

interface ActorSheetWindowProps {
  actor: ApiActor
  system: ApiGameSystem | null
  onClose: () => void
  onSave: (actorId: string, payload: Partial<ApiActor>) => Promise<ApiActor>
  onRoll: (payload: { speaker: string; label: string; formula: string }) => Promise<void>
}

const FALLBACK_ACTOR_TYPE: ApiSystemActorType = {
  id: 'personagem',
  label: 'Personagem',
  fields: [
    { id: 'notes', label: 'Notas', type: 'textarea', section: 'Notas', default_value: '' },
  ],
}

const SECTION_ORDER = [
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

function normalizedSectionKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const ABILITIES = [
  { id: 'str', short: 'FOR', label: 'Forca' },
  { id: 'dex', short: 'DES', label: 'Destreza' },
  { id: 'con', short: 'CON', label: 'Constituicao' },
  { id: 'int', short: 'INT', label: 'Inteligencia' },
  { id: 'wis', short: 'SAB', label: 'Sabedoria' },
  { id: 'cha', short: 'CAR', label: 'Carisma' },
] as const

const SKILLS = [
  { id: 'acrobatics', label: 'Acrobacia', ability: 'dex' },
  { id: 'animal_handling', label: 'Adestrar Animais', ability: 'wis' },
  { id: 'arcana', label: 'Arcanismo', ability: 'int' },
  { id: 'athletics', label: 'Atletismo', ability: 'str' },
  { id: 'deception', label: 'Enganacao', ability: 'cha' },
  { id: 'history', label: 'Historia', ability: 'int' },
  { id: 'insight', label: 'Intuicao', ability: 'wis' },
  { id: 'intimidation', label: 'Intimidacao', ability: 'cha' },
  { id: 'investigation', label: 'Investigacao', ability: 'int' },
  { id: 'medicine', label: 'Medicina', ability: 'wis' },
  { id: 'nature', label: 'Natureza', ability: 'int' },
  { id: 'perception', label: 'Percepcao', ability: 'wis' },
  { id: 'performance', label: 'Performance', ability: 'cha' },
  { id: 'persuasion', label: 'Persuasao', ability: 'cha' },
  { id: 'religion', label: 'Religiao', ability: 'int' },
  { id: 'sleight_of_hand', label: 'Prestidigitacao', ability: 'dex' },
  { id: 'stealth', label: 'Furtividade', ability: 'dex' },
  { id: 'survival', label: 'Sobrevivencia', ability: 'wis' },
] as const

const IDENTITY_FIELDS = ['class_name', 'ancestry', 'background', 'alignment', 'level', 'proficiency_bonus', 'experience']
const COMBAT_FIELDS = ['hp', 'max_hp', 'temp_hp', 'ac', 'speed', 'hit_dice', 'initiative_bonus']

function sectionName(value: unknown) {
  return String(value || 'Basico').trim() || 'Basico'
}

function defaultDataFor(actorType: ApiSystemActorType): ActorData {
  return actorType.fields.reduce<ActorData>((data, field) => {
    data[field.id] = field.default_value
    return data
  }, {})
}

function actorDataFor(actor: ApiActor, actorType: ApiSystemActorType): ActorData {
  return {
    ...defaultDataFor(actorType),
    level: actor.level ?? 1,
    hp: actor.hp ?? 10,
    max_hp: actor.max_hp ?? 10,
    ac: actor.ac ?? 10,
    ancestry: actor.ancestry ?? '',
    class_name: actor.class_name ?? '',
    notes: actor.notes ?? '',
    ...(actor.data || {}),
  }
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function asBoolean(value: unknown) {
  return value === true || value === 'true' || value === '1' || value === 1
}

function abilityModifier(score: unknown) {
  return Math.floor((asNumber(score, 10) - 10) / 2)
}

function formatModifier(modifier: number) {
  return modifier >= 0 ? `+${modifier}` : String(modifier)
}

function formulaFor(modifier: number) {
  return `1d20${modifier >= 0 ? '+' : ''}${modifier}`
}

function normalizeByType(type: SystemFieldType, value: string | number | boolean) {
  if (type === 'number') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (type === 'checkbox') return Boolean(value)
  return String(value ?? '')
}

function hasUsableValue(value: unknown) {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

export default function ActorSheetWindow({ actor, system, onClose, onSave, onRoll }: ActorSheetWindowProps) {
  const actorTypes = system?.actor_types?.length ? system.actor_types : [FALLBACK_ACTOR_TYPE]
  const actorType = actorTypes.find(type => type.id === actor.type) ?? actorTypes[0]
  const fieldMap = useMemo(
    () => new Map<string, ApiSystemField>(actorType.fields.map(field => [field.id, field])),
    [actorType.fields],
  )
  const sections = useMemo(() => {
    const groups = new Map<string, ApiSystemField[]>()

    for (const field of actorType.fields) {
      const key = sectionName(field.section)
      groups.set(key, [...(groups.get(key) || []), field])
    }

    return Array.from(groups.entries())
      .map(([section, fields]) => ({ section, fields }))
      .sort((a, b) => {
        const aKey = normalizedSectionKey(a.section)
        const bKey = normalizedSectionKey(b.section)
        const aIndex = SECTION_ORDER.findIndex(section => normalizedSectionKey(section) === aKey)
        const bIndex = SECTION_ORDER.findIndex(section => normalizedSectionKey(section) === bKey)
        if (aIndex === -1 && bIndex === -1) return a.section.localeCompare(b.section)
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })
  }, [actorType.fields])

  const [mode, setMode] = useState<SheetMode>('active')
  const [activeTab, setActiveTab] = useState('')
  const [name, setName] = useState(actor.name)
  const [values, setValues] = useState<ActorData>(() => actorDataFor(actor, actorType))
  const [position, setPosition] = useState<WindowPoint | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; base: WindowPoint } | null>(null)
  const formId = `actor-sheet-form-${actor.id}`

  const activeSection = sections.some(section => section.section === activeTab)
    ? activeTab
    : sections[0]?.section || 'Notas'
  const activeFields = sections.find(section => section.section === activeSection)?.fields || []
  const hp = values.hp
  const maxHp = values.max_hp
  const ac = values.ac
  const level = values.level
  const proficiency = asNumber(values.proficiency_bonus, 2)
  const sheetName = name.trim() || actor.name

  function updateValue(id: string, value: string | number | boolean, fallbackType: SystemFieldType = 'text') {
    const type = fieldMap.get(id)?.type ?? fallbackType
    setValues(prev => ({
      ...prev,
      [id]: normalizeByType(type, value),
    }))
  }

  function textValue(id: string) {
    return String(values[id] ?? '')
  }

  function handleHeaderPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    if (target.closest('button,input,select,textarea')) return

    const rect = event.currentTarget.parentElement?.getBoundingClientRect()
    const base = position ?? { x: rect?.left ?? 160, y: rect?.top ?? 80 }
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      base,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
  }

  function handleHeaderPointerMove(event: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const nextX = drag.base.x + event.clientX - drag.startX
    const nextY = drag.base.y + event.clientY - drag.startY
    setPosition({
      x: Math.max(52, Math.min(window.innerWidth - 260, nextX)),
      y: Math.max(32, Math.min(window.innerHeight - 160, nextY)),
    })
  }

  function handleHeaderPointerUp(event: PointerEvent<HTMLElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    setIsDragging(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) {
      setError('A ficha precisa ter um nome.')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      await onSave(actor.id, {
        name: name.trim(),
        type: actorType.id,
        data: values,
      })
      setMode('active')
    } catch {
      setError('Nao consegui salvar essa ficha agora.')
    } finally {
      setIsSaving(false)
    }
  }

  function resolveActorReference(reference: string) {
    const modifierMatch = reference.match(/^([a-z0-9_]+)\.mod$/i)
    if (modifierMatch) return abilityModifier(values[modifierMatch[1]])
    return asNumber(values[reference], 0)
  }

  function resolveRollFormula(formula: string) {
    return String(formula || '1d20')
      .replace(/@([a-z0-9_]+(?:\.mod)?)/gi, (_match, reference: string) => String(resolveActorReference(reference)))
      .replace(/\s+/g, '')
  }

  function rollFormula(label: string, formula: string) {
    const resolvedFormula = resolveRollFormula(formula)
    void onRoll({
      speaker: sheetName,
      label,
      formula: resolvedFormula,
    })
  }

  function abilityRoll(abilityId: string, abilityLabel: string) {
    rollFormula(abilityLabel, formulaFor(abilityModifier(values[abilityId])))
  }

  function saveModifier(abilityId: string) {
    return abilityModifier(values[abilityId]) + (asBoolean(values[`save_${abilityId}_prof`]) ? proficiency : 0)
  }

  function skillModifier(skillId: string, abilityId: string) {
    return abilityModifier(values[abilityId]) + (asBoolean(values[`skill_${skillId}_prof`]) ? proficiency : 0)
  }

  function rollSave(abilityId: string, abilityLabel: string) {
    rollFormula(`Salvaguarda: ${abilityLabel}`, formulaFor(saveModifier(abilityId)))
  }

  function rollSkill(skillId: string, skillLabel: string, abilityId: string) {
    rollFormula(`Pericia: ${skillLabel}`, formulaFor(skillModifier(skillId, abilityId)))
  }

  function renderTextLine(id: string, label: string, visibleIds: Set<string>) {
    if (!visibleIds.has(id)) return null
    const field = fieldMap.get(id)
    const fieldLabel = field?.label || label

    if (mode === 'edit') {
      return (
        <label className={styles.inlineEditRow} key={id}>
          <strong>{fieldLabel}</strong>
          <input value={textValue(id)} onChange={event => updateValue(id, event.target.value)} />
        </label>
      )
    }

    return (
      <p key={id}>
        <strong>{fieldLabel}</strong>
        <span>{String(values[id] || '-')}</span>
      </p>
    )
  }

  function renderNumberLine(id: string, label: string, visibleIds: Set<string>) {
    if (!visibleIds.has(id)) return null
    const field = fieldMap.get(id)
    const fieldLabel = field?.label || label

    if (mode === 'edit') {
      return (
        <label className={styles.inlineEditRow} key={id}>
          <strong>{fieldLabel}</strong>
          <input type="number" value={String(values[id] ?? 0)} onChange={event => updateValue(id, event.target.value, 'number')} />
        </label>
      )
    }

    return (
      <p key={id}>
        <strong>{fieldLabel}</strong>
        <span>{String(values[id] ?? '-')}</span>
      </p>
    )
  }

  function renderEditField(field: ApiSystemField) {
    const value = values[field.id] ?? field.default_value

    if (field.type === 'checkbox') {
      return (
        <label className={`${styles.fieldRow} ${styles.checkboxField}`} key={field.id}>
          <span>{field.label}</span>
          <input
            type="checkbox"
            checked={asBoolean(value)}
            onChange={event => updateValue(field.id, event.target.checked, field.type)}
          />
        </label>
      )
    }

    if (field.type === 'textarea') {
      return (
        <label className={`${styles.fieldRow} ${styles.fieldRowWide}`} key={field.id}>
          <span>{field.label}</span>
          <textarea value={String(value ?? '')} onChange={event => updateValue(field.id, event.target.value, field.type)} />
        </label>
      )
    }

    return (
      <label className={styles.fieldRow} key={field.id}>
        <span>{field.label}</span>
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={String(value ?? '')}
          onChange={event => updateValue(field.id, event.target.value, field.type)}
        />
      </label>
    )
  }

  function renderActiveField(field: ApiSystemField) {
    const value = values[field.id] ?? field.default_value
    const fieldFormula = String(field.roll_formula || '').trim()
    const formulaValue = field.id.endsWith('_formula') || field.id === 'damage_formula' ? String(value || '').trim() : ''
    const rollTarget = fieldFormula || formulaValue

    if (rollTarget && mode === 'active') {
      return (
        <button className={`${styles.fieldDisplay} ${styles.rollableField}`} key={field.id} type="button" onClick={() => rollFormula(field.label, rollTarget)}>
          <span>{field.label}</span>
          <strong>{hasUsableValue(value) ? String(value) : resolveRollFormula(rollTarget)}</strong>
          <small>{resolveRollFormula(rollTarget)}</small>
        </button>
      )
    }

    return (
      <div className={styles.fieldDisplay} key={field.id}>
        <span>{field.label}</span>
        <strong>{field.type === 'checkbox' ? (asBoolean(value) ? 'Sim' : 'Nao') : hasUsableValue(value) ? String(value) : '-'}</strong>
      </div>
    )
  }

  function renderGenericFields(fields: ApiSystemField[], consumedIds: string[] = []) {
    const consumed = new Set(consumedIds)
    const visibleFields = fields.filter(field => !consumed.has(field.id))
    if (visibleFields.length === 0) return null

    return (
      <div className={styles.fieldGrid}>
        {visibleFields.map(field => (mode === 'edit' ? renderEditField(field) : renderActiveField(field)))}
      </div>
    )
  }

  function renderIdentity(fields: ApiSystemField[]) {
    const visibleIds = new Set(fields.map(field => field.id))
    const consumed = IDENTITY_FIELDS.filter(id => visibleIds.has(id))

    return (
      <>
        <div className={styles.traitList}>
          {renderTextLine('class_name', 'Classe', visibleIds)}
          {renderTextLine('ancestry', 'Ancestralidade', visibleIds)}
          {renderTextLine('background', 'Antecedente', visibleIds)}
          {renderTextLine('alignment', 'Tendencia', visibleIds)}
          {renderNumberLine('level', 'Nivel', visibleIds)}
          {renderNumberLine('proficiency_bonus', 'Proficiencia', visibleIds)}
          {renderNumberLine('experience', 'Experiencia', visibleIds)}
        </div>
        {renderGenericFields(fields, consumed)}
      </>
    )
  }

  function renderCombat(fields: ApiSystemField[]) {
    const visibleIds = new Set(fields.map(field => field.id))
    const consumed = COMBAT_FIELDS.filter(id => visibleIds.has(id))

    return (
      <>
        <div className={styles.traitList}>
          {renderNumberLine('hp', 'PV atual', visibleIds)}
          {renderNumberLine('max_hp', 'PV maximo', visibleIds)}
          {renderNumberLine('temp_hp', 'PV temporario', visibleIds)}
          {renderNumberLine('ac', 'CA', visibleIds)}
          {renderNumberLine('speed', 'Deslocamento', visibleIds)}
          {renderTextLine('hit_dice', 'Dados de vida', visibleIds)}
        </div>
        {renderGenericFields(fields, consumed)}
      </>
    )
  }

  function renderAbilities(fields: ApiSystemField[]) {
    const visibleIds = new Set(fields.map(field => field.id))
    const visibleAbilities = ABILITIES.filter(ability => visibleIds.has(ability.id))
    if (visibleAbilities.length === 0) return renderGenericFields(fields)

    return (
      <>
        <div className={styles.abilityGrid}>
          {visibleAbilities.map(ability => {
            const score = asNumber(values[ability.id], 10)
            const modifier = abilityModifier(score)

            if (mode === 'edit') {
              return (
                <label key={ability.id} className={`${styles.abilityCard} ${styles.abilityCardEdit}`}>
                  <span>{ability.short}</span>
                  <input
                    type="number"
                    value={String(score)}
                    onChange={event => updateValue(ability.id, event.target.value, 'number')}
                  />
                  <small>{formatModifier(modifier)}</small>
                </label>
              )
            }

            return (
              <button
                key={ability.id}
                className={styles.abilityCard}
                type="button"
                onClick={() => abilityRoll(ability.id, ability.label)}
                title={`Rolar ${ability.label}`}
              >
                <span>{ability.short}</span>
                <strong>{formatModifier(modifier)}</strong>
                <small>{score}</small>
              </button>
            )
          })}
        </div>
        {renderGenericFields(fields, visibleAbilities.map(ability => ability.id))}
      </>
    )
  }

  function renderSaves(fields: ApiSystemField[]) {
    const visibleIds = new Set(fields.map(field => field.id))
    const visibleSaves = ABILITIES.filter(ability => visibleIds.has(`save_${ability.id}_prof`))
    if (visibleSaves.length === 0) return renderGenericFields(fields)

    return (
      <>
        <div className={styles.rollList}>
          {visibleSaves.map(ability => {
            const fieldId = `save_${ability.id}_prof`
            const modifier = saveModifier(ability.id)
            const proficient = asBoolean(values[fieldId])

            if (mode === 'edit') {
              return (
                <label key={ability.id} className={`${styles.rollRow} ${styles.rollRowEdit}`}>
                  <span>{ability.label}</span>
                  <input
                    type="checkbox"
                    checked={proficient}
                    onChange={event => updateValue(fieldId, event.target.checked, 'checkbox')}
                  />
                  <em>prof</em>
                  <strong>{formatModifier(modifier)}</strong>
                </label>
              )
            }

            return (
              <button
                key={ability.id}
                className={styles.rollRow}
                type="button"
                onClick={() => rollSave(ability.id, ability.label)}
              >
                <span>{ability.label}</span>
                {proficient && <em>prof</em>}
                <strong>{formatModifier(modifier)}</strong>
              </button>
            )
          })}
        </div>
        {renderGenericFields(fields, visibleSaves.map(ability => `save_${ability.id}_prof`))}
      </>
    )
  }

  function renderSkills(fields: ApiSystemField[]) {
    const visibleIds = new Set(fields.map(field => field.id))
    const visibleSkills = SKILLS.filter(skill => visibleIds.has(`skill_${skill.id}_prof`))
    if (visibleSkills.length === 0) return renderGenericFields(fields)

    return (
      <>
        <div className={styles.rollList}>
          {visibleSkills.map(skill => {
            const fieldId = `skill_${skill.id}_prof`
            const modifier = skillModifier(skill.id, skill.ability)
            const proficient = asBoolean(values[fieldId])

            if (mode === 'edit') {
              return (
                <label key={skill.id} className={`${styles.rollRow} ${styles.rollRowEdit}`}>
                  <span>{skill.label}</span>
                  <input
                    type="checkbox"
                    checked={proficient}
                    onChange={event => updateValue(fieldId, event.target.checked, 'checkbox')}
                  />
                  <small>{skill.ability.toUpperCase()}</small>
                  <strong>{formatModifier(modifier)}</strong>
                </label>
              )
            }

            return (
              <button
                key={skill.id}
                className={styles.rollRow}
                type="button"
                onClick={() => rollSkill(skill.id, skill.label, skill.ability)}
              >
                <span>{skill.label}</span>
                {proficient && <em>prof</em>}
                <small>{skill.ability.toUpperCase()}</small>
                <strong>{formatModifier(modifier)}</strong>
              </button>
            )
          })}
        </div>
        {renderGenericFields(fields, visibleSkills.map(skill => `skill_${skill.id}_prof`))}
      </>
    )
  }

  function renderSection() {
    const sectionKey = normalizedSectionKey(activeSection)
    if (activeFields.length === 0) {
      return <p className={styles.emptySection}>Essa aba ainda nao tem campos no sistema.</p>
    }

    if (sectionKey === 'identidade') return renderIdentity(activeFields)
    if (sectionKey === 'combate') return renderCombat(activeFields)
    if (sectionKey === 'atributos') return renderAbilities(activeFields)
    if (sectionKey === 'salvaguardas') return renderSaves(activeFields)
    if (sectionKey === 'pericias') return renderSkills(activeFields)
    return renderGenericFields(activeFields)
  }

  return (
    <section
      className={`${styles.window} ${isDragging ? styles.windowDragging : ''}`}
      style={position ? { left: position.x, top: position.y } : undefined}
      aria-label={`Ficha de ${actor.name}`}
    >
      <header
        className={styles.header}
        onPointerDown={handleHeaderPointerDown}
        onPointerMove={handleHeaderPointerMove}
        onPointerUp={handleHeaderPointerUp}
        onPointerCancel={handleHeaderPointerUp}
      >
        <div className={styles.identity}>
          <span className={styles.eyebrow}>{actorType.label}</span>
          {mode === 'edit' ? (
            <input
              className={styles.nameInput}
              value={name}
              onChange={event => setName(event.target.value)}
              aria-label="Nome da ficha"
            />
          ) : (
            <h2 className={styles.nameDisplay}>{sheetName}</h2>
          )}
          <div className={styles.metaRow}>
            <span className={styles.metaPill}>{system?.name || 'Sistema local'}</span>
            {level !== undefined && <span className={styles.metaPill}>Nivel {String(level)}</span>}
            {hp !== undefined && <span className={styles.metaPill}>PV {String(hp)} / {String(maxHp ?? '?')}</span>}
            {ac !== undefined && <span className={styles.metaPill}>CA {String(ac)}</span>}
          </div>
        </div>

        <div className={styles.windowActions}>
          <div className={styles.modeSwitch} role="group" aria-label="Modo da ficha">
            <button className={mode === 'active' ? styles.modeActive : ''} type="button" onClick={() => setMode('active')}>
              Ativo
            </button>
            <button className={mode === 'edit' ? styles.modeActive : ''} type="button" onClick={() => setMode('edit')}>
              Editar
            </button>
          </div>
          <button className={styles.iconButton} type="button" onClick={onClose} title="Fechar ficha">
            x
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.summary}>
          <div className={styles.portrait}>{actor.name.slice(0, 1).toUpperCase() || '?'}</div>
          <div className={styles.statGrid}>
            <div className={styles.statBox}>
              <strong>{String(ac ?? '-')}</strong>
              <span>CA</span>
            </div>
            <div className={styles.statBox}>
              <strong>{String(level ?? '-')}</strong>
              <span>Nivel</span>
            </div>
            <div className={styles.statBox}>
              <strong>{String(hp ?? '-')}</strong>
              <span>PV</span>
            </div>
            <div className={styles.statBox}>
              <strong>{String(maxHp ?? '-')}</strong>
              <span>Max</span>
            </div>
          </div>
          <nav className={styles.sheetTabs} aria-label="Abas da ficha">
            {sections.map(section => (
              <button
                className={section.section === activeSection ? styles.sheetTabActive : ''}
                key={section.section}
                onClick={() => setActiveTab(section.section)}
                type="button"
              >
                <span>{section.section}</span>
                <small>{section.fields.length}</small>
              </button>
            ))}
          </nav>
        </aside>

        <form id={formId} className={styles.activeSheet} onSubmit={handleSubmit}>
          <section className={styles.activeSection}>
            <div className={styles.sectionHeading}>
              <div>
                <span>{mode === 'edit' ? 'Modo editavel' : 'Modo ativo'}</span>
                <h3>{activeSection}</h3>
              </div>
              <p>{activeFields.length} campos do sistema</p>
            </div>
            {renderSection()}
          </section>

          {error && <p className={styles.error}>{error}</p>}
        </form>
      </div>

      <footer className={styles.footer}>
        <button className={styles.secondaryBtn} type="button" onClick={onClose} disabled={isSaving}>
          Fechar
        </button>
        {mode === 'edit' && (
          <button className={styles.primaryBtn} type="submit" form={formId} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar ficha'}
          </button>
        )}
      </footer>
    </section>
  )
}
