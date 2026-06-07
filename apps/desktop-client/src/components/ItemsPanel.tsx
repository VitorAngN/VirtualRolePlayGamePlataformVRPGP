import type { ApiActor, ApiCompendiumItem, ApiGameSystem, ApiItem } from '../services/vttApi'
import styles from './ItemsPanel.module.css'

interface ItemsPanelProps {
  isOpen: boolean
  isExiting?: boolean
  items: ApiItem[]
  actors: ApiActor[]
  system: ApiGameSystem | null
  onRequestCreateItem: () => void
  onCreateFromCompendium: (item: ApiCompendiumItem) => void
  onSaveItemToCompendium: (item: ApiItem) => void
  onEditItem: (item: ApiItem) => void
  onAttachItem: (item: ApiItem, actorId: string) => void
  onDeleteItem: (item: ApiItem) => void
}

function itemTypeLabel(system: ApiGameSystem | null, typeId: string) {
  return system?.item_types?.find(type => type.id === typeId)?.label || typeId || 'Item'
}

function actorName(actors: ApiActor[], actorId?: string) {
  if (!actorId) return 'Mundo'
  return actors.find(actor => actor.id === actorId)?.name || 'Ficha removida'
}

export default function ItemsPanel({
  isOpen,
  isExiting,
  items,
  actors,
  system,
  onRequestCreateItem,
  onCreateFromCompendium,
  onSaveItemToCompendium,
  onEditItem,
  onAttachItem,
  onDeleteItem,
}: ItemsPanelProps) {
  const canCreateItems = Boolean(system?.item_types?.length)

  return (
    <aside className={`${styles.panel} ${isOpen ? styles.panelOpen : ''} ${isExiting ? styles.panelExiting : ''}`}>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>Documentos</span>
          <strong>Itens</strong>
        </div>
        <span className={styles.counter}>{items.length}</span>
      </header>

      <div className={styles.createBox}>
        <button className={styles.primaryBtn} type="button" onClick={onRequestCreateItem} disabled={!canCreateItems}>
          Criar item
        </button>
        {!canCreateItems && (
          <p className={styles.hint}>O sistema deste mundo ainda nao define tipos de item.</p>
        )}
      </div>

      {canCreateItems && Boolean(system?.compendium_items?.length) && (
        <section className={styles.compendiumBox}>
          <div className={styles.compendiumHeader}>
            <span>Compendio do sistema</span>
            <small>{system?.compendium_items?.length || 0}</small>
          </div>
          <div className={styles.compendiumList}>
            {system?.compendium_items?.map(item => (
              <button key={item.id} type="button" onClick={() => onCreateFromCompendium(item)}>
                <strong>{item.name}</strong>
                <span>{itemTypeLabel(system, item.type)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className={styles.itemList}>
        {items.length === 0 && (
          <div className={styles.emptyState}>
            <strong>Nenhum item criado.</strong>
            <span>Crie armas, magias, equipamentos ou condicoes para anexar nas fichas.</span>
          </div>
        )}

        {items.map(item => (
          <article
            className={`${styles.itemCard} ${styles.itemCardDraggable}`}
            key={item.id}
            draggable
            onDragStart={event => {
              event.dataTransfer.effectAllowed = 'copy'
              event.dataTransfer.setData('application/x-vtt-item-id', item.id)
              event.dataTransfer.setData('text/plain', item.name)
            }}
          >
            <button className={styles.itemMain} type="button" onClick={() => onEditItem(item)}>
              <span className={styles.itemIcon}>{item.name.slice(0, 1).toUpperCase() || '?'}</span>
              <span className={styles.itemInfo}>
                <strong>{item.name}</strong>
                <small>{itemTypeLabel(system, item.type)} - {actorName(actors, item.actor_id)}</small>
              </span>
            </button>

            <div className={styles.itemMeta}>
              <span>Qtd {item.quantity ?? 1}</span>
              {item.equipped && <span>Equipado</span>}
            </div>

            <div className={styles.itemActions}>
              <select
                value={item.actor_id || ''}
                onChange={event => onAttachItem(item, event.target.value)}
                aria-label={`Anexar ${item.name} a ficha`}
              >
                <option value="">Mundo</option>
                {actors.map(actor => (
                  <option key={actor.id} value={actor.id}>{actor.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => onSaveItemToCompendium(item)} disabled={!canCreateItems}>
                Comp.
              </button>
              <button type="button" onClick={() => onDeleteItem(item)}>
                Apagar
              </button>
            </div>
          </article>
        ))}
      </div>
    </aside>
  )
}
