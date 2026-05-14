import { useState, useRef, useEffect } from 'react'
import styles from './ChatPanel.module.css'

// ──────────────────────────────────────────────
//  Tipos
// ──────────────────────────────────────────────
interface ChatCard {
  id: string
  speaker: string
  type: 'text' | 'roll' | 'item'
  content: React.ReactNode
  time: string
}

// ──────────────────────────────────────────────
//  Dados iniciais de demo
// ──────────────────────────────────────────────
const INITIAL_MESSAGES: ChatCard[] = [
  {
    id: 'msg-1',
    speaker: 'Gaedrion',
    type: 'item',
    time: '5d 17h atrás',
    content: (
      <>
        <div className={styles.cardTitle}>Death Armor</div>
        <div className={styles.cardSubtitle}>Necromancia 2º nível</div>
        <p className={styles.cardBody}>
          Durante a duração, uma aura negra envolve uma criatura que você toca. O alvo tem{' '}
          <strong>Vantagem em Testes de Morte</strong>…
        </p>
        <div className={styles.cardActions}>
          <button className={styles.cardAction}>⟲ REFUND RESOURCE</button>
          <div className={styles.cardDivider}>◎ TARGETS ◎</div>
        </div>
      </>
    ),
  },
  {
    id: 'msg-2',
    speaker: 'Gaedrion',
    type: 'roll',
    time: '4d 11h atrás',
    content: (
      <>
        <span className={styles.rollFormula}>1d20 + 6 + 4</span>
        <div className={styles.rollResult}>27</div>
      </>
    ),
  },
  {
    id: 'msg-3',
    speaker: 'Teseu',
    type: 'text',
    time: '3h atrás',
    content: (
      <p className={styles.cardBody}>
        Marcador posicionado perto da ponte. Vou preparar a ação para o próximo turno.
      </p>
    ),
  },
  {
    id: 'msg-4',
    speaker: 'Vyneent',
    type: 'roll',
    time: '1h atrás',
    content: (
      <>
        <span className={styles.rollFormula}>(5000 + 1000) / 5</span>
        <div className={styles.rollResult}>2000</div>
      </>
    ),
  },
]

// ──────────────────────────────────────────────
//  Dice config
// ──────────────────────────────────────────────
const DICE = [
  { label: 'd4',  sides: 4,   shape: '▲' },
  { label: 'd6',  sides: 6,   shape: '■' },
  { label: 'd8',  sides: 8,   shape: '◆' },
  { label: 'd10', sides: 10,  shape: '▶' },
  { label: 'd12', sides: 12,  shape: '⬟' },
  { label: 'd20', sides: 20,  shape: '★' },
  { label: 'd%',  sides: 100, shape: '●' },
]

function rollDie(sides: number) {
  return Math.floor(Math.random() * sides) + 1
}

// ──────────────────────────────────────────────
//  Toggle button (exportado para VTT.tsx)
// ──────────────────────────────────────────────
interface ChatToggleProps {
  isOpen: boolean
  onToggle: () => void
}

export function ChatToggleButton({ isOpen, onToggle }: ChatToggleProps) {
  return (
    <button
      id="chat-toggle-btn"
      className={`${styles.toggleBtn} ${isOpen ? styles.toggleBtnOpen : ''}`}
      onClick={onToggle}
      title={isOpen ? 'Fechar chat' : 'Chat de Mensagens'}
      aria-label="Abrir/fechar chat"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" width="18" height="18"
      >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    </button>
  )
}

// ──────────────────────────────────────────────
//  Painel de chat
// ──────────────────────────────────────────────
interface ChatPanelProps {
  isOpen: boolean
  isExiting?: boolean
}

export default function ChatPanel({ isOpen, isExiting }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatCard[]>(INITIAL_MESSAGES)
  const [inputText, setInputText]   = useState('')
  const [rollMode,  setRollMode]    = useState<'public' | 'gm' | 'self'>('public')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const nextMessageId = useRef(0)

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  function handleDiceRoll(die: typeof DICE[0]) {
    const result = rollDie(die.sides)
    const now  = new Date()
    const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`
    nextMessageId.current += 1
    const card: ChatCard = {
      id: `roll-${nextMessageId.current}`,
      speaker: 'Você',
      type: 'roll',
      time,
      content: (
        <>
          <span className={styles.rollFormula}>1{die.label}</span>
          <div className={`${styles.rollResult} ${result === die.sides ? styles.rollCrit : result === 1 ? styles.rollFail : ''}`}>{result}</div>
          {result === die.sides && <div className={styles.rollBadge}>💥 CRÍTICO!</div>}
          {result === 1        && <div className={`${styles.rollBadge} ${styles.rollBadgeFail}`}>💀 FALHA CRÍTICA</div>}
        </>
      ),
    }
    setMessages(prev => [...prev, card])
  }

  function handleSendMessage() {
    if (!inputText.trim()) return
    const now  = new Date()
    const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`
    nextMessageId.current += 1
    setMessages(prev => [...prev, { id: `text-${nextMessageId.current}`, speaker: 'Você', type: 'text', time, content: <p className={styles.cardBody}>{inputText.trim()}</p> }])
    setInputText('')
  }

  const panelClass = [
    styles.panel,
    isOpen    ? styles.panelOpen    : '',
    isExiting ? styles.panelExiting : '',
  ].join(' ')

  return (
    <aside id="chat-panel" className={panelClass} aria-hidden={!isOpen}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>Chat Messages</span>
        {/* Roll mode selector */}
        <div className={styles.rollModeGroup}>
          {(['public', 'gm', 'self'] as const).map(mode => (
            <button
              key={mode}
              title={mode === 'public' ? 'Público' : mode === 'gm' ? 'Só GM' : 'Só você'}
              className={`${styles.rollModeBtn} ${rollMode === mode ? styles.rollModeBtnActive : ''}`}
              onClick={() => setRollMode(mode)}
            >
              {mode === 'public' ? '🌐' : mode === 'gm' ? '👁' : '🔒'}
            </button>
          ))}
        </div>
      </div>

      {/* Mensagens */}
      <div className={styles.messages} role="log" aria-label="Mensagens do chat">
        {messages.map(msg => (
          <div key={msg.id} className={`${styles.card} ${styles[`card_${msg.type}`]}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardAvatar} />
              <span className={styles.cardSpeaker}>{msg.speaker}</span>
              <span className={styles.cardTime}>{msg.time}</span>
            </div>
            <div className={styles.cardContent}>{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Área de input ── */}
      <div className={styles.inputArea}>

        {/* Barra de dados */}
        <div className={styles.diceBar}>
          {DICE.map(die => (
            <button
              key={die.label}
              className={styles.dieBtn}
              title={`Rolar ${die.label}`}
              onClick={() => handleDiceRoll(die)}
            >
              <span className={styles.dieShape}>{die.shape}</span>
              <span className={styles.dieLabel}>{die.label}</span>
            </button>
          ))}
        </div>

        {/* Textarea + enviar */}
        <textarea
          className={styles.textarea}
          placeholder="Enter message…"
          aria-label="Mensagem de chat"
          rows={2}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage()
            }
          }}
        />
        <div className={styles.inputActions}>
          <span className={styles.hintText}>Shift+Enter para nova linha</span>
          <button className={styles.rollBtn} onClick={handleSendMessage}>
            ➤ Enviar
          </button>
        </div>
      </div>
    </aside>
  )
}
