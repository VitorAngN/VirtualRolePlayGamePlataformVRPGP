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

export default function ActorSheetWindow({ actor, system, onClose, onSave, onRoll }: ActorSheetWindowProps) {
  const actorTypes = system?.actor_types?.length ? system.actor_types : [FALLBACK_ACTOR_TYPE]
  const actorType = actorTypes.find(type => type.id === actor.type) ?? actorTypes[0]
  const fieldMap = useMemo(
    () => new Map<string, ApiSystemField>(actorType.fields.map(field => [field.id, field])),
    [actorType.fields],
  )
  const [mode, setMode] = useState<'active' | 'edit'>('active')
  const [name, setName] = useState(actor.name)
  const [values, setValues] = useState<ActorData>(() => actorDataFor(actor, actorType))
  const [position, setPosition] = useState<WindowPoint | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; base: WindowPoint } | null>(null)
  const formId = `actor-sheet-form-${actor.id}`

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
    } catch {
      setError('Nao consegui salvar essa ficha agora.')
    } finally {
      setIsSaving(false)
    }
  }

  function abilityRoll(abilityId: string, abilityLabel: string) {
    const modifier = abilityModifier(values[abilityId])
    void onRoll({
      speaker: sheetName,
      label: abilityLabel,
      formula: formulaFor(modifier),
    })
  }

  function saveModifier(abilityId: string) {
    return abilityModifier(values[abilityId]) + (asBoolean(values[`save_${abilityId}_prof`]) ? proficiency : 0)
  }

  function skillModifier(skillId: string, abilityId: string) {
    return abilityModifier(values[abilityId]) + (asBoolean(values[`skill_${skillId}_prof`]) ? proficiency : 0)
  }

  function rollSave(abilityId: string, abilityLabel: string) {
    const modifier = saveModifier(abilityId)
    void onRoll({
      speaker: sheetName,
      label: `Salvaguarda: ${abilityLabel}`,
      formula: formulaFor(modifier),
    })
  }

  function rollSkill(skillId: string, skillLabel: string, abilityId: string) {
    const modifier = skillModifier(skillId, abilityId)
    void onRoll({
      speaker: sheetName,
      label: `Pericia: ${skillLabel}`,
      formula: formulaFor(modifier),
    })
  }

  function renderInfoLine(id: string, label: string) {
    if (mode === 'edit') {
      return (
        <label className={styles.inlineEditRow}>
          <strong>{label}</strong>
          <input value={textValue(id)} onChange={event => updateValue(id, event.target.value)} />
        </label>
      )
    }

    return (
      <p>
        <strong>{label}</strong>
        <span>{String(values[id] || '-')}</span>
      </p>
    )
  }

  function renderNumberLine(id: string, label: string) {
    if (mode === 'edit') {
      return (
        <label className={styles.inlineEditRow}>
          <strong>{label}</strong>
          <input type="number" value={String(values[id] ?? 0)} onChange={event => updateValue(id, event.target.value, 'number')} />
        </label>
      )
    }

    return (
      <p>
        <strong>{label}</strong>
        <span>{String(values[id] ?? '-')}</span>
      </p>
    )
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
        </aside>

        <form id={formId} className={styles.activeSheet} onSubmit={handleSubmit}>
          <section className={styles.activeSection}>
            <h3>Identidade</h3>
            <div className={styles.traitList}>
              {renderInfoLine('class_name', 'Classe')}
              {renderInfoLine('ancestry', 'Ancestralidade')}
              {renderInfoLine('background', 'Antecedente')}
              {renderNumberLine('level', 'Nivel')}
              {renderNumberLine('proficiency_bonus', 'Proficiencia')}
            </div>
          </section>

          <section className={styles.activeSection}>
            <h3>Combate</h3>
            <div className={styles.traitList}>
              {renderNumberLine('hp', 'PV atual')}
              {renderNumberLine('max_hp', 'PV maximo')}
              {renderNumberLine('temp_hp', 'PV temporario')}
              {renderNumberLine('ac', 'CA')}
              {renderNumberLine('speed', 'Deslocamento')}
            </div>
          </section>

          <section className={styles.activeSection}>
            <h3>Atributos</h3>
            <div className={styles.abilityGrid}>
              {ABILITIES.map(ability => {
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
          </section>

          <section className={styles.activeSection}>
            <h3>Salvaguardas</h3>
            <div className={styles.rollList}>
              {ABILITIES.map(ability => {
                const modifier = saveModifier(ability.id)
                const proficient = asBoolean(values[`save_${ability.id}_prof`])

                if (mode === 'edit') {
                  return (
                    <label key={ability.id} className={`${styles.rollRow} ${styles.rollRowEdit}`}>
                      <span>{ability.label}</span>
                      <input
                        type="checkbox"
                        checked={proficient}
                        onChange={event => updateValue(`save_${ability.id}_prof`, event.target.checked, 'checkbox')}
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
          </section>

          <section className={styles.activeSection}>
            <h3>Pericias</h3>
            <div className={styles.rollList}>
              {SKILLS.map(skill => {
                const modifier = skillModifier(skill.id, skill.ability)
                const proficient = asBoolean(values[`skill_${skill.id}_prof`])

                if (mode === 'edit') {
                  return (
                    <label key={skill.id} className={`${styles.rollRow} ${styles.rollRowEdit}`}>
                      <span>{skill.label}</span>
                      <input
                        type="checkbox"
                        checked={proficient}
                        onChange={event => updateValue(`skill_${skill.id}_prof`, event.target.checked, 'checkbox')}
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
          </section>

          <section className={styles.activeSection}>
            <h3>Tracos</h3>
            <div className={styles.traitList}>
              {renderInfoLine('senses', 'Sentidos')}
              {renderInfoLine('languages', 'Idiomas')}
              {renderInfoLine('resistances', 'Resistencias')}
            </div>
          </section>

          <section className={styles.activeSection}>
            <h3>Notas</h3>
            {mode === 'edit' ? (
              <textarea
                className={styles.notesEditor}
                value={textValue('notes')}
                onChange={event => updateValue('notes', event.target.value, 'textarea')}
                rows={5}
              />
            ) : (
              <p className={styles.notesText}>{String(values.notes || '-')}</p>
            )}
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
