import { useState, type FormEvent } from 'react'
import type { ApiActor, ApiGameSystem, ApiSystemActorType, CreateActorPayload } from '../services/vttApi'
import styles from './ActorCreateDialog.module.css'

type ActorData = Record<string, string | number | boolean>

interface ActorCreateDialogProps {
  system: ApiGameSystem | null
  onClose: () => void
  onCreateActor: (payload: CreateActorPayload) => Promise<ApiActor>
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

export default function ActorCreateDialog({ system, onClose, onCreateActor }: ActorCreateDialogProps) {
  const actorTypes = system?.actor_types?.length ? system.actor_types : [FALLBACK_ACTOR_TYPE]
  const [actorTypeId, setActorTypeId] = useState(actorTypes[0].id)
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const actorType = actorTypes.find(type => type.id === actorTypeId) ?? actorTypes[0]

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const actorName = name.trim()
    if (!actorName) {
      setError('Informe o nome da ficha.')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      await onCreateActor({
        name: actorName,
        type: actorType.id,
        data: defaultDataFor(actorType),
      })
      onClose()
    } catch {
      setError('Nao consegui criar essa ficha agora.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onMouseDown={() => !isSaving && onClose()}>
      <form className={styles.dialog} onSubmit={handleSubmit} onMouseDown={event => event.stopPropagation()}>
        <div className={styles.header}>
          <strong>Criar ficha</strong>
          <button className={styles.closeBtn} type="button" onClick={onClose} disabled={isSaving}>
            x
          </button>
        </div>

        <div className={styles.body}>
          <label className={styles.formRow}>
            <span>Nome</span>
            <input
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="Nome do personagem"
              autoFocus
            />
          </label>

          {actorTypes.length > 1 && (
            <label className={styles.formRow}>
              <span>Tipo</span>
              <select value={actorType.id} onChange={event => setActorTypeId(event.target.value)}>
                {actorTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </label>
          )}

          <p className={styles.hint}>
            Os dados da ficha sao editados depois, ao abrir o documento.
          </p>

          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.footer}>
          <button className={styles.secondaryBtn} type="button" onClick={onClose} disabled={isSaving}>
            Cancelar
          </button>
          <button className={styles.primaryBtn} type="submit" disabled={isSaving}>
            {isSaving ? 'Criando...' : 'Criar'}
          </button>
        </div>
      </form>
    </div>
  )
}
