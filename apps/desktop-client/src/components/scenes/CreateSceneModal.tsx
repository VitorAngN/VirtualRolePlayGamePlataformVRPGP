import { useState } from 'react'
import styles from '../ScenesPanel.module.css'

interface Props {
  onClose: () => void
  onCreate: (name: string) => void
}

export default function CreateSceneModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('')

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Create Scene</span>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Name</label>
            <input
              className={styles.formInput}
              placeholder="Name"
              value={name}
              autoFocus
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && onCreate(name.trim())}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Folder</label>
            <select className={styles.formSelect}>
              <option value="">— Root —</option>
              <option>MAPAS GERAIS DE FAERUN 2</option>
              <option>Mapas das aventuras...</option>
            </select>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button
            className={styles.primaryBtn}
            disabled={!name.trim()}
            onClick={() => name.trim() && onCreate(name.trim())}
          >
            ✔ Create Scene
          </button>
        </div>
      </div>
    </div>
  )
}
