import { useEffect, useRef, useState, type MouseEvent } from 'react'
import type { ApiChatMessage } from '../services/vttApi'
import styles from './ChatPanel.module.css'

const DICE = [
  { label: 'd4', sides: 4 },
  { label: 'd6', sides: 6 },
  { label: 'd8', sides: 8 },
  { label: 'd10', sides: 10 },
  { label: 'd12', sides: 12 },
  { label: 'd20', sides: 20 },
  { label: 'd100', sides: 100 },
]

interface RollResult {
  formula: string
  result: number
  rolls: number[]
  modifier: number
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

function rollDie(sides: number) {
  return Math.floor(Math.random() * sides) + 1
}

function rollFormula(formula: string): RollResult | null {
  const match = formula.trim().match(/^(\d*)d(\d+)([+-]\d+)?$/i)
  if (!match) return null

  const amount = Number(match[1] || 1)
  const sides = Number(match[2])
  const modifier = Number(match[3] ?? 0)
  if (!Number.isFinite(amount) || !Number.isFinite(sides) || amount < 1 || amount > 100 || sides < 2) return null

  const rolls = Array.from({ length: amount }, () => rollDie(sides))
  const result = rolls.reduce((sum, value) => sum + value, 0) + modifier
  return { formula: `${amount}d${sides}${modifier ? `${modifier > 0 ? '+' : ''}${modifier}` : ''}`, result, rolls, modifier }
}

function formatRollParts(message: ApiChatMessage) {
  const rolls = message.rolls?.length ? message.rolls : []
  if (rolls.length === 0) return ''
  const formula = message.formula || ''
  const modifierMatch = formula.match(/[+-]\d+$/)
  const modifier = modifierMatch ? Number(modifierMatch[0]) : 0
  const base = rolls.join(' + ')
  if (!modifier) return base
  return `${base} ${modifier > 0 ? '+' : '-'} ${Math.abs(modifier)}`
}

function rollTone(message: ApiChatMessage) {
  const rolls = message.rolls?.length ? message.rolls : []
  const sides = Number(message.formula?.match(/d(\d+)/i)?.[1] ?? 0)
  return {
    crit: rolls.length === 1 && sides > 0 && rolls[0] === sides,
    fail: rolls.length === 1 && rolls[0] === 1,
  }
}

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
      title={isOpen ? 'Fechar chat' : 'Chat'}
      aria-label="Abrir/fechar chat"
      type="button"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" width="18" height="18"
      >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    </button>
  )
}

interface ChatPanelProps {
  isOpen: boolean
  isExiting?: boolean
  messages: ApiChatMessage[]
  onCreateMessage: (payload: Omit<ApiChatMessage, 'id' | 'world_id' | 'created_at'>) => Promise<ApiChatMessage>
  onDeleteMessage: (message: ApiChatMessage) => void
}

export default function ChatPanel({ isOpen, isExiting, messages, onCreateMessage, onDeleteMessage }: ChatPanelProps) {
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ message: ApiChatMessage; x: number; y: number } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ block: 'end' })
    }
  }, [messages, isOpen])

  useEffect(() => {
    function closeContextMenu() {
      setContextMenu(null)
    }

    window.addEventListener('click', closeContextMenu)
    return () => window.removeEventListener('click', closeContextMenu)
  }, [])

  async function handleSendMessage() {
    const text = inputText.trim()
    if (!text) return

    const commandMatch = text.match(/^\/(?:r|roll)\s+(.+)$/i)
    const commandRoll = commandMatch ? rollFormula(commandMatch[1]) : null

    setSending(true)
    try {
      if (commandRoll) {
        await onCreateMessage({
          speaker: 'Gamemaster',
          type: 'roll',
          text: text,
          formula: commandRoll.formula,
          result: commandRoll.result,
          rolls: commandRoll.rolls,
        })
      } else {
        await onCreateMessage({
          speaker: 'Gamemaster',
          type: 'text',
          text,
          formula: '',
          result: undefined,
          rolls: [],
        })
      }
      setInputText('')
    } finally {
      setSending(false)
    }
  }

  async function handleDiceRoll(die: typeof DICE[number]) {
    const roll = rollFormula(`1d${die.sides}`)
    if (!roll) return

    await onCreateMessage({
      speaker: 'Gamemaster',
      type: 'roll',
      text: '',
      formula: roll.formula,
      result: roll.result,
      rolls: roll.rolls,
    })
  }

  function openContextMenu(event: MouseEvent<HTMLElement>, message: ApiChatMessage) {
    event.preventDefault()
    event.stopPropagation()
    setContextMenu({ message, x: event.clientX, y: event.clientY })
  }

  const panelClass = [
    styles.panel,
    isOpen ? styles.panelOpen : '',
    isExiting ? styles.panelExiting : '',
  ].join(' ')

  return (
    <aside id="chat-panel" className={panelClass} aria-hidden={!isOpen}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Chat</span>
      </div>

      <div className={styles.messages} role="log" aria-label="Mensagens do chat">
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            <strong>Chat vazio.</strong>
            <span>Envie uma mensagem ou role um dado para testar.</span>
          </div>
        )}

        {messages.map(message => (
          <article
            key={message.id}
            className={`${styles.card} ${styles[`card_${message.type}`]}`}
            onContextMenu={event => openContextMenu(event, message)}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardAvatar} />
              <span className={styles.cardSpeaker}>{message.speaker}</span>
              <span className={styles.cardTime}>{formatTime(message.created_at)}</span>
            </div>
            <div className={styles.cardContent}>
              {message.type === 'roll' ? (
                <>
                  <span className={styles.rollFormula}>{message.formula}</span>
                  {formatRollParts(message) && <span className={styles.rollFormula}>{formatRollParts(message)}</span>}
                  <div className={`${styles.rollResult} ${rollTone(message).crit ? styles.rollCrit : rollTone(message).fail ? styles.rollFail : ''}`}>
                    {message.result}
                  </div>
                  {message.text && <p className={styles.messageText}>{message.text}</p>}
                </>
              ) : (
                <p className={styles.messageText}>{message.text}</p>
              )}
            </div>
          </article>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <div className={styles.diceBar}>
          {DICE.map(die => (
            <button
              key={die.label}
              className={styles.dieBtn}
              title={`Rolar ${die.label}`}
              onClick={() => handleDiceRoll(die)}
              type="button"
            >
              <span className={styles.dieLabel}>{die.label}</span>
            </button>
          ))}
        </div>

        <textarea
          className={styles.textarea}
          placeholder="Digite uma mensagem..."
          aria-label="Mensagem de chat"
          rows={3}
          value={inputText}
          onChange={event => setInputText(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              handleSendMessage()
            }
          }}
        />

        <div className={styles.inputActions}>
          <span className={styles.hintText}>Shift+Enter para nova linha</span>
          <button className={styles.rollBtn} onClick={handleSendMessage} type="button" disabled={sending}>
            {sending ? '...' : 'Enviar'}
          </button>
        </div>
      </div>

      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={event => event.stopPropagation()}
        >
          <button
            className={styles.contextDanger}
            type="button"
            onClick={() => {
              onDeleteMessage(contextMenu.message)
              setContextMenu(null)
            }}
          >
            Apagar mensagem
          </button>
        </div>
      )}
    </aside>
  )
}
