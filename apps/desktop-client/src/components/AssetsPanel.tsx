import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { resolveAssetUrl, uploadAsset, type ApiAsset } from '../services/vttApi'
import styles from './AssetsPanel.module.css'

const KIND_LABELS: Record<ApiAsset['kind'], string> = {
  map: 'Mapa',
  token: 'Token',
  portrait: 'Retrato',
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getNameFromFile(file: File) {
  return file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
}

export function AssetsToggleButton({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <button
      id="assets-toggle-btn"
      className={`${styles.toggleBtn} ${isOpen ? styles.toggleBtnOpen : ''}`}
      onClick={onToggle}
      title={isOpen ? 'Fechar assets' : 'Assets'}
      type="button"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <path d="M21 16V8a2 2 0 00-1-1.732l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.732l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <path d="M3.3 7L12 12l8.7-5M12 22V12" />
      </svg>
    </button>
  )
}

interface AssetsPanelProps {
  isOpen: boolean
  isExiting?: boolean
  assets: ApiAsset[]
  worldId: string
  activeSceneId?: string
  onUploaded: (asset: ApiAsset) => void
  onUseAsSceneMap?: (asset: ApiAsset) => void
  onDeleteAsset?: (asset: ApiAsset) => void
}

export default function AssetsPanel({
  isOpen,
  isExiting,
  assets,
  worldId,
  activeSceneId,
  onUploaded,
  onUseAsSceneMap,
  onDeleteAsset,
}: AssetsPanelProps) {
  const [kind, setKind] = useState<ApiAsset['kind']>('map')
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [attachToScene, setAttachToScene] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const orderedAssets = useMemo(
    () => [...assets].sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)),
    [assets],
  )

  const panelClass = [
    styles.panel,
    isOpen ? styles.panelOpen : '',
    isExiting ? styles.panelExiting : '',
  ].join(' ')

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    setError(null)
    if (nextFile && !name.trim()) {
      setName(getNameFromFile(nextFile))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) {
      setError('Escolha uma imagem para enviar.')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const asset = await uploadAsset({
        file,
        kind,
        worldId,
        sceneId: attachToScene && activeSceneId ? activeSceneId : undefined,
        name: name || getNameFromFile(file),
      })
      onUploaded(asset)
      setFile(null)
      setName('')
      event.currentTarget.reset()
    } catch {
      setError('Nao consegui salvar esse arquivo no disco agora.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <aside id="assets-panel" className={panelClass} aria-hidden={!isOpen}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>Biblioteca</span>
          <strong>Assets do mundo</strong>
        </div>
        <span className={styles.counter}>{assets.length}</span>
      </div>

      <form className={styles.uploadBox} onSubmit={handleSubmit}>
        <label className={styles.formRow}>
          <span>Tipo</span>
          <select value={kind} onChange={event => setKind(event.target.value as ApiAsset['kind'])}>
            <option value="map">Mapa</option>
            <option value="token">Token</option>
            <option value="portrait">Retrato</option>
          </select>
        </label>

        <label className={styles.formRow}>
          <span>Nome</span>
          <input value={name} onChange={event => setName(event.target.value)} placeholder="Ex: Floresta norte" />
        </label>

        <label className={styles.filePick}>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <span>{file ? file.name : 'Escolher imagem'}</span>
        </label>

        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={attachToScene && Boolean(activeSceneId)}
            disabled={!activeSceneId}
            onChange={event => setAttachToScene(event.target.checked)}
          />
          <span>Associar a cena ativa</span>
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.primaryBtn} type="submit" disabled={isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar asset'}
        </button>
      </form>

      <div className={styles.assetList}>
        {orderedAssets.length === 0 && (
          <div className={styles.emptyState}>
            <strong>Nenhum asset salvo ainda.</strong>
            <span>Envie mapas e tokens para gravar esses arquivos no save local do mundo.</span>
          </div>
        )}

        {orderedAssets.map(asset => {
          const isImage = asset.content_type.startsWith('image/')
          const url = resolveAssetUrl(asset.url)

          return (
            <article key={asset.id} className={styles.assetCard}>
              <div className={styles.assetPreview}>
                {isImage ? <img src={url} alt="" /> : <span>{KIND_LABELS[asset.kind]}</span>}
              </div>
              <div className={styles.assetMeta}>
                <strong title={asset.name}>{asset.name}</strong>
                <span>{KIND_LABELS[asset.kind]} - {formatBytes(asset.size_bytes)}</span>
                <div className={styles.assetActions}>
                  {asset.kind === 'map' && isImage && (
                    <button
                      type="button"
                      onClick={() => onUseAsSceneMap?.(asset)}
                      disabled={!activeSceneId}
                      title={!activeSceneId ? 'Crie ou selecione uma cena antes.' : 'Usar como mapa da cena ativa'}
                    >
                      Usar na cena
                    </button>
                  )}
                  <button type="button" onClick={() => navigator.clipboard?.writeText(url)}>
                    Copiar URL
                  </button>
                  <button type="button" onClick={() => onDeleteAsset?.(asset)}>
                    Apagar
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </aside>
  )
}
