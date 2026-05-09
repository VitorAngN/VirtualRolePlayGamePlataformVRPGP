import React, { useState } from 'react';
import VTT from './VTT';

type ViewState = 'LAUNCHER' | 'WORLD_DETAILS' | 'VTT';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('LAUNCHER');
  const [selectedWorld, setSelectedWorld] = useState<any>(null);

  const handleSelectWorld = (world: any) => {
    setSelectedWorld(world);
    setCurrentView('WORLD_DETAILS');
  };

  const handleJoinGame = () => {
    setCurrentView('VTT');
  };

  const handleReturnToSetup = () => {
    setCurrentView('LAUNCHER');
    setSelectedWorld(null);
  };

  return (
    <>
      {currentView === 'LAUNCHER' && <Launcher onSelectWorld={handleSelectWorld} />}
      {currentView === 'WORLD_DETAILS' && <WorldDetails world={selectedWorld} onJoin={handleJoinGame} onReturn={handleReturnToSetup} />}
      {currentView === 'VTT' && <VTT onExit={handleReturnToSetup} />}
    </>
  );
}

// ==========================================
// LAUNCHER VIEW (Foundry Style)
// ==========================================
function Launcher({ onSelectWorld }: { onSelectWorld: (w: any) => void }) {
  const [activeTab, setActiveTab] = useState('worlds');

  const mockWorlds = [
    { id: 1, title: 'Aventuras em Dalelands', nextSession: 'Monday, May 4', version: 'v12', img: 'https://i.pinimg.com/736x/21/df/b8/21dfb85d959ddba187f5d6f1c4df42b9.jpg' },
    { id: 2, title: 'A Praga da Seiva Pétrea', nextSession: 'Monday, Jul 7', version: 'v12', img: 'https://i.pinimg.com/736x/89/3b/b7/893bb7b9195b0a317426b3de6f95b50d.jpg' },
    { id: 3, title: 'Forgotten Realms', nextSession: 'Saturday, Feb 1', version: 'v12', img: 'https://i.pinimg.com/736x/b2/24/6e/b2246ee2116da1263d5967b55f1f7d99.jpg' },
  ];

  return (
    <div className="w-screen h-screen bg-[#0a0a0c] text-zinc-300 font-sans flex flex-col items-center justify-center relative overflow-hidden"
         style={{ backgroundImage: 'radial-gradient(circle at 50% 10%, #301010 0%, #0a0a0c 60%)' }}>
      
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/black-paper.png')" }}></div>

      {/* Main Container */}
      <div className="w-[1100px] h-[750px] flex flex-col z-10 relative mt-16">
        
        {/* Header / Logo */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 drop-shadow-[0_0_20px_rgba(220,38,38,0.3)]">
          <h1 className="text-4xl font-black tracking-tighter text-white" style={{ fontFamily: 'Georgia, serif' }}>VTT</h1>
          <div className="w-20 h-20 bg-orange-600 rounded-lg rotate-45 border-4 border-black flex items-center justify-center shadow-inner relative overflow-hidden">
            <span className="absolute -rotate-45 text-3xl font-black text-black">20</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white" style={{ fontFamily: 'Georgia, serif' }}>LITE</h1>
        </div>

        {/* Content Area */}
        <div className="flex gap-6 h-full mt-8">
          
          {/* Main Left Panel */}
          <div className="flex-[3] bg-[rgba(15,15,18,0.9)] border border-[#27272a] rounded-lg shadow-2xl flex flex-col overflow-hidden backdrop-blur-sm">
            
            {/* Tabs */}
            <div className="flex justify-around items-center h-16 border-b border-[#27272a] bg-black/40 px-4">
              <Tab active={activeTab === 'worlds'} onClick={() => setActiveTab('worlds')} icon="🌍" label="Game Worlds" />
              <Tab active={activeTab === 'systems'} onClick={() => setActiveTab('systems')} icon="🎲" label="Game Systems" />
              <Tab active={activeTab === 'modules'} onClick={() => setActiveTab('modules')} icon="🔌" label="Add-on Modules" />
            </div>

            {/* Panel Content */}
            <div className="p-6 flex-1 overflow-y-auto">
              
              {/* Toolbar */}
              <div className="flex gap-4 mb-6">
                <input type="text" placeholder="Filter Worlds..." className="flex-1 bg-black/50 border border-zinc-800 rounded px-4 py-2 text-sm focus:outline-none focus:border-orange-500/50" />
                <button className="bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 px-6 py-2 rounded text-sm font-bold border border-zinc-700 transition-colors">📥 Install World</button>
                <button className="bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 px-6 py-2 rounded text-sm font-bold border border-zinc-700 transition-colors">➕ Create World</button>
              </div>

              {/* Worlds Grid */}
              <div className="grid grid-cols-2 gap-5">
                {mockWorlds.map(world => (
                  <div key={world.id} onClick={() => onSelectWorld(world)} className="h-44 rounded-lg border border-zinc-800 relative overflow-hidden group cursor-pointer shadow-lg hover:border-orange-500/50 transition-colors">
                    <img src={world.img} alt={world.title} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity mix-blend-luminosity group-hover:mix-blend-normal" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    
                    <h3 className="absolute top-4 w-full text-center text-lg font-bold text-white tracking-wide" style={{ fontFamily: 'Georgia, serif', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                      {world.title}
                    </h3>
                    
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-xs font-bold">
                      <span className="text-zinc-400 bg-black/60 px-2 py-1 rounded">{world.nextSession}</span>
                      <div className="flex gap-2">
                        <span className="bg-green-900/80 text-green-400 border border-green-800 px-2 py-1 rounded">✔ v12</span>
                        <span className="bg-indigo-900/80 text-indigo-400 border border-indigo-800 px-2 py-1 rounded">⚑</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar (News) */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-[rgba(15,15,18,0.9)] border border-[#27272a] rounded-lg shadow-2xl p-5 backdrop-blur-sm flex-1">
              <h2 className="text-center font-bold text-orange-200/80 uppercase tracking-[0.2em] mb-5 text-xs flex items-center gap-4">
                <span className="flex-1 h-px bg-orange-900/50"></span> News <span className="flex-1 h-px bg-orange-900/50"></span>
              </h2>
              <div className="flex flex-col gap-4">
                <NewsBanner title="Version 1.0 Stable Release" img="https://i.pinimg.com/736x/8a/a5/d8/8aa5d8b2e3e5bc14d693f1bc44b1c70e.jpg" />
                <NewsBanner title="Try Out Scene Levels" img="https://i.pinimg.com/736x/a6/5c/49/a65c490a6eefae02a28114f05ab1c57c.jpg" />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-zinc-600 mt-6 text-sm font-semibold">Version 1.0 Build 001</div>
      </div>
    </div>
  );
}

// ==========================================
// WORLD DETAILS VIEW (Foundry Join Screen)
// ==========================================
function WorldDetails({ world, onJoin, onReturn }: { world: any, onJoin: () => void, onReturn: () => void }) {
  return (
    <div className="w-screen h-screen bg-black text-zinc-300 font-sans flex items-center justify-center relative overflow-hidden p-10">
      {/* Background Map Image */}
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url('${world.img}')`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(2px)' }}></div>
      <div className="absolute inset-0 border-[8px] border-[#222718] opacity-80 pointer-events-none"></div>

      <div className="w-full max-w-6xl h-full flex flex-col z-10">
        
        {/* Title */}
        <h1 className="text-center text-5xl font-black text-white mt-10 mb-16 uppercase drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]" style={{ fontFamily: 'Georgia, serif' }}>
          {world.title}
        </h1>

        {/* Content Layout */}
        <div className="flex gap-8 flex-1">
          
          {/* Left Column */}
          <div className="flex-[1.2] flex flex-col gap-6">
            
            {/* Join Form */}
            <div className="bg-[rgba(15,12,16,0.95)] border border-[#27272a] rounded-lg shadow-2xl p-6">
              <h2 className="text-center font-bold text-orange-200/80 uppercase tracking-widest mb-6 flex items-center gap-4">
                <span className="flex-1 h-px bg-orange-900/50"></span> Join Game Session <span className="flex-1 h-px bg-orange-900/50"></span>
              </h2>
              
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center gap-3 bg-[#201d24] border border-[#302c36] rounded p-2 focus-within:border-orange-500/50">
                  <span className="text-zinc-500 ml-2">👤</span>
                  <select className="flex-1 bg-transparent border-none text-zinc-200 focus:outline-none text-sm appearance-none">
                    <option>Gamemaster</option>
                    <option>Jogador 1</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-3 bg-[#201d24] border border-[#302c36] rounded p-2 focus-within:border-orange-500/50">
                  <span className="text-zinc-500 ml-2">🔑</span>
                  <input type="password" placeholder="Access Key" className="flex-1 bg-transparent border-none text-zinc-200 focus:outline-none text-sm placeholder-zinc-600" />
                </div>
              </div>

              <button onClick={onJoin} className="w-full bg-[#e69138] hover:bg-[#f6a148] text-black font-black uppercase text-sm py-3 rounded tracking-wider shadow-lg transition-colors">
                ✔ Join Game Session
              </button>
            </div>

            {/* Game Details */}
            <div className="bg-[rgba(15,12,16,0.95)] border border-[#27272a] rounded-lg shadow-2xl p-6">
              <h2 className="text-center font-bold text-orange-200/80 uppercase tracking-widest mb-6 flex items-center gap-4">
                <span className="flex-1 h-px bg-orange-900/50"></span> Game Details <span className="flex-1 h-px bg-orange-900/50"></span>
              </h2>
              
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-zinc-400 font-bold flex items-center gap-2"><span className="text-xs">🕒</span> Next Session</span>
                <span className="text-zinc-200 font-medium">{world.nextSession}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400 font-bold flex items-center gap-2"><span className="text-xs">👥</span> Current Players</span>
                <span className="text-zinc-200 font-medium">1 / 5</span>
              </div>
            </div>

            {/* Return Button */}
            <div className="bg-[rgba(15,12,16,0.95)] border border-[#27272a] rounded-lg shadow-2xl p-6 mt-auto">
              <h2 className="text-center font-bold text-orange-200/80 uppercase tracking-widest mb-6 flex items-center gap-4">
                <span className="flex-1 h-px bg-orange-900/50"></span> Return to Setup <span className="flex-1 h-px bg-orange-900/50"></span>
              </h2>
              
              <div className="flex items-center gap-3 bg-[#201d24] border border-[#302c36] rounded p-2 focus-within:border-orange-500/50 mb-4">
                <span className="text-zinc-500 ml-2">🔑</span>
                <input type="password" placeholder="Admin Password" className="flex-1 bg-transparent border-none text-zinc-200 focus:outline-none text-sm placeholder-zinc-600" />
              </div>

              <button onClick={onReturn} className="w-full bg-[#e69138] hover:bg-[#f6a148] text-black font-black uppercase text-sm py-3 rounded tracking-wider shadow-lg transition-colors">
                🔒 Return to Setup
              </button>
            </div>
          </div>

          {/* Right Column - World Description */}
          <div className="flex-[2] bg-[rgba(15,12,16,0.95)] border border-[#27272a] rounded-lg shadow-2xl p-8 flex flex-col">
            <h2 className="text-center font-bold text-orange-200/80 uppercase tracking-widest mb-8 flex items-center gap-4">
              <span className="flex-1 h-px bg-orange-900/50"></span> World Description <span className="flex-1 h-px bg-orange-900/50"></span>
            </h2>
            
            <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed">
              <p className="mb-4">
                Mergulhe em uma campanha épica pelas regiões indomadas de Dalelands, investigando as antigas ruínas protegidas pela selva densa de Chult.
              </p>
              <p>
                Este mundo utiliza o sistema D&D 5e e está configurado para uma experiência de sobrevivência extrema com escassez de recursos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents for Launcher
const Tab = ({ active, label, icon, onClick }: { active: boolean, label: string, icon: string, onClick: () => void }) => (
  <button onClick={onClick} className={`flex items-center gap-2 text-lg font-bold px-4 py-3 border-b-2 transition-colors ${active ? 'text-orange-400 border-orange-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`} style={{ fontFamily: 'Georgia, serif' }}>
    <span className="text-xl">{icon}</span> {label}
  </button>
);

const NewsBanner = ({ title, img }: { title: string, img: string }) => (
  <div className="h-28 rounded border border-zinc-800 relative overflow-hidden group cursor-pointer">
    <img src={img} alt="news" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
    <h3 className="absolute bottom-3 w-full text-center text-sm font-bold text-white tracking-wide" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
      {title}
    </h3>
  </div>
);

export default App;
