import { useMemo } from 'react'
import type {
  ApiActor,
  ApiGameSystem,
  ApiSystemActorType,
} from '../services/vttApi'
import styles from './ActorsPanel.module.css'

type ActorData = Record<string, string | number | boolean>

interface ActorsPanelProps {
  isOpen: boolean
  isExiting?: boolean
  actors: ApiActor[]
  system: ApiGameSystem | null
  onRequestCreateActor: () => void
  onOpenActor: (actorId: string) => void
  onCreateMobileSession: (actor: ApiActor) => void
}

const FALLBACK_ACTOR_TYPE: ApiSystemActorType = {
  id: 'personagem',
  label: 'Personagem',
  fields: [
    { id: 'notes', label: 'Notas', type: 'textarea', section: 'Notas', default_value: '' },
  ],
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

function actorTypeLabel(actorTypes: ApiSystemActorType[], typeId: string) {
  return actorTypes.find(type => type.id === typeId)?.label || typeId
}

export default function ActorsPanel({
  isOpen,
  isExiting,
  actors,
  system,
  onRequestCreateActor,
  onOpenActor,
  onCreateMobileSession,
}: ActorsPanelProps) {
  const actorTypes = system?.actor_types?.length ? system.actor_types : [FALLBACK_ACTOR_TYPE]

  const orderedActors = useMemo(
    () => [...actors].sort((a, b) => a.name.localeCompare(b.name)),
    [actors],
  )

  const panelClass = [
    styles.panel,
    isOpen ? styles.panelOpen : '',
    isExiting ? styles.panelExiting : '',
  ].join(' ')

  return (
    <aside id="actors-panel" className={panelClass} aria-hidden={!isOpen}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>Atores</span>
          <strong>{system?.name || 'Sistema do mundo'}</strong>
        </div>
        <span className={styles.counter}>{actors.length}</span>
      </div>

      <div className={styles.createBox}>
        <span className={styles.sectionTitle}>Criar ficha</span>
        <button className={styles.primaryBtn} type="button" onClick={onRequestCreateActor}>
          Criar ficha
        </button>
      </div>

      <div className={styles.actorList}>
        {orderedActors.length === 0 && (
          <div className={styles.emptyState}>
            <strong>Nenhuma ficha criada.</strong>
            <span>As fichas usam os campos definidos pelo sistema deste mundo.</span>
          </div>
        )}

        {orderedActors.map(actor => {
          const actorType = actorTypes.find(type => type.id === actor.type) ?? actorTypes[0]
          const actorData = actorDataFor(actor, actorType)

          return (
            <article
              key={actor.id}
              className={`${styles.actorCard} ${styles.actorCardDraggable}`}
              draggable
              onDragStart={event => {
                event.dataTransfer.effectAllowed = 'copy'
                event.dataTransfer.setData('application/x-vtt-actor-id', actor.id)
                event.dataTransfer.setData('text/plain', actor.name)
              }}
            >
              <button
                className={styles.actorMain}
                type="button"
                onClick={() => onOpenActor(actor.id)}
              >
                <span className={styles.actorInitial}>{actor.name.slice(0, 1).toUpperCase() || '?'}</span>
                <span className={styles.actorInfo}>
                  <strong>{actor.name}</strong>
                  <span>
                    {actorTypeLabel(actorTypes, actor.type)}
                    {actorData.hp !== undefined ? ` - PV ${actorData.hp}/${actorData.max_hp ?? '?'}` : ''}
                    {actorData.ac !== undefined ? ` - CA ${actorData.ac}` : ''}
                  </span>
                </span>
              </button>
              <button
                className={styles.actorActionBtn}
                type="button"
                onClick={() => onCreateMobileSession(actor)}
              >
                Celular
              </button>
            </article>
          )
        })}
      </div>
    </aside>
  )
}
