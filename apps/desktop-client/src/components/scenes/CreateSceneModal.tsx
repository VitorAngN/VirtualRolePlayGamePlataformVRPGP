import { useState } from 'react'
import styles from '../ScenesPanel.module.css'

interface Props {
  onClose: () => void
  onCreate: (name: string) => void
}

export default function CreateSceneModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('')

  function submit() {
    const trimmedName = name.trim()
    if (trimmedName) onCreate(trimmedName)
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={event => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Criar cena</span>
          <button className={styles.modalClose} onClick={onClose} type="button">x</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Nome</label>
            <input
              className={styles.formInput}
              placeholder="Ex: Mapa inicial"
              value={name}
              autoFocus
              onChange={event => setName(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') submit()
              }}
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.secondaryBtn} type="button" onClick={onClose}>
            Cancelar
          </button>
          <button
            className={styles.primaryBtn}
            type="button"
            disabled={!name.trim()}
            onClick={submit}
          >
            Criar cena
          </button>
        </div>
      </div>
    </div>
  )
}
