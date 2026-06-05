import { useMemo, useState, type FormEvent } from 'react'
import type { ApiActor, CreateActorPayload } from '../services/vttApi'
import styles from './ActorsPanel.module.css'

interface ActorsPanelProps {
  isOpen: boolean
  isExiting?: boolean
  actors: ApiActor[]
  onCreateActor: (payload: CreateActorPayload) => Promise<ApiActor>
}

export default function ActorsPanel({
  isOpen,
  isExiting,
  actors,
  onCreateActor,
}: ActorsPanelProps) {
  const orderedActors = useMemo(
    () => [...actors].sort((a, b) => a.name.localeCompare(b.name)),
    [actors],
  )
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const panelClass = [
    styles.panel,
    isOpen ? styles.panelOpen : '',
    isExiting ? styles.panelExiting : '',
  ].join(' ')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const actorName = name.trim()

    if (!actorName) {
      setError('Informe o nome do personagem.')
      return
    }

    const payload: CreateActorPayload = {
      name: actorName,
      type: 'personagem',
    }

    setIsSaving(true)
    setError(null)
    try {
      await onCreateActor(payload)
      setName('')
    } catch {
      setError('Nao consegui criar esse personagem agora.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <aside id="actors-panel" className={panelClass} aria-hidden={!isOpen}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>Personagens</span>
          <strong>Personagens do mundo</strong>
        </div>
        <span className={styles.counter}>{actors.length}</span>
      </div>

      <form className={styles.createBox} onSubmit={handleSubmit}>
        <span className={styles.sectionTitle}>Criar personagem</span>

        <label className={styles.formRow}>
          <span>Nome</span>
          <input
            name="name"
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="Nome do personagem"
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.primaryBtn} type="submit" disabled={isSaving}>
          {isSaving ? 'Criando...' : 'Criar personagem'}
        </button>
      </form>

      <div className={styles.actorList}>
        {orderedActors.length === 0 && (
          <div className={styles.emptyState}>
            <strong>Nenhum personagem criado.</strong>
            <span>Quando criar um personagem, ele aparece aqui.</span>
          </div>
        )}

        {orderedActors.map(actor => (
          <div key={actor.id} className={styles.actorCard}>
            <span className={styles.actorInitial}>{actor.name.slice(0, 1).toUpperCase() || '?'}</span>
            <strong>{actor.name}</strong>
          </div>
        ))}
      </div>
    </aside>
  )
}
