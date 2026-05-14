import { useState, type SyntheticEvent } from 'react'
import styles from './Launcher.module.css'

interface World {
  id: number
  title: string
  nextSession: string
  img: string
  fallbackBg: string
}

const MOCK_WORLDS: World[] = [
  {
    id: 1,
    title: 'Aventuras em Dalelands',
    nextSession: 'Monday, May 4',
    img: 'https://i.pinimg.com/736x/21/df/b8/21dfb85d959ddba187f5d6f1c4df42b9.jpg',
    fallbackBg:
      'radial-gradient(circle at 22% 18%, rgba(230, 145, 56, 0.38), transparent 30%), linear-gradient(135deg, #392018 0%, #111827 55%, #081114 100%)',
  },
  {
    id: 2,
    title: 'A Praga da Seiva Pétrea',
    nextSession: 'Monday, Jul 7',
    img: 'https://i.pinimg.com/736x/89/3b/b7/893bb7b9195b0a317426b3de6f95b50d.jpg',
    fallbackBg:
      'radial-gradient(circle at 75% 24%, rgba(120, 113, 108, 0.42), transparent 32%), linear-gradient(135deg, #18251f 0%, #1a1418 52%, #09090b 100%)',
  },
  {
    id: 3,
    title: 'Forgotten Realms',
    nextSession: 'Saturday, Feb 1',
    img: 'https://i.pinimg.com/736x/b2/24/6e/b2246ee2116da1263d5967b55f1f7d99.jpg',
    fallbackBg:
      'radial-gradient(circle at 70% 12%, rgba(59, 130, 246, 0.32), transparent 28%), linear-gradient(135deg, #152033 0%, #251b14 58%, #0a0a0c 100%)',
  },
]

const NEWS = [
  {
    title: 'Version 1.0 Stable Release',
    img: 'https://i.pinimg.com/736x/8a/a5/d8/8aa5d8b2e3e5bc14d693f1bc44b1c70e.jpg',
    fallbackBg:
      'radial-gradient(circle at 20% 20%, rgba(230, 145, 56, 0.35), transparent 34%), linear-gradient(135deg, #20110e 0%, #111827 100%)',
  },
  {
    title: 'Try Out Scene Levels',
    img: 'https://i.pinimg.com/736x/a6/5c/49/a65c490a6eefae02a28114f05ab1c57c.jpg',
    fallbackBg:
      'radial-gradient(circle at 80% 18%, rgba(99, 102, 241, 0.28), transparent 32%), linear-gradient(135deg, #111827 0%, #201a10 100%)',
  },
]

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.hidden = true
}

// ──────────────────────────────────────────────
//  Sub-componentes
// ──────────────────────────────────────────────
interface TabProps {
  active: boolean
  label: string
  icon: string
  onClick: () => void
}

function Tab({ active, label, icon, onClick }: TabProps) {
  return (
    <button
      className={`${styles.tab} ${active ? styles.tabActive : ''}`}
      onClick={onClick}
    >
      <span className={styles.tabIcon}>{icon}</span>
      {label}
    </button>
  )
}

function NewsBanner({ title, img, fallbackBg }: { title: string; img: string; fallbackBg: string }) {
  return (
    <div className={styles.newsBanner} style={{ backgroundImage: fallbackBg }}>
      <img src={img} alt={title} className={styles.newsBannerImg} onError={hideBrokenImage} />
      <div className={styles.newsBannerOverlay} />
      <h3 className={styles.newsBannerTitle}>{title}</h3>
    </div>
  )
}

interface WorldCardProps {
  world: World
  onClick: () => void
}

