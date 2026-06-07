import { useMemo, useState, type FormEvent } from 'react'
import type {
  ApiActor,
  ApiGameSystem,
  ApiItem,
  ApiSystemField,
  ApiSystemItemType,
  CreateItemPayload,
  SystemFieldType,
} from '../services/vttApi'
import styles from './ItemEditDialog.module.css'

type ItemData = Record<string, string | number | boolean>

interface ItemEditDialogProps {
  item?: ApiItem | null
  system: ApiGameSystem | null
  actors: ApiActor[]
  onClose: () => void
  onCreateItem: (payload: CreateItemPayload) => Promise<ApiItem>
  onPatchItem: (itemId: string, payload: Partial<ApiItem>) => Promise<ApiItem>
  onDeleteItem: (item: ApiItem) => Promise<void>
}

const FALLBACK_ITEM_TYPE: ApiSystemItemType = {
  id: 'item',
  label: 'Item',
  fields: [
    { id: 'description', label: 'Descricao', type: 'textarea', section: 'Notas', default_value: '' },
  ],
}

function defaultDataFor(itemType: ApiSystemItemType): ItemData {
  return itemType.fields.reduce<ItemData>((data, field) => {
    data[field.id] = field.default_value
    return data
  }, {})
}

function normalizeByType(type: SystemFieldType, value: string | number | boolean) {
  if (type === 'number') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (type === 'checkbox') return Boolean(value)
  return String(value ?? '')
}

function dataFor(item: ApiItem | null | undefined, itemType: ApiSystemItemType): ItemData {
  return {
    ...defaultDataFor(itemType),
    ...(item?.data || {}),
    quantity: item?.quantity ?? item?.data?.quantity ?? 1,
  }
}

function itemTypeFrom(system: ApiGameSystem | null, typeId?: string) {
  const itemTypes = system?.item_types?.length ? system.item_types : [FALLBACK_ITEM_TYPE]
  return itemTypes.find(type => type.id === typeId) ?? itemTypes[0]
}

