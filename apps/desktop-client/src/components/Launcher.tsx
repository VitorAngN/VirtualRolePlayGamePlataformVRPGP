import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import {
  createSystem,
  createWorld,
  deleteSystem,
  deleteWorld,
  getSystems,
  getWorlds,
  patchWorld,
  type ApiGameSystem,
  type ApiWorld,
} from '../services/vttApi'
import styles from './Launcher.module.css'

interface LauncherProps {
  onEnterWorld: (worldId: string) => void
}

const NEWS_ITEMS = [
  {
    label: 'Workspace 0.1',
    title: 'Aplicativo local em construcao',
    body: 'Launcher, sistemas e saves em disco ja estao rodando como programa desktop.',
  },
  {
    label: 'Roadmap',
    title: 'Base da mesa',
    body: 'As proximas entregas focam em cenas, assets, grid, tokens e configuracoes de mapa.',
  },
]

const JOIN_THEMES = [
  { id: 'default', label: 'Padrao' },
  { id: 'dark', label: 'Escuro' },
  { id: 'classic', label: 'Classico' },
]

function formatLocalCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural} ${count === 1 ? 'local' : 'locais'}`
}

function formatDateTime(value?: string) {
  if (!value) return 'Nao agendada'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function toDateTimeInputValue(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function fromDateTimeInputValue(value: string) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

function backgroundStyle(world?: ApiWorld) {
  const image = world?.background_image?.trim()
  if (!image) return undefined
  return { backgroundImage: `url("${image.replace(/"/g, '\\"')}")` }
}

