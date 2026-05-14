import styles from './MacroBar.module.css'

const MACROS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]

export default function MacroBar() {
  return (
    <div className={styles.bar} id="macro-bar" aria-label="Barra de macros">
      {MACROS.map(n => (
        <div key={n} className={styles.slot} title={`Macro ${n}`}>
          <span className={styles.slotNum}>{n}</span>
          {n === 1 && <span className={styles.slotIcon}>🗡️</span>}
        </div>
      ))}
      <button className={styles.collapseBtn} title="Recolher">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" width="14" height="14"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )
}