export default function ItemEditDialog({
  item,
  system,
  actors,
  onClose,
  onCreateItem,
  onPatchItem,
  onDeleteItem,
}: ItemEditDialogProps) {
  const itemTypes = system?.item_types?.length ? system.item_types : []
  const canEditItems = itemTypes.length > 0
  const initialType = itemTypeFrom(system, item?.type)
  const [typeId, setTypeId] = useState(initialType.id)
  const itemType = itemTypeFrom(system, typeId)
  const [name, setName] = useState(item?.name || '')
  const [actorId, setActorId] = useState(item?.actor_id || '')
  const [quantity, setQuantity] = useState(String(item?.quantity ?? item?.data?.quantity ?? 1))
  const [equipped, setEquipped] = useState(Boolean(item?.equipped))
  const [values, setValues] = useState<ItemData>(() => dataFor(item, itemType))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const fieldMap = useMemo(
    () => new Map<string, ApiSystemField>((itemType.fields || []).map(field => [field.id, field])),
    [itemType.fields],
  )
  const visibleFields = (itemType.fields || []).filter(field => field.id !== 'quantity')
  const isEditing = Boolean(item)

  function handleTypeChange(nextTypeId: string) {
    const nextType = itemTypeFrom(system, nextTypeId)
    setTypeId(nextType.id)
    setValues(prev => ({
      ...defaultDataFor(nextType),
      ...prev,
    }))
  }

  function updateValue(id: string, value: string | number | boolean, fallbackType: SystemFieldType = 'text') {
    const type = fieldMap.get(id)?.type ?? fallbackType
    setValues(prev => ({
      ...prev,
      [id]: normalizeByType(type, value),
    }))
  }

  function renderField(field: ApiSystemField) {
    const value = values[field.id] ?? field.default_value

    if (field.type === 'checkbox') {
      return (
        <label className={`${styles.formRow} ${styles.checkboxRow}`} key={field.id}>
          <span>{field.label}</span>
          <input
            type="checkbox"
            checked={value === true}
            onChange={event => updateValue(field.id, event.target.checked, field.type)}
          />
        </label>
      )
    }

    if (field.type === 'textarea') {
      return (
        <label className={`${styles.formRow} ${styles.fieldWide}`} key={field.id}>
          <span>{field.label}</span>
          <textarea value={String(value ?? '')} onChange={event => updateValue(field.id, event.target.value, field.type)} />
        </label>
      )
    }

    return (
      <label className={styles.formRow} key={field.id}>
        <span>{field.label}</span>
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={String(value ?? '')}
          onChange={event => updateValue(field.id, event.target.value, field.type)}
        />
      </label>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canEditItems) {
      setError('O sistema deste mundo nao possui tipos de item.')
      return
    }

    const itemName = name.trim()
    if (!itemName) {
      setError('Informe o nome do item.')
      return
    }

    const numericQuantity = Number(quantity)
    const nextData = { ...values }
    if (fieldMap.has('quantity')) {
      nextData.quantity = Number.isFinite(numericQuantity) ? numericQuantity : 1
    }

    setIsSaving(true)
    setError('')
    try {
      if (item) {
        await onPatchItem(item.id, {
          name: itemName,
          type: itemType.id,
          actor_id: actorId,
          quantity: Number.isFinite(numericQuantity) ? numericQuantity : 1,
          equipped,
          data: nextData,
        })
      } else {
        await onCreateItem({
          name: itemName,
          type: itemType.id,
          actor_id: actorId,
          quantity: Number.isFinite(numericQuantity) ? numericQuantity : 1,
          equipped,
          data: nextData,
        })
      }
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nao consegui salvar esse item agora.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!item) return
    const confirmed = window.confirm(`Apagar o item "${item.name}"?`)
    if (!confirmed) return

    setIsSaving(true)
    setError('')
    try {
      await onDeleteItem(item)
      onClose()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Nao consegui apagar esse item agora.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onMouseDown={() => !isSaving && onClose()}>
      <form className={styles.dialog} onSubmit={handleSubmit} onMouseDown={event => event.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <span>{isEditing ? 'Editar item' : 'Criar item'}</span>
            <strong>{name.trim() || 'Novo item'}</strong>
          </div>
          <button className={styles.closeBtn} type="button" onClick={onClose} disabled={isSaving}>
            x
          </button>
        </div>

        <div className={styles.body}>
          {!canEditItems && (
            <p className={styles.error}>O sistema deste mundo nao define tipos de item. Edite o sistema no launcher antes de criar itens.</p>
          )}

          <div className={styles.formGrid}>
            <label className={styles.formRow}>
              <span>Nome</span>
              <input value={name} onChange={event => setName(event.target.value)} autoFocus placeholder="Nome do item" />
            </label>

            <label className={styles.formRow}>
              <span>Tipo</span>
              <select value={itemType.id} onChange={event => handleTypeChange(event.target.value)} disabled={!canEditItems}>
                {itemTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </label>

            <label className={styles.formRow}>
              <span>Anexado a</span>
              <select value={actorId} onChange={event => setActorId(event.target.value)}>
                <option value="">Mundo</option>
                {actors.map(actor => (
                  <option key={actor.id} value={actor.id}>{actor.name}</option>
                ))}
              </select>
            </label>

            <label className={styles.formRow}>
              <span>Quantidade</span>
              <input type="number" min="0" value={quantity} onChange={event => setQuantity(event.target.value)} />
            </label>

            <label className={`${styles.formRow} ${styles.checkboxRow}`}>
              <span>Equipado/ativo</span>
              <input type="checkbox" checked={equipped} onChange={event => setEquipped(event.target.checked)} />
            </label>
          </div>

          {visibleFields.length > 0 && (
            <section className={styles.fieldSection}>
              <div>
                <span>Campos do sistema</span>
                <small>{itemType.label}</small>
              </div>
              <div className={styles.fieldGrid}>
                {visibleFields.map(renderField)}
              </div>
            </section>
          )}

          <p className={styles.hint}>
            Campos com formula de rolagem aparecem clicaveis na ficha quando o item estiver anexado.
          </p>

          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.footer}>
          {item && (
            <button className={styles.deleteBtn} type="button" onClick={handleDelete} disabled={isSaving}>
              Apagar
            </button>
          )}
          <button className={styles.secondaryBtn} type="button" onClick={onClose} disabled={isSaving}>
            Cancelar
          </button>
          <button className={styles.primaryBtn} type="submit" disabled={isSaving || !canEditItems}>
            {isSaving ? 'Salvando...' : 'Salvar item'}
          </button>
        </div>
      </form>
    </div>
  )
}