function WorldCard({ world, onClick }: WorldCardProps) {
  return (
    <div
      className={styles.worldCard}
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{ backgroundImage: world.fallbackBg }}
    >
      <img src={world.img} alt={world.title} className={styles.worldCardImg} onError={hideBrokenImage} />
      <div className={styles.worldCardOverlay} />
      <h3 className={styles.worldCardTitle}>{world.title}</h3>
      <div className={styles.worldCardFooter}>
        <span className={styles.worldCardDate}>{world.nextSession}</span>
        <div className={styles.worldCardBadges}>
          <span className={styles.badgeGreen}>✔ v12</span>
          <span className={styles.badgeBlue}>⚑</span>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
//  Tela de detalhes do mundo (join)
// ──────────────────────────────────────────────
interface WorldDetailsProps {
  world: World
  onJoin: () => void
  onReturn: () => void
}

function WorldDetails({ world, onJoin, onReturn }: WorldDetailsProps) {
  return (
    <div className={styles.detailsRoot}>
      <div className={styles.detailsBg} style={{ backgroundImage: `url("${world.img}"), ${world.fallbackBg}` }} />
      <div className={styles.detailsFrame} />

      <div className={styles.detailsContent}>
        <h1 className={styles.detailsTitle}>{world.title}</h1>

        <div className={styles.detailsBody}>
          {/* Coluna esquerda */}
          <div className={styles.detailsLeft}>
            {/* Join form */}
            <div className={styles.detailsCard}>
              <div className={styles.sectionDivider}>Join Game Session</div>
              <div className={styles.formGroup}>
                <span className={styles.formIcon}>👤</span>
                <select className={styles.formSelect}>
                  <option>Gamemaster</option>
                  <option>Jogador 1</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <span className={styles.formIcon}>🔑</span>
                <input type="password" placeholder="Access Key" className={styles.formInput} />
              </div>
              <button className={styles.joinBtn} onClick={onJoin}>✔ Join Game Session</button>
            </div>

            {/* Game details */}
            <div className={styles.detailsCard}>
              <div className={styles.sectionDivider}>Game Details</div>
              <div className={styles.detailsRow}>
                <span className={styles.detailsLabel}>🕒 Next Session</span>
                <span>{world.nextSession}</span>
              </div>
              <div className={styles.detailsRow}>
                <span className={styles.detailsLabel}>👥 Players</span>
                <span>1 / 5</span>
              </div>
            </div>

            {/* Return */}
            <div className={styles.detailsCard}>
              <div className={styles.sectionDivider}>Return to Setup</div>
              <div className={styles.formGroup}>
                <span className={styles.formIcon}>🔑</span>
                <input type="password" placeholder="Admin Password" className={styles.formInput} />
              </div>
              <button className={styles.joinBtn} onClick={onReturn}>🔒 Return to Setup</button>
            </div>
          </div>

          {/* Coluna direita */}
          <div className={`${styles.detailsCard} ${styles.detailsRight}`}>
            <div className={styles.sectionDivider}>World Description</div>
            <p className={styles.detailsText}>
              Mergulhe em uma campanha épica pelas regiões indomadas de Dalelands, investigando
              as antigas ruínas protegidas pela selva densa de Chult.
            </p>
            <p className={styles.detailsText}>
              Utiliza o sistema D&D 5e com foco em sobrevivência e escassez de recursos.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
//  Launcher principal
// ──────────────────────────────────────────────
type LauncherView = 'list' | 'details'

interface LauncherProps {
  onEnterWorld: () => void
}

export default function Launcher({ onEnterWorld }: LauncherProps) {
  const [activeTab, setActiveTab] = useState('worlds')
  const [view, setView] = useState<LauncherView>('list')
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null)

  if (view === 'details' && selectedWorld) {
    return (
      <WorldDetails
        world={selectedWorld}
        onJoin={onEnterWorld}
        onReturn={() => { setView('list'); setSelectedWorld(null) }}
      />
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.bgTexture} />

      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoText}>VTT</span>
        <div className={styles.logoDie}>
          <span className={styles.logoDieNum}>20</span>
        </div>
        <span className={styles.logoText}>LITE</span>
      </div>

      {/* Main layout */}
      <div className={styles.container}>

        {/* Panel esquerdo */}
        <div className={styles.mainPanel}>

          {/* Tabs */}
          <div className={styles.tabBar}>
            <Tab active={activeTab === 'worlds'} icon="🌍" label="Game Worlds" onClick={() => setActiveTab('worlds')} />
            <Tab active={activeTab === 'systems'} icon="🎲" label="Game Systems" onClick={() => setActiveTab('systems')} />
            <Tab active={activeTab === 'modules'} icon="🔌" label="Add-on Modules" onClick={() => setActiveTab('modules')} />
          </div>

          {/* Conteúdo */}
          <div className={styles.panelBody}>
            {/* Toolbar */}
            <div className={styles.panelToolbar}>
              <input type="text" placeholder="Filter Worlds…" className={styles.filterInput} />
              <button className={styles.secondaryBtn}>📥 Install World</button>
              <button className={styles.secondaryBtn}>➕ Create World</button>
            </div>

            {/* Grid de mundos */}
            <div className={styles.worldsGrid}>
              {MOCK_WORLDS.map(w => (
                <WorldCard
                  key={w.id}
                  world={w}
                  onClick={() => { setSelectedWorld(w); setView('details') }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar direita (news) */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <div className={styles.sectionDivider}>News</div>
            <div className={styles.newsList}>
              {NEWS.map(item => (
                <NewsBanner
                  key={item.title}
                  title={item.title}
                  img={item.img}
                  fallbackBg={item.fallbackBg}
                />
              ))}
            </div>
          </div>
          <div className={styles.versionTag}>Version 1.0 Build 001</div>
        </div>

      </div>
    </div>
  )
}
