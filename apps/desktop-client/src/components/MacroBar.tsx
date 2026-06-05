import styles from './MacroBar.module.css'

export interface MacroAction {
  slot: number
  label: string
  icon: string
  formula?: string
  description: string
}

const MACROS: MacroAction[] = [
  { slot: 1, label: 'Ataque', icon: 'ATK', formula: '1d20+6', description: 'Ataque principal' },
  { slot: 2, label: 'Dano', icon: 'DMG', formula: '1d8+4', description: 'Dano da arma equipada' },
  { slot: 3, label: 'Percepcao', icon: 'PER', formula: '1d20+3', description: 'Teste de percepcao' },
  { slot: 4, label: 'Cura', icon: 'CUR', formula: '2d4+2', description: 'Pocao de cura' },
  { slot: 5, label: 'Iniciativa', icon: 'INI', formula: '1d20+2', description: 'Rolagem de iniciativa' },
  { slot: 6, label: 'Luz', icon: 'LUZ', description: 'Marca luz ativa na cena' },
  { slot: 7, label: 'Medir', icon: 'MED', description: 'Prepara ferramenta de medicao' },
  { slot: 8, label: 'Descanso', icon: 'DES', description: 'Registra descanso curto' },
  { slot: 9, label: 'Fim turno', icon: 'FIM', description: 'Passa a vez no combate' },
  { slot: 0, label: 'Livre', icon: '...', description: 'Macro vazia para configurar depois' },
]

export default function MacroBar({ onMacroRun }: { onMacroRun?: (macro: MacroAction) => void }) {
  return (
    <div className={styles.bar} id="macro-bar" aria-label="Barra de macros">
      {MACROS.map(macro => (
        <button
          key={macro.slot}
          className={styles.slot}
          title={`${macro.label}: ${macro.description}`}
          type="button"
          onClick={() => onMacroRun?.(macro)}
        >
          <span className={styles.slotNum}>{macro.slot}</span>
          <span className={styles.slotIcon}>{macro.icon}</span>
        </button>
      ))}
      <button className={styles.collapseBtn} title="Recolher" type="button">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="14"
          height="14"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )
}
