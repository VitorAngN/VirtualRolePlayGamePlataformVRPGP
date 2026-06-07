import type { ApiActor, ApiCombat, ApiCombatant } from '../services/vttApi'
import type { Scene } from './scenes/types'
import styles from './CombatPanel.module.css'

interface CombatPanelToken {
  id: string
  sceneId: string
  actorId?: string
  name: string
  x: number
  y: number
  hp: number
  maxHp: number
  ac: number
}

interface CombatPanelProps {
  isOpen: boolean
  isExiting?: boolean
  combat: ApiCombat | null
  activeScene: Scene | null
  tokens: CombatPanelToken[]
  actors: ApiActor[]
  selectedTokenId: string | null
  onAddToken: (tokenId: string) => void
  onAddAllSceneTokens: () => void
  onRemoveCombatant: (combatantId: string) => void
  onPatchCombat: (patch: Partial<ApiCombat>) => void
  onPatchCombatant: (combatantId: string, patch: Partial<ApiCombatant>) => void
  onOpenActor: (actorId: string) => void
}

function initiativeValue(value: number | null | undefined) {
  return value === null || value === undefined ? '' : String(value)
}

function rollD20() {
  return Math.floor(Math.random() * 20) + 1
}

function tokenForCombatant(tokens: CombatPanelToken[], combatant: ApiCombatant) {
  return tokens.find(token => token.id === combatant.token_id)
}

function actorName(actors: ApiActor[], actorId?: string) {
  if (!actorId) return ''
  return actors.find(actor => actor.id === actorId)?.name || ''
}

function orderCombatants(combatants: ApiCombatant[]) {
  return [...combatants].sort((a, b) => {
    const initiativeA = a.initiative ?? Number.NEGATIVE_INFINITY
    const initiativeB = b.initiative ?? Number.NEGATIVE_INFINITY
    if (initiativeA !== initiativeB) return initiativeB - initiativeA
    return (a.sort ?? 0) - (b.sort ?? 0)
  })
}

