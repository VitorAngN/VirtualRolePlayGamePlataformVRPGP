import React, { useState } from 'react';

function App() {
  const [roomCode] = useState('DNG-8421');

  return (
    <div className="w-screen h-screen bg-background flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-14 bg-panel border-b border-white/10 flex items-center justify-between px-6 shadow-md z-10 relative">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-accent to-red-900 flex items-center justify-center font-bold shadow-lg shadow-accent/20">
            VL
          </div>
          <h1 className="text-xl font-semibold tracking-wide text-gray-200">
            VTT <span className="text-accent font-light">Lite</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Código da Sala:</span>
            <span className="text-gold font-mono font-bold tracking-widest">{roomCode}</span>
          </div>
          
          <button className="bg-white/5 hover:bg-white/10 transition-colors px-4 py-1.5 rounded text-sm font-medium border border-white/10 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Convidar (QR Code)
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <aside className="w-16 bg-panel border-r border-white/10 flex flex-col items-center py-4 gap-4 z-10 shadow-xl">
          <ToolButton icon="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" active />
          <ToolButton icon="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          <ToolButton icon="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          <div className="w-8 h-px bg-white/10 my-2"></div>
          <ToolButton icon="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </aside>

        {/* Main Canvas Area (Mock) */}
        <main className="flex-1 relative bg-[#1a1a20] bg-grid-pattern cursor-crosshair overflow-hidden">
          {/* Mock Map Image Background (Darkened) */}
          <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>
          
          {/* Mock Tokens */}
          <Token x={300} y={200} color="bg-blue-500" name="Mago" hp="24/24" />
          <Token x={450} y={250} color="bg-green-600" name="Guerreiro" hp="45/45" />
          <Token x={350} y={400} color="bg-red-600" name="Goblin" hp="7/7" isEnemy />
          <Token x={500} y={400} color="bg-red-600" name="Goblin" hp="2/7" isEnemy />

          {/* Distance Ruler Mock */}
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            <line x1="475" y1="275" x2="375" y2="425" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="5,5" />
            <rect x="390" y="340" width="60" height="24" rx="4" fill="#000" opacity="0.8" />
            <text x="420" y="356" fill="#fff" fontSize="12" textAnchor="middle" fontWeight="bold">15 ft.</text>
          </svg>
        </main>

        {/* Right Sidebar - Chat & Events */}
        <aside className="w-80 bg-panel border-l border-white/10 flex flex-col z-10 shadow-xl">
          <div className="h-12 border-b border-white/10 flex items-center px-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Log de Combate</h2>
          </div>
          
          <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
            {/* Event Logs */}
            <LogEntry time="19:02" author="Guerreiro" text="entrou na sala via Celular." system />
            <LogEntry time="19:04" author="Mestre" text="rolou iniciativa." system />
            
            {/* Dice Roll Event */}
            <div className="bg-black/30 border border-white/5 rounded-md p-3">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-green-400">Guerreiro</span>
                <span className="text-xs text-gray-500">19:05</span>
              </div>
              <p className="text-sm text-gray-300 mb-2">Ataque com Espada Longa</p>
              <div className="flex items-center gap-3">
                <div className="bg-background rounded px-3 py-1.5 border border-white/10 flex items-center gap-2">
                  <span className="text-gray-400 text-xs font-mono">d20</span>
                  <span className="text-lg font-bold text-white">18</span>
                </div>
                <span className="text-gray-500">+</span>
                <span className="text-md font-bold text-gray-400">5</span>
                <span className="text-gray-500">=</span>
                <span className="text-xl font-black text-green-400">23</span>
              </div>
            </div>

            {/* Damage Event */}
            <div className="bg-red-900/20 border border-red-500/20 rounded-md p-3">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-green-400">Guerreiro</span>
                <span className="text-xs text-gray-500">19:05</span>
              </div>
              <p className="text-sm text-gray-300">Dano Cortante em <span className="text-red-400 font-semibold">Goblin</span></p>
              <div className="mt-2 text-2xl font-black text-red-500">8 de Dano</div>
            </div>
          </div>

          <div className="p-3 border-t border-white/10 bg-black/20">
            <input type="text" placeholder="Escreva uma mensagem..." className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" />
          </div>
        </aside>
      </div>
    </div>
  );
}

// Mock Components
const ToolButton = ({ icon, active = false }: { icon: string, active?: boolean }) => (
  <button className={`p-2.5 rounded-lg transition-all ${active ? 'bg-accent/20 text-accent shadow-lg shadow-accent/10 border border-accent/30' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}></path>
    </svg>
  </button>
);

const Token = ({ x, y, color, name, hp, isEnemy = false }: { x: number, y: number, color: string, name: string, hp: string, isEnemy?: boolean }) => (
  <div className="absolute flex flex-col items-center gap-1 group cursor-grab hover:z-20 transition-transform hover:scale-110" style={{ left: x, top: y }}>
    <div className={`w-12 h-12 rounded-full ${color} border-2 ${isEnemy ? 'border-red-500' : 'border-white'} shadow-xl shadow-black/50 flex items-center justify-center text-white font-bold text-sm relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent"></div>
      <span className="relative z-10 text-xl">♟</span>
      {/* HP Bar visual indicator */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 h-1/4">
        <div className={`h-full ${isEnemy ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: hp.includes('2/7') ? '28%' : '100%' }}></div>
      </div>
    </div>
    <div className="bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      {name} <span className={isEnemy ? 'text-red-400' : 'text-green-400'}>{hp}</span>
    </div>
  </div>
);

const LogEntry = ({ time, author, text, system = false }: { time: string, author: string, text: string, system?: boolean }) => (
  <div className="flex flex-col gap-0.5">
    <div className="flex items-center gap-2">
      <span className={`text-sm font-bold ${system ? 'text-gray-400' : 'text-blue-400'}`}>{author}</span>
      <span className="text-xs text-gray-600">{time}</span>
    </div>
    <p className={`text-sm ${system ? 'text-gray-400 italic' : 'text-gray-200'}`}>{text}</p>
  </div>
);

export default App;
