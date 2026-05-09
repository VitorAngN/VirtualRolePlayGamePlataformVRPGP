import React from 'react';

export default function VTT({ onExit }: { onExit: () => void }) {
  return (
    <div className="w-screen h-screen relative overflow-hidden bg-black font-sans text-sm">
      
      {/* MAP BACKGROUND - Immersive full bleed map */}
      <div 
        className="absolute inset-0 bg-zinc-900"
        style={{
          backgroundImage: `url('https://i.pinimg.com/originals/a5/d5/d3/a5d5d36e2f1837b251fc4cf6dc6f571b.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.8)'
        }}
      >
        {/* Grid Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
            backgroundSize: '80px 80px'
          }}
        ></div>
      </div>

      {/* TOP LEFT - Player List & Connection */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        <div className="bg-[rgba(24,24,27,0.85)] border border-zinc-700 rounded shadow-xl backdrop-blur-md px-3 py-1.5 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
          <span className="font-semibold text-zinc-300">Gamemaster [GM]</span>
        </div>
        <div className="bg-[rgba(24,24,27,0.85)] border border-zinc-700 rounded shadow-xl backdrop-blur-md px-3 py-1.5 flex items-center gap-3 opacity-70">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="font-medium text-zinc-400">Lucas (Mobile)</span>
        </div>
      </div>

      {/* LEFT TOOLBAR - Floating Compact Tools */}
      <aside className="absolute left-4 top-24 bg-[rgba(24,24,27,0.85)] border border-zinc-700 rounded shadow-2xl backdrop-blur-md flex flex-col z-10 w-10">
        <ToolButton icon="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" active />
        <ToolButton icon="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        <div className="w-full h-[1px] bg-zinc-700 my-1"></div>
        <ToolButton icon="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        <ToolButton icon="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        <div className="w-full h-[1px] bg-zinc-700 my-1"></div>
        <ToolButton icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        <div className="w-full h-[1px] bg-zinc-700 my-1"></div>
        {/* Sair Button */}
        <button onClick={onExit} className="w-10 h-10 flex items-center justify-center transition-colors text-red-500 hover:text-red-400 hover:bg-zinc-800/50" title="Voltar ao Launcher">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
        </button>
      </aside>

      {/* BOTTOM MACRO BAR */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center bg-[rgba(24,24,27,0.85)] border border-zinc-700 rounded shadow-2xl backdrop-blur-md p-1 z-10">
        {[1,2,3,4,5,6,7,8,9,0].map((num) => (
          <div key={num} className="w-10 h-10 border-r border-zinc-700/50 flex items-center justify-center hover:bg-zinc-700/50 cursor-pointer relative group transition-colors">
            <span className="text-[10px] font-bold text-zinc-500 absolute top-1 left-1">{num}</span>
            {num === 1 && <span className="text-lg">🗡️</span>}
            {num === 2 && <span className="text-lg">🔥</span>}
          </div>
        ))}
        <div className="w-10 h-10 flex items-center justify-center hover:bg-zinc-700/50 cursor-pointer text-zinc-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {/* RIGHT SIDEBAR - Scenes & Chat */}
      <aside className="absolute right-0 top-0 bottom-0 w-80 bg-[rgba(24,24,27,0.95)] border-l border-zinc-800 shadow-2xl flex flex-col z-20">
        
        {/* Right Sidebar Nav */}
        <nav className="flex items-center justify-between px-2 py-1 bg-zinc-950 border-b border-zinc-800">
          <div className="flex">
            <RightNavButton icon="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" active />
            <RightNavButton icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            <RightNavButton icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </div>
          <div className="w-5 h-5 rounded-full bg-orange-600 text-[10px] flex items-center justify-center font-bold text-white shadow-inner">2</div>
        </nav>

        {/* Chat Log Area */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          <div className="text-center text-xs font-bold text-zinc-600 uppercase tracking-widest my-2 border-b border-zinc-800 pb-2">Sessão Iniciada</div>
          
          <div className="bg-zinc-900 border border-zinc-700/50 rounded shadow-md overflow-hidden">
            <div className="bg-zinc-800 px-3 py-1.5 border-b border-zinc-700 flex justify-between items-center">
              <span className="font-bold text-orange-500">Mago</span>
              <span className="text-[10px] text-zinc-500">19:42</span>
            </div>
            <div className="p-3">
              <p className="text-zinc-300 italic mb-2">"Lança uma bola de fogo na torre!"</p>
              <div className="bg-zinc-950 border border-zinc-800 p-2 rounded text-center">
                <span className="text-xs text-zinc-500 block mb-1">Dano Flamejante (8d6)</span>
                <span className="text-xl font-black text-orange-500">28</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-2 bg-zinc-950 border-t border-zinc-800">
          <textarea 
            placeholder="Digite uma mensagem ou comando /r" 
            className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-zinc-200 focus:outline-none focus:border-orange-500 resize-none h-16 placeholder-zinc-600"
          ></textarea>
        </div>
      </aside>

      {/* TOKENS */}
      <div className="absolute cursor-grab hover:z-20 group" style={{ left: 320, top: 400 }}>
        <div className="w-20 h-20 rounded-full border-[3px] border-zinc-300 shadow-[0_10px_20px_rgba(0,0,0,0.8)] relative overflow-hidden bg-zinc-800 flex items-center justify-center transition-transform group-hover:scale-105">
           <img src="https://i.pinimg.com/736x/8a/a5/d8/8aa5d8b2e3e5bc14d693f1bc44b1c70e.jpg" alt="token" className="w-full h-full object-cover opacity-90" />
           <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] pointer-events-none"></div>
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-lg whitespace-nowrap">Lucas (Mago)</div>
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-zinc-900 border border-zinc-700 rounded-full overflow-hidden">
          <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
        </div>
      </div>
    </div>
  );
}

const ToolButton = ({ icon, active = false }: { icon: string, active?: boolean }) => (
  <button className={`w-10 h-10 flex items-center justify-center transition-colors ${active ? 'bg-zinc-700/80 text-orange-500 shadow-[inset_2px_0_0_#f97316]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}>
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}></path></svg>
  </button>
);

const RightNavButton = ({ icon, active = false }: { icon: string, active?: boolean }) => (
  <button className={`p-2 transition-colors ${active ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}></path></svg>
  </button>
);