export default function CombatPanel({
  isOpen,
  isExiting,
  combat,
  activeScene,
  tokens,
  actors,
  selectedTokenId,
  onAddToken,
  onAddAllSceneTokens,
  onRemoveCombatant,
  onPatchCombat,
  onPatchCombatant,
  onOpenActor,
}: CombatPanelProps) {
  const combatants = orderCombatants(combat?.combatants || [])
  const selectedToken = selectedTokenId ? tokens.find(token => token.id === selectedTokenId) : null
  const selectedAlreadyInCombat = Boolean(selectedTokenId && combatants.some(combatant => combatant.token_id === selectedTokenId))
  const activeCombatant = combat?.active ? combatants[combat.turn] : null
  const canRunTurns = combatants.length > 0

  function startEncounter() {
    if (!combat) return
    onPatchCombat({
      active: true,
      scene_id: activeScene?.id || combat.scene_id || '',
      round: Math.max(1, combat.round || 1),
      turn: combat.turn || 0,
    })
  }

  function stopEncounter() {
    if (!combat) return
    onPatchCombat({ active: false, round: 0, turn: 0 })
  }

  function nextTurn() {
    if (!combat || combatants.length === 0) return
    const nextTurnIndex = (combat.turn + 1) % combatants.length
    onPatchCombat({
      turn: nextTurnIndex,
      round: nextTurnIndex === 0 ? Math.max(1, combat.round || 1) + 1 : Math.max(1, combat.round || 1),
    })
  }

  return (
    <aside className={`${styles.panel} ${isOpen ? styles.panelOpen : ''} ${isExiting ? styles.panelExiting : ''}`}>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>Tracker</span>
          <strong>Combate</strong>
        </div>
        <span className={styles.counter}>{combatants.length}</span>
      </header>

      <section className={styles.encounterBox}>
        <div className={styles.sceneLine}>
          <span>Cena</span>
          <strong>{activeScene?.name || 'Nenhuma cena'}</strong>
        </div>
        <div className={styles.statusLine}>
          <span>{combat?.active ? `Rodada ${combat.round || 1}` : 'Nao iniciado'}</span>
          <strong>{activeCombatant?.name || 'Sem turno ativo'}</strong>
        </div>
        <div className={styles.encounterActions}>
          <button type="button" onClick={combat?.active ? stopEncounter : startEncounter} disabled={!canRunTurns}>
            {combat?.active ? 'Encerrar' : 'Iniciar'}
          </button>
          <button type="button" onClick={nextTurn} disabled={!combat?.active || !canRunTurns}>
            Proximo turno
          </button>
        </div>
      </section>

      <section className={styles.addBox}>
        <button
          className={styles.primaryBtn}
          type="button"
          onClick={() => selectedToken && onAddToken(selectedToken.id)}
          disabled={!selectedToken || selectedAlreadyInCombat}
        >
          Adicionar selecionado
        </button>
        <button type="button" onClick={onAddAllSceneTokens} disabled={!activeScene || tokens.length === 0}>
          Adicionar todos da cena
        </button>
        {selectedToken && (
          <small>
            Selecionado: {selectedToken.name}{selectedAlreadyInCombat ? ' ja esta no combate' : ''}
          </small>
        )}
      </section>

      <div className={styles.combatantList}>
        {combatants.length === 0 && (
          <div className={styles.emptyState}>
            <strong>Nenhum combatente.</strong>
            <span>Coloque tokens reais na cena e adicione ao encontro.</span>
          </div>
        )}

        {combatants.map((combatant, index) => {
          const token = tokenForCombatant(tokens, combatant)
          const isTurn = combat?.active && combat.turn === index
          const linkedActorName = actorName(actors, combatant.actor_id || token?.actorId)

          return (
            <article key={combatant.id} className={`${styles.combatantCard} ${isTurn ? styles.combatantTurn : ''} ${combatant.defeated ? styles.combatantDefeated : ''}`}>
              <div className={styles.combatantMain}>
                <div className={styles.avatar}>{combatant.name.slice(0, 1).toUpperCase() || '?'}</div>
                <button
                  type="button"
                  className={styles.combatantName}
                  onClick={() => {
                    const actorId = combatant.actor_id || token?.actorId
                    if (actorId) onOpenActor(actorId)
                  }}
                  disabled={!combatant.actor_id && !token?.actorId}
                >
                  <strong>{combatant.name}</strong>
                  <small>{linkedActorName || (token ? `Token ${token.x}, ${token.y}` : 'Token removido')}</small>
                </button>
              </div>

              <div className={styles.combatantStats}>
                <span>PV {token ? `${token.hp}/${token.maxHp}` : '-'}</span>
                <span>CA {token?.ac ?? '-'}</span>
              </div>

              <div className={styles.initiativeRow}>
                <label>
                  <span>Iniciativa</span>
                  <input
                    type="number"
                    value={initiativeValue(combatant.initiative)}
                    onChange={event => onPatchCombatant(combatant.id, {
                      initiative: event.target.value === '' ? null : Number(event.target.value),
                    })}
                  />
                </label>
                <button type="button" onClick={() => onPatchCombatant(combatant.id, { initiative: rollD20() })}>
                  d20
                </button>
              </div>

              <div className={styles.combatantActions}>
                <button type="button" onClick={() => onPatchCombatant(combatant.id, { defeated: !combatant.defeated })}>
                  {combatant.defeated ? 'Reativar' : 'Derrotado'}
                </button>
                <button type="button" onClick={() => onPatchCombatant(combatant.id, { hidden: !combatant.hidden })}>
                  {combatant.hidden ? 'Mostrar' : 'Ocultar'}
                </button>
                <button type="button" onClick={() => onRemoveCombatant(combatant.id)}>
                  Remover
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </aside>
  )
}