export default function Launcher({ onEnterWorld }: LauncherProps) {
  const [worlds, setWorlds] = useState<ApiWorld[]>([])
  const [systems, setSystems] = useState<ApiGameSystem[]>([])
  const [activeTab, setActiveTab] = useState<'worlds' | 'systems'>('worlds')
  const [status, setStatus] = useState<'loading' | 'ready' | 'offline'>('loading')
  const [creatingWorld, setCreatingWorld] = useState(false)
  const [creatingSystem, setCreatingSystem] = useState(false)
  const [savingWorld, setSavingWorld] = useState(false)
  const [modal, setModal] = useState<'world' | 'system' | 'editWorld' | null>(null)
  const [selectedWorld, setSelectedWorld] = useState<ApiWorld | null>(null)
  const [contextMenu, setContextMenu] = useState<{ world: ApiWorld; x: number; y: number } | null>(null)
  const [formError, setFormError] = useState('')
  const [worldForm, setWorldForm] = useState({
    name: '',
    description: '',
    systemId: '',
    dataPath: '',
    backgroundImage: '',
    joinTheme: 'default',
    nextSession: '',
    safeConfiguration: false,
  })
  const [systemForm, setSystemForm] = useState({
    name: '',
    ruleset: '',
    version: '',
    description: '',
  })

  useEffect(() => {
    function closeContextMenu() {
      setContextMenu(null)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setContextMenu(null)
        setSelectedWorld(null)
        setModal(null)
      }
    }

    window.addEventListener('click', closeContextMenu)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('click', closeContextMenu)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    Promise.all([getWorlds(), getSystems()])
      .then(([nextWorlds, nextSystems]) => {
        if (cancelled) return
        setWorlds(nextWorlds)
        setSystems(nextSystems)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('offline')
      })

    return () => {
      cancelled = true
    }
  }, [])

  function openWorldModal() {
    if (systems.length === 0) {
      setActiveTab('systems')
      return
    }

    setWorldForm({
      name: '',
      description: '',
      systemId: systems[0].id,
      dataPath: '',
      backgroundImage: '',
      joinTheme: 'default',
      nextSession: '',
      safeConfiguration: false,
    })
    setFormError('')
    setModal('world')
  }

  function openEditWorldModal(world: ApiWorld) {
    setWorldForm({
      name: world.name,
      description: world.description || '',
      systemId: world.system_id || systems[0]?.id || '',
      dataPath: world.data_path || '',
      backgroundImage: world.background_image || '',
      joinTheme: world.join_theme || 'default',
      nextSession: toDateTimeInputValue(world.next_session),
      safeConfiguration: Boolean(world.safe_configuration),
    })
    setContextMenu(null)
    setFormError('')
    setSelectedWorld(world)
    setModal('editWorld')
  }

  function openSystemModal() {
    setSystemForm({ name: '', ruleset: '', version: '', description: '' })
    setFormError('')
    setModal('system')
  }

  async function handleCreateWorld(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!worldForm.name.trim()) return
    const selectedSystem = systems.find(system => system.id === worldForm.systemId)
    if (!selectedSystem) {
      setFormError('Cadastre e selecione um sistema antes de criar um mundo.')
      return
    }

    setCreatingWorld(true)
    setFormError('')
    try {
      const world = await createWorld({
        name: worldForm.name.trim(),
        description: worldForm.description.trim(),
        system: selectedSystem.name,
        system_id: selectedSystem.id,
        data_path: worldForm.dataPath.trim(),
        background_image: worldForm.backgroundImage.trim(),
        join_theme: worldForm.joinTheme,
        next_session: fromDateTimeInputValue(worldForm.nextSession),
        safe_configuration: worldForm.safeConfiguration,
      })
      setWorlds(prev => [...prev, world])
      setModal(null)
      setSelectedWorld(world)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nao consegui criar o mundo.')
    } finally {
      setCreatingWorld(false)
    }
  }

  async function handleCreateSystem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!systemForm.name.trim()) return
    setCreatingSystem(true)
    setFormError('')
    try {
      const system = await createSystem({
        name: systemForm.name.trim(),
        ruleset: systemForm.ruleset.trim(),
        version: systemForm.version.trim(),
        description: systemForm.description.trim(),
      })
      setSystems(prev => [...prev, system])
      setActiveTab('systems')
      setModal(null)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nao consegui criar o sistema.')
    } finally {
      setCreatingSystem(false)
    }
  }

  async function handleEditWorld(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedWorld || !worldForm.name.trim()) return
    const selectedSystem = systems.find(system => system.id === worldForm.systemId)
    if (!selectedSystem) {
      setFormError('Selecione um sistema cadastrado para este mundo.')
      return
    }

    setSavingWorld(true)
    setFormError('')
    try {
      const updatedWorld = await patchWorld(selectedWorld.id, {
        name: worldForm.name.trim(),
        description: worldForm.description.trim(),
        system_id: selectedSystem.id,
        data_path: worldForm.dataPath.trim(),
        background_image: worldForm.backgroundImage.trim(),
        join_theme: worldForm.joinTheme,
        next_session: fromDateTimeInputValue(worldForm.nextSession),
        safe_configuration: worldForm.safeConfiguration,
      })
      setWorlds(prev => prev.map(world => (world.id === updatedWorld.id ? updatedWorld : world)))
      setSelectedWorld(null)
      setModal(null)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nao consegui atualizar o mundo.')
    } finally {
      setSavingWorld(false)
    }
  }

  async function toggleWorldFlag(world: ApiWorld, flag: 'favorite' | 'locked') {
    setContextMenu(null)
    const updatedWorld = await patchWorld(world.id, { [flag]: !world[flag] })
    setWorlds(prev => prev.map(item => (item.id === updatedWorld.id ? updatedWorld : item)))
    setSelectedWorld(prev => (prev?.id === updatedWorld.id ? updatedWorld : prev))
  }

  function openContextMenu(event: MouseEvent<HTMLElement>, world: ApiWorld) {
    event.preventDefault()
    event.stopPropagation()
    setContextMenu({ world, x: event.clientX, y: event.clientY })
  }

  async function handleDeleteWorld(world: ApiWorld) {
    setContextMenu(null)
    const confirmed = window.confirm(`Apagar o mundo "${world.name}" e todos os arquivos dele?`)
    if (!confirmed) return

    await deleteWorld(world.id)
    setWorlds(prev => prev.filter(item => item.id !== world.id))
    setSelectedWorld(prev => (prev?.id === world.id ? null : prev))
  }

  async function handleDeleteSystem(system: ApiGameSystem) {
    const confirmed = window.confirm(`Apagar o sistema "${system.name}"? Os mundos existentes continuam salvos.`)
    if (!confirmed) return

    await deleteSystem(system.id)
    setSystems(prev => prev.filter(item => item.id !== system.id))
  }

  const isWorldsTab = activeTab === 'worlds'
  const worldsStatusText =
    status === 'loading'
      ? 'Carregando mundos...'
      : status === 'offline'
        ? 'Nao consegui acessar os saves locais agora.'
        : formatLocalCount(worlds.length, 'mundo', 'mundos')
  const systemsStatusText =
    status === 'loading'
      ? 'Carregando sistemas...'
      : status === 'offline'
        ? 'Nao consegui acessar os sistemas locais agora.'
        : formatLocalCount(systems.length, 'sistema', 'sistemas')

  if (selectedWorld && modal !== 'editWorld') {
    return (
      <div className={`${styles.detailsRoot} ${styles[`detailsTheme_${selectedWorld.join_theme || 'default'}`] || ''}`}>
        <div className={styles.detailsBg} style={backgroundStyle(selectedWorld)} />
        <div className={styles.detailsFrame} />
        <button className={styles.returnSetupBtn} type="button" onClick={() => setSelectedWorld(null)}>
          Voltar ao setup
        </button>

        <div className={styles.detailsContent}>
          <h1 className={styles.detailsTitle}>{selectedWorld.name}</h1>
          <div className={styles.detailsBody}>
            <div className={styles.detailsLeft}>
              <div className={styles.detailsCard}>
                <div className={styles.sectionDivider}>Entrar na sessao</div>
                <label className={styles.formGroup}>
                  <span className={styles.formIcon}>P</span>
                  <select className={styles.formSelect} defaultValue="gm">
                    <option value="gm">Mestre do Jogo</option>
                    <option value="player">Jogador</option>
                  </select>
                </label>
                <label className={styles.formGroup}>
                  <span className={styles.formIcon}>K</span>
                  <input className={styles.formInput} placeholder="Senha local, se existir" type="password" />
                </label>
                <button className={styles.joinBtn} type="button" onClick={() => onEnterWorld(selectedWorld.id)}>
                  Entrar no mundo
                </button>
              </div>

              <div className={styles.detailsCard}>
                <div className={styles.sectionDivider}>Detalhes</div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Sistema</span>
                  <strong>{selectedWorld.system}</strong>
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Proxima sessao</span>
                  <strong>{formatDateTime(selectedWorld.next_session)}</strong>
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Jogadores locais</span>
                  <strong>0 / 7</strong>
                </div>
              </div>
            </div>

            <div className={`${styles.detailsCard} ${styles.detailsRight}`}>
              <div className={styles.sectionDivider}>Descricao do mundo</div>
              <p className={styles.detailsText}>
                {selectedWorld.description || 'Este mundo ainda nao tem descricao. Edite o mundo no setup para preencher o texto que aparece aqui.'}
              </p>
            </div>
          </div>
          <div className={styles.versionTag}>Workspace 0.1</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.bgTexture} />

      <div className={styles.logo}>
        <span className={styles.logoText}>VTT</span>
        <div className={styles.logoDie}>
          <span className={styles.logoDieNum}>20</span>
        </div>
        <span className={styles.logoText}>LITE</span>
      </div>

      <div className={styles.container}>
        <div className={styles.mainPanel}>
          <div className={styles.tabBar}>
            <button
              className={`${styles.tab} ${isWorldsTab ? styles.tabActive : ''}`}
              type="button"
              onClick={() => setActiveTab('worlds')}
            >
              <span className={styles.tabIcon}>W</span>
              Mundos
            </button>
            <button
              className={`${styles.tab} ${!isWorldsTab ? styles.tabActive : ''}`}
              type="button"
              onClick={() => setActiveTab('systems')}
            >
              <span className={styles.tabIcon}>S</span>
              Sistemas
            </button>
          </div>

          <div className={styles.panelBody}>
            {isWorldsTab ? (
              <>
                <div className={styles.panelToolbar}>
                  <div className={styles.filterInput} aria-live="polite">
                    {worldsStatusText}
                  </div>
                  <button
                    className={styles.secondaryBtn}
                    type="button"
                    onClick={openWorldModal}
                    disabled={creatingWorld || status === 'offline' || systems.length === 0}
                    title={systems.length === 0 ? 'Cadastre um sistema antes de criar um mundo.' : 'Criar mundo'}
                  >
                    {creatingWorld ? 'Criando...' : 'Criar mundo'}
                  </button>
                </div>

                <div className={styles.worldsGrid}>
                  {worlds.map(world => (
                    <article
                      key={world.id}
                      className={`${styles.worldCard} ${world.favorite ? styles.worldCardFavorite : ''} ${world.locked ? styles.worldCardLocked : ''}`}
                      onContextMenu={event => openContextMenu(event, world)}
                    >
                      <button className={styles.worldOpenArea} onClick={() => setSelectedWorld(world)} type="button">
                        {world.background_image && <div className={styles.worldCardImg} style={backgroundStyle(world)} />}
                        <div className={styles.worldCardOverlay} />
                        {world.favorite && <span className={styles.worldFavoriteMark}>*</span>}
                        <h3 className={styles.worldCardTitle}>{world.name}</h3>
                        <div className={styles.worldCardFooter}>
                          <span className={styles.worldCardDate}>{world.next_session ? formatDateTime(world.next_session) : world.system}</span>
                          <div className={styles.worldCardBadges}>
                            <span className={styles.badgeGreen}>local</span>
                            {world.locked && <span className={styles.badgeBlue}>lock</span>}
                          </div>
                        </div>
                      </button>
                      <button
                        className={styles.worldDeleteBtn}
                        type="button"
                        title="Apagar mundo"
                        onClick={() => handleDeleteWorld(world)}
                      >
                        x
                      </button>
                    </article>
                  ))}

                  {status === 'ready' && worlds.length === 0 && (
                    <div className={styles.emptyWorlds}>
                      <strong>Nenhum mundo criado.</strong>
                      <span>
                        {systems.length === 0
                          ? 'Cadastre um sistema antes de criar um mundo.'
                          : 'Crie um mundo para gerar uma pasta de save local.'}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className={styles.panelToolbar}>
                  <div className={styles.filterInput} aria-live="polite">
                    {systemsStatusText}
                  </div>
                  <button className={styles.secondaryBtn} type="button" onClick={openSystemModal} disabled={creatingSystem || status === 'offline'}>
                    {creatingSystem ? 'Criando...' : 'Criar sistema'}
                  </button>
                </div>

                <div className={styles.systemsGrid}>
                  {systems.map(system => (
                    <article key={system.id} className={styles.systemCard}>
                      <div className={styles.systemCardHeader}>
                        <span className={styles.systemEyebrow}>{system.ruleset || 'Sistema custom'}</span>
                        <span className={styles.systemVersion}>{system.version || 'sem versao'}</span>
                      </div>
                      <h3 className={styles.systemTitle}>{system.name}</h3>
                      <p className={styles.systemDescription}>
                        {system.description || 'Sistema local criado para vincular mundos e futuras regras da mesa.'}
                      </p>
                      <button
                        className={styles.systemDeleteBtn}
                        type="button"
                        onClick={() => handleDeleteSystem(system)}
                      >
                        Apagar
                      </button>
                    </article>
                  ))}

                  {status === 'ready' && systems.length === 0 && (
                    <div className={styles.emptyWorlds}>
                      <strong>Nenhum sistema criado.</strong>
                      <span>Crie um sistema para vincular aos mundos da sua mesa.</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <div className={styles.sectionDivider}>Novidades</div>
            <div className={styles.newsList}>
              {NEWS_ITEMS.map(item => (
                <article className={styles.newsItem} key={item.title}>
                  <span className={styles.newsLabel}>{item.label}</span>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
          <div className={styles.versionTag}>Workspace 0.1</div>
        </div>
      </div>

      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={event => event.stopPropagation()}
        >
          <button type="button" onClick={() => { setSelectedWorld(contextMenu.world); setContextMenu(null) }}>
            Abrir mundo
          </button>
          <button type="button" onClick={() => openEditWorldModal(contextMenu.world)}>
            Editar mundo
          </button>
          <button type="button" onClick={() => toggleWorldFlag(contextMenu.world, 'favorite')}>
            {contextMenu.world.favorite ? 'Remover favorito' : 'Marcar favorito'}
          </button>
          <button type="button" onClick={() => toggleWorldFlag(contextMenu.world, 'locked')}>
            {contextMenu.world.locked ? 'Desbloquear mundo' : 'Bloquear mundo'}
          </button>
          <button className={styles.contextDanger} type="button" onClick={() => handleDeleteWorld(contextMenu.world)}>
            Apagar mundo
          </button>
        </div>
      )}

      {modal === 'world' && (
        <div className={styles.modalOverlay} onMouseDown={() => !creatingWorld && setModal(null)}>
          <form className={styles.modal} onSubmit={handleCreateWorld} onMouseDown={event => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <strong>Criar mundo</strong>
              <button className={styles.modalClose} type="button" onClick={() => setModal(null)} disabled={creatingWorld}>
                x
              </button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Nome</span>
                <input
                  className={styles.formInput}
                  value={worldForm.name}
                  onChange={event => setWorldForm(prev => ({ ...prev, name: event.target.value }))}
                  autoFocus
                  placeholder="Ex: Campanha de sexta"
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Sistema</span>
                <select
                  className={styles.formSelect}
                  value={worldForm.systemId}
                  onChange={event => setWorldForm(prev => ({ ...prev, systemId: event.target.value }))}
                >
                  {systems.map(system => (
                    <option key={system.id} value={system.id}>
                      {system.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.formGrid}>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Caminho dos dados</span>
                  <input
                    className={styles.formInput}
                    value={worldForm.dataPath}
                    onChange={event => setWorldForm(prev => ({ ...prev, dataPath: event.target.value }))}
                    placeholder="Gerado pelo nome se vazio"
                  />
                </label>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Tema de entrada</span>
                  <select
                    className={styles.formSelect}
                    value={worldForm.joinTheme}
                    onChange={event => setWorldForm(prev => ({ ...prev, joinTheme: event.target.value }))}
                  >
                    {JOIN_THEMES.map(theme => (
                      <option key={theme.id} value={theme.id}>{theme.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Imagem de fundo da entrada</span>
                <input
                  className={styles.formInput}
                  value={worldForm.backgroundImage}
                  onChange={event => setWorldForm(prev => ({ ...prev, backgroundImage: event.target.value }))}
                  placeholder="Caminho ou URL da imagem"
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Proxima sessao</span>
                <input
                  className={styles.formInput}
                  type="datetime-local"
                  value={worldForm.nextSession}
                  onChange={event => setWorldForm(prev => ({ ...prev, nextSession: event.target.value }))}
                />
              </label>
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={worldForm.safeConfiguration}
                  onChange={event => setWorldForm(prev => ({ ...prev, safeConfiguration: event.target.checked }))}
                />
                <span>Iniciar em configuracao segura</span>
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Descricao</span>
                <textarea
                  className={styles.formTextarea}
                  rows={3}
                  value={worldForm.description}
                  onChange={event => setWorldForm(prev => ({ ...prev, description: event.target.value }))}
                  placeholder="Opcional"
                />
              </label>
              {formError && <div className={styles.formError}>{formError}</div>}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryBtn} type="button" onClick={() => setModal(null)} disabled={creatingWorld}>
                Cancelar
              </button>
              <button className={styles.primaryBtn} type="submit" disabled={!worldForm.name.trim() || !worldForm.systemId || creatingWorld}>
                {creatingWorld ? 'Criando...' : 'Criar mundo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === 'editWorld' && selectedWorld && (
        <div className={styles.modalOverlay} onMouseDown={() => { if (!savingWorld) { setModal(null); setSelectedWorld(null) } }}>
          <form className={styles.modalLarge} onSubmit={handleEditWorld} onMouseDown={event => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <strong>Editar mundo</strong>
              <button className={styles.modalClose} type="button" onClick={() => { setModal(null); setSelectedWorld(null) }} disabled={savingWorld}>
                x
              </button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Titulo do mundo</span>
                <input
                  className={styles.formInput}
                  value={worldForm.name}
                  onChange={event => setWorldForm(prev => ({ ...prev, name: event.target.value }))}
                  autoFocus
                />
              </label>
              <div className={styles.formGrid}>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Caminho dos dados</span>
                  <input
                    className={styles.formInput}
                    value={worldForm.dataPath}
                    onChange={event => setWorldForm(prev => ({ ...prev, dataPath: event.target.value }))}
                  />
                </label>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Sistema</span>
                  <select
                    className={styles.formSelect}
                    value={worldForm.systemId}
                    onChange={event => setWorldForm(prev => ({ ...prev, systemId: event.target.value }))}
                  >
                    {systems.map(system => (
                      <option key={system.id} value={system.id}>{system.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Imagem de fundo da entrada</span>
                <input
                  className={styles.formInput}
                  value={worldForm.backgroundImage}
                  onChange={event => setWorldForm(prev => ({ ...prev, backgroundImage: event.target.value }))}
                  placeholder="Caminho ou URL da imagem"
                />
              </label>
              <div className={styles.formGrid}>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Tema de entrada</span>
                  <select
                    className={styles.formSelect}
                    value={worldForm.joinTheme}
                    onChange={event => setWorldForm(prev => ({ ...prev, joinTheme: event.target.value }))}
                  >
                    {JOIN_THEMES.map(theme => (
                      <option key={theme.id} value={theme.id}>{theme.label}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Proxima sessao</span>
                  <input
                    className={styles.formInput}
                    type="datetime-local"
                    value={worldForm.nextSession}
                    onChange={event => setWorldForm(prev => ({ ...prev, nextSession: event.target.value }))}
                  />
                </label>
              </div>
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={worldForm.safeConfiguration}
                  onChange={event => setWorldForm(prev => ({ ...prev, safeConfiguration: event.target.checked }))}
                />
                <span>Iniciar em configuracao segura</span>
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Descricao do mundo</span>
                <textarea
                  className={styles.formTextarea}
                  rows={7}
                  value={worldForm.description}
                  onChange={event => setWorldForm(prev => ({ ...prev, description: event.target.value }))}
                  placeholder="Texto que aparece na tela de entrada da sessao"
                />
              </label>
              {formError && <div className={styles.formError}>{formError}</div>}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryBtn} type="button" onClick={() => { setModal(null); setSelectedWorld(null) }} disabled={savingWorld}>
                Cancelar
              </button>
              <button className={styles.primaryBtn} type="submit" disabled={!worldForm.name.trim() || !worldForm.systemId || savingWorld}>
                {savingWorld ? 'Salvando...' : 'Salvar mundo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === 'system' && (
        <div className={styles.modalOverlay} onMouseDown={() => !creatingSystem && setModal(null)}>
          <form className={styles.modal} onSubmit={handleCreateSystem} onMouseDown={event => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <strong>Criar sistema</strong>
              <button className={styles.modalClose} type="button" onClick={() => setModal(null)} disabled={creatingSystem}>
                x
              </button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Nome</span>
                <input
                  className={styles.formInput}
                  value={systemForm.name}
                  onChange={event => setSystemForm(prev => ({ ...prev, name: event.target.value }))}
                  autoFocus
                  placeholder="Ex: Tormenta, D&D, Ordem, sistema proprio"
                />
              </label>
              <div className={styles.formGrid}>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Regra/base</span>
                  <input
                    className={styles.formInput}
                    value={systemForm.ruleset}
                    onChange={event => setSystemForm(prev => ({ ...prev, ruleset: event.target.value }))}
                    placeholder="Opcional"
                  />
                </label>
                <label className={styles.formRow}>
                  <span className={styles.formLabel}>Versao</span>
                  <input
                    className={styles.formInput}
                    value={systemForm.version}
                    onChange={event => setSystemForm(prev => ({ ...prev, version: event.target.value }))}
                    placeholder="Opcional"
                  />
                </label>
              </div>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Descricao</span>
                <textarea
                  className={styles.formTextarea}
                  rows={3}
                  value={systemForm.description}
                  onChange={event => setSystemForm(prev => ({ ...prev, description: event.target.value }))}
                  placeholder="Opcional"
                />
              </label>
              {formError && <div className={styles.formError}>{formError}</div>}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryBtn} type="button" onClick={() => setModal(null)} disabled={creatingSystem}>
                Cancelar
              </button>
              <button className={styles.primaryBtn} type="submit" disabled={!systemForm.name.trim() || creatingSystem}>
                {creatingSystem ? 'Criando...' : 'Criar sistema'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
