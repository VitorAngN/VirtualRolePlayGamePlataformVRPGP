import { useState, useRef } from 'react'
import type { Scene, SceneConfigTab } from './types'
import styles from '../ScenesPanel.module.css'

interface Props {
  scene: Scene
  onClose: () => void
  onSave: (scene: Scene) => void
}

const TABS: { id: SceneConfigTab; label: string; icon: string }[] = [
  { id: 'basics',      label: 'Basics',       icon: '📋' },
  { id: 'grid',        label: 'Grid',         icon: '⊞'  },
  { id: 'lighting',    label: 'Lighting',     icon: '💡' },
  { id: 'ambience',    label: 'Ambience',     icon: '🎵' },
  { id: 'mapexplorer', label: 'Map Explorer', icon: '🗺'  },
]

export default function SceneConfigModal({ scene, onClose, onSave }: Props) {
  const [tab,          setTab]          = useState<SceneConfigTab>('basics')
  const [name,         setName]         = useState(scene.name)
  const [bgColor,      setBgColor]      = useState('#999999')
  const [bgImage,      setBgImage]      = useState('')
  const [showNav,      setShowNav]      = useState(true)
  const [gridType,     setGridType]     = useState('square')
  const [gridSize,     setGridSize]     = useState(100)
  const [gridColor,    setGridColor]    = useState('#000000')
  const [gridOpacity,  setGridOpacity]  = useState(0.2)
  const [darkness,     setDarkness]     = useState(0)
  const [globalLight,  setGlobalLight]  = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.modalLarge}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{name || 'Scene'}</span>
          <div className={styles.modalHeaderIcons}>
            <button className={styles.iconBtn} title="Permissões">🔒</button>
            <button className={styles.iconBtn} title="Duplicar">📋</button>
            <button className={styles.iconBtn} title="Exportar">📤</button>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className={styles.tabBar}>
          {TABS.map(t => (
            <button key={t.id}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={styles.modalBody}>

          {tab === 'basics' && (
            <div className={styles.tabContent}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Scene Name</label>
                <input className={styles.formInput} value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Permissions</label>
                <div className={styles.permRow}>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={showNav} onChange={e => setShowNav(e.target.checked)} />
                    Show in Navigation
                  </label>
                  <select className={styles.formSelectSm}>
                    <option>GM Only</option><option>All Players</option><option>Observer</option>
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Navigation Name</label>
                <input className={styles.formInput} placeholder="Same as scene name" />
                <span className={styles.formHint}>Alternative name shown in the Navigation Bar.</span>
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Background Image</label>
                <div className={styles.fileRow}>
                  <input className={styles.formInput} value={bgImage} onChange={e => setBgImage(e.target.value)} placeholder="path/to/file.ext" />
                  <button className={styles.fileBtn} onClick={() => fileRef.current?.click()}>📁</button>
                  <input ref={fileRef} type="file" accept="image/*" hidden />
                </div>
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Foreground Image</label>
                <div className={styles.fileRow}>
                  <input className={styles.formInput} placeholder="path/to/file.ext" />
                  <button className={styles.fileBtn}>📁</button>
                </div>
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Background Color</label>
                <div className={styles.colorRow}>
                  <input className={styles.formInput} value={bgColor} onChange={e => setBgColor(e.target.value)} />
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className={styles.colorPicker} />
                </div>
              </div>
              <div className={styles.formRowHalf}>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Background Elevation</label>
                  <input className={styles.formInput} type="number" defaultValue={0} />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Foreground Elevation</label>
                  <input className={styles.formInput} type="number" defaultValue={0} />
                </div>
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Initial View Position</label>
                <div className={styles.posRow}>
                  <span className={styles.posLabel}>X</span>
                  <input className={styles.formInputSm} type="number" defaultValue={0} />
                  <span className={styles.posLabel}>Y</span>
                  <input className={styles.formInputSm} type="number" defaultValue={0} />
                  <span className={styles.posLabel}>Zoom</span>
                  <input className={styles.formInputSm} type="number" step="0.1" defaultValue={1} />
                </div>
              </div>
              <div className={styles.checkboxCard}>
                <label className={styles.checkLabel}>
                  <input type="checkbox" />
                  Auto lock canvas in cinematic mode when this scene is activated
                </label>
              </div>
            </div>
          )}

          {tab === 'grid' && (
            <div className={styles.tabContent}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Grid Type</label>
                <select className={styles.formSelect} value={gridType} onChange={e => setGridType(e.target.value)}>
                  <option value="gridless">Gridless</option>
                  <option value="square">Square</option>
                  <option value="hex-r">Hexagonal (Row)</option>
                  <option value="hex-c">Hexagonal (Col)</option>
                </select>
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Grid Size (px)</label>
                <input className={styles.formInput} type="number" value={gridSize} onChange={e => setGridSize(+e.target.value)} />
              </div>
              <div className={styles.formRowHalf}>
                <div className={styles.formRow}><label className={styles.formLabel}>Offset X</label><input className={styles.formInput} type="number" defaultValue={0} /></div>
                <div className={styles.formRow}><label className={styles.formLabel}>Offset Y</label><input className={styles.formInput} type="number" defaultValue={0} /></div>
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Grid Color</label>
                <div className={styles.colorRow}>
                  <input className={styles.formInput} value={gridColor} onChange={e => setGridColor(e.target.value)} />
                  <input type="color" value={gridColor} onChange={e => setGridColor(e.target.value)} className={styles.colorPicker} />
                </div>
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Grid Opacity — {(gridOpacity * 100).toFixed(0)}%</label>
                <input className={styles.formInput} type="range" min={0} max={1} step={0.05} value={gridOpacity} onChange={e => setGridOpacity(+e.target.value)} />
              </div>
              <div className={styles.formRowHalf}>
                <div className={styles.formRow}><label className={styles.formLabel}>Distance</label><input className={styles.formInput} type="number" defaultValue={5} /></div>
                <div className={styles.formRow}><label className={styles.formLabel}>Units</label><input className={styles.formInput} defaultValue="ft" /></div>
              </div>
            </div>
          )}

          {tab === 'lighting' && (
            <div className={styles.tabContent}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Darkness — {(darkness * 100).toFixed(0)}%</label>
                <input className={styles.formInput} type="range" min={0} max={1} step={0.05} value={darkness} onChange={e => setDarkness(+e.target.value)} />
              </div>
              <div className={styles.formRow}>
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={globalLight} onChange={e => setGlobalLight(e.target.checked)} />
                  Global Illumination
                </label>
                <span className={styles.formHint}>Treat the entire scene as globally illuminated.</span>
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Global Illumination Threshold</label>
                <input className={styles.formInput} type="range" min={0} max={1} step={0.05} defaultValue={0} disabled={!globalLight} />
              </div>
            </div>
          )}

          {tab === 'ambience' && (
            <div className={styles.tabContent}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Playlist</label>
                <select className={styles.formSelect}>
                  <option value="">— None —</option>
                  <option>Dungeon Ambience</option><option>Battle Music</option><option>Tavern Songs</option>
                </select>
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Scene Description</label>
                <textarea className={styles.formTextarea} rows={4} placeholder="Describe the scene to players…" />
              </div>
            </div>
          )}

          {tab === 'mapexplorer' && (
            <div className={styles.tabContent}>
              <div className={styles.formRow}>
                <label className={styles.checkLabel}><input type="checkbox" defaultChecked /> Fog Exploration</label>
                <span className={styles.formHint}>Players only see areas their tokens have explored.</span>
              </div>
              <div className={styles.formRow}>
                <label className={styles.checkLabel}><input type="checkbox" /> Reset Fog on Activation</label>
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Fog Overlay</label>
                <div className={styles.fileRow}>
                  <input className={styles.formInput} placeholder="path/to/overlay.png" />
                  <button className={styles.fileBtn}>📁</button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose}>Cancel</button>
          <button className={styles.primaryBtn} onClick={() => onSave({ ...scene, name })}>✔ Apply</button>
          <button className={styles.primaryBtn} onClick={() => { onSave({ ...scene, name }); onClose() }}>💾 Save</button>
        </div>
      </div>
    </div>
  )
}
