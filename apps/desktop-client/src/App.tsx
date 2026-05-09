import React, { useState } from 'react';

function App() {
  const [roomCode] = useState('DNG-8421');

  return (
    <div className="w-screen h-screen bg-background flex flex-col font-sans text-slate-900">
      {/* Top Navbar - Clean White with elegant border */}
      <header className="h-16 bg-panel border-b border-slate-200 flex items-center justify-between px-6 z-20 shadow-sm relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/30 text-lg">
            V
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-none">
              VTT <span className="text-indigo-600">Lite</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5 uppercase tracking-wider">A Masmorra do Dragão</p>
          </div>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold">CÓDIGO DE ACESSO</span>
            <span className="text-indigo-700 font-mono font-black tracking-widest text-lg bg-indigo-100 px-2 rounded">{roomCode}</span>
          </div>
          
          <button className="bg-indigo-600 hover:bg-indigo-700 transition-colors px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Convidar Jogadores
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar - Floating style */}
        <aside className="w-20 bg-background flex flex-col items-center py-6 gap-5 z-10 border-r border-slate-200">
          <ToolButton icon="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" active tooltip="Mover (V)" />
          <ToolButton icon="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" tooltip="Área (A)" />
          <ToolButton icon="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" tooltip="Desenhar (D)" />
          <div className="w-10 h-px bg-slate-200 my-2"></div>
          <ToolButton icon="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" tooltip="Névoa (F)" />
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 relative bg-grid-pattern cursor-crosshair overflow-hidden shadow-inner">
          
          {/* Mock Map Image Background (Forest/Grass feel to give it life) */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          {/* Beautiful Modern Tokens */}
          <Token x={300} y={200} color="bg-emerald-500" name="Mago (Lucas)" hp="24/24" img="🧙‍♂️" />
          <Token x={450} y={250} color="bg-blue-500" name="Guerreiro (João)" hp="45/45" img="⚔️" />
          <Token x={350} y={400} color="bg-rose-500" name="Goblin" hp="7/7" isEnemy img="👺" />
          <Token x={500} y={400} color="bg-rose-500" name="Goblin" hp="2/7" isEnemy img="👺" />

          {/* Distance Ruler Mock (Clean Orange line) */}
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            <line x1="475" y1="275" x2="375" y2="425" stroke="#f97316" strokeWidth="3" strokeDasharray="6,6" />
            <rect x="395" y="340" width="50" height="26" rx="13" fill="#f97316" className="shadow-md" />
            <text x="420" y="357" fill="#fff" fontSize="13" textAnchor="middle" fontWeight="800">15m</text>
          </svg>
        </main>

        {/* Right Sidebar - Chat & Events (Clean Card UI) */}
        <aside className="w-96 bg-panel border-l border-slate-200 flex flex-col z-10 shadow-glass relative">
          <div className="h-16 border-b border-slate-100 flex items-center px-6 bg-slate-50/50 backdrop-blur">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Painel de Ações</h2>
          </div>
          
          <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto bg-slate-50/30">
            {/* Event Logs */}
            <LogEntry time="19:02" author="Sistema" text="Lucas conectou via Mobile." system />
            <LogEntry time="19:04" author="Mestre" text="O combate começou! Rolem iniciativa." system />
            
            {/* Beautiful Dice Roll Event Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <div className="flex justify-between items-start mb-3 pl-2">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">⚔️</span>
                  João (Guerreiro)
                </span>
                <span className="text-xs font-semibold text-slate-400">19:05</span>
              </div>
              <p className="text-sm font-medium text-slate-600 mb-3 pl-2">Atacou o Goblin com <span className="font-bold text-slate-800">Espada Longa</span></p>
              
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 ml-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-xs font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">d20</span>
                  <span className="text-lg font-black text-slate-700">18</span>
                </div>
                <span className="text-slate-300 font-bold">+</span>
                <span className="text-md font-bold text-slate-500">5</span>
                <span className="text-slate-300 font-bold">=</span>
                <span className="text-2xl font-black text-indigo-600">23</span>
              </div>
            </div>

            {/* Beautiful Damage Event Card */}
            <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
              <div className="flex justify-between items-start mb-3 pl-2">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs">💥</span>
                  Sistema
                </span>
                <span className="text-xs font-semibold text-slate-400">19:05</span>
              </div>
              <p className="text-sm font-medium text-slate-600 pl-2">
                O <span className="font-bold text-rose-600 bg-rose-50 px-1 rounded">Goblin</span> sofreu dano cortante.
              </p>
              <div className="mt-3 ml-2 text-3xl font-black text-rose-600 tracking-tight">8 Dano</div>
            </div>
          </div>

          {/* Clean Input Area */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="relative">
              <input type="text" placeholder="Escreva uma mensagem..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium placeholder-slate-400" />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Modern Beautiful Components
const ToolButton = ({ icon, active = false, tooltip }: { icon: string, active?: boolean, tooltip: string }) => (
  <div className="group relative">
    <button className={`p-3.5 rounded-2xl transition-all duration-200 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700' : 'bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 shadow-sm hover:shadow-md'}`}>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon}></path>
      </svg>
    </button>
    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
      {tooltip}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
    </div>
  </div>
);

const Token = ({ x, y, color, name, hp, isEnemy = false, img }: { x: number, y: number, color: string, name: string, hp: string, isEnemy?: boolean, img: string }) => (
  <div className="absolute flex flex-col items-center gap-2 group cursor-grab hover:z-20 transition-transform hover:scale-110" style={{ left: x, top: y }}>
    {/* Avatar Circle with beautiful shadow and border */}
    <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center text-2xl shadow-xl shadow-black/10 relative border-[3px] border-white z-10 transition-shadow group-hover:shadow-2xl`}>
      {img}
      {/* HP Ring indicator */}
      <svg className="absolute -inset-[3px] w-[calc(100%+6px)] h-[calc(100%+6px)] -rotate-90 pointer-events-none">
        <circle cx="50%" cy="50%" r="48%" fill="none" stroke={isEnemy ? '#fda4af' : '#86efac'} strokeWidth="3" opacity="0.3" />
        <circle cx="50%" cy="50%" r="48%" fill="none" stroke={isEnemy ? '#e11d48' : '#22c55e'} strokeWidth="3" strokeDasharray="100 100" strokeDashoffset={hp.includes('2/7') ? '70' : '0'} className="transition-all duration-500" />
      </svg>
    </div>
    
    {/* Floating Name Badge */}
    <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border border-slate-200/50 shadow-sm text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap transform translate-y-1 group-hover:translate-y-0">
      {name} <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${isEnemy ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{hp}</span>
    </div>
  </div>
);

const LogEntry = ({ time, author, text, system = false }: { time: string, author: string, text: string, system?: boolean }) => (
  <div className="flex flex-col gap-1 px-2">
    <div className="flex items-center gap-2">
      <span className={`text-xs font-black uppercase tracking-wider ${system ? 'text-slate-400' : 'text-indigo-600'}`}>{author}</span>
      <span className="text-[10px] font-bold text-slate-400">{time}</span>
    </div>
    <p className={`text-sm font-medium ${system ? 'text-slate-500' : 'text-slate-700'}`}>{text}</p>
  </div>
);

export default App;
