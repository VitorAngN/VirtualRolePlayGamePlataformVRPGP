import React, { useState } from 'react';

export default function VTT({ onExit }: { onExit: () => void }) {
  // State for the primary selected tool category
  const [activeTool, setActiveTool] = useState<string>('token');

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-black font-sans text-sm">
      
      {/* MAP BACKGROUND */}
      <div 
        className="absolute inset-0 bg-zinc-900 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://i.pinimg.com/originals/a5/d5/d3/a5d5d36e2f1837b251fc4cf6dc6f571b.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.9)'
        }}
      >
        <div 
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '100px 100px' }}
        ></div>
      </div>

      {/* TOP LEFT - Player List (Top of screen) */}
      <div className="absolute top-0 left-16 flex gap-1 z-10 p-2">
        <div className="bg-[rgba(24,24,27,0.85)] border border-zinc-700/50 rounded shadow-md px-3 py-1 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></div>
          <span className="font-bold text-zinc-300 text-xs">Vitor (Mestre)</span>
        </div>
        <div className="bg-[rgba(24,24,27,0.85)] border border-zinc-700/50 rounded shadow-md px-3 py-1 flex items-center gap-2 opacity-80">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="font-medium text-zinc-400 text-xs">Lucas</span>
        </div>
      </div>

      {/* LEFT TOOLBAR (Foundry Style) */}
      <aside className="absolute left-2 top-14 bg-[rgba(24,24,27,0.9)] border border-zinc-700 rounded shadow-2xl backdrop-blur-md flex flex-col z-20 w-11 py-1">
        
        {/* Main Tools */}
        <ToolButton id="token" icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" active={activeTool === 'token'} onClick={setActiveTool} />
        <ToolButton id="measure" icon="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" active={activeTool === 'measure'} onClick={setActiveTool} />
        <ToolButton id="draw" icon="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" active={activeTool === 'draw'} onClick={setActiveTool} />
        <ToolButton id="walls" icon="M4 6h16M4 10h16M4 14h16M4 18h16" active={activeTool === 'walls'} onClick={setActiveTool} />
        <ToolButton id="light" icon="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" active={activeTool === 'light'} onClick={setActiveTool} />
        <ToolButton id="sounds" icon="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" active={activeTool === 'sounds'} onClick={setActiveTool} />
        <ToolButton id="notes" icon="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" active={activeTool === 'notes'} onClick={setActiveTool} />
        
        <div className="w-full h-px bg-zinc-700 my-1"></div>
        
        {/* Settings / Sair */}
        <button onClick={onExit} className="w-10 h-10 flex items-center justify-center transition-colors text-red-500 hover:text-red-400 hover:bg-zinc-800/50" title="Retornar ao Launcher">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
        </button>
      </aside>

      {/* SUB-TOOLBAR (Pops out to the right of the main toolbar based on activeTool) */}
      <div className="absolute left-14 bg-[rgba(24,24,27,0.9)] border border-zinc-700 rounded shadow-xl backdrop-blur-md flex z-10 transition-all" style={{ top: getSubMenuTop(activeTool) }}>
        
        {activeTool === 'token' && (
          <>
            <SubToolButton icon="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" active tooltip="Selecionar Tokens" />
            <SubToolButton icon="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" tooltip="Alvo" />
          </>
        )}

        {activeTool === 'measure' && (
          <>
            <SubToolButton icon="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" active tooltip="Distância Livre" />
            <SubToolButton icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" tooltip="Raio/Círculo" />
            <SubToolButton icon="M3 3l18 18M3 21l18-18" tooltip="Cone" />
            <SubToolButton icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" tooltip="Apagar Medições" />
          </>
        )}

        {activeTool === 'draw' && (
          <>
            <SubToolButton icon="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" active tooltip="Desenhar Linha" />
            <SubToolButton icon="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" tooltip="Retângulo" />
            <SubToolButton icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" tooltip="Limpar Desenhos" />
          </>
        )}
      </div>

      {/* BOTTOM MACRO BAR */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center bg-[rgba(24,24,27,0.9)] border border-zinc-700 rounded shadow-2xl backdrop-blur-md p-1 z-10">
        {[1,2,3,4,5,6,7,8,9,0].map((num) => (
          <div key={num} className="w-10 h-10 border-r border-zinc-700/50 flex items-center justify-center hover:bg-zinc-700/50 cursor-pointer relative group transition-colors">
            <span className="text-[10px] font-bold text-zinc-500 absolute top-1 left-1">{num}</span>
            {num === 1 && <span className="text-lg opacity-80">🗡️</span>}
            {num === 2 && <span className="text-lg opacity-80">🔥</span>}
          </div>
        ))}
      </div>

      {/* RIGHT SIDEBAR - TABS AND CHAT (Foundry Style) */}
      <aside className="absolute right-0 top-0 bottom-0 w-[340px] bg-[rgba(20,20,22,0.95)] border-l border-zinc-800 shadow-2xl flex flex-col z-20">
        
        {/* Very Top Tabs (Chat, Combat, Scenes, Actors, Items) */}
        <nav className="flex items-center justify-between px-1 py-1 bg-zinc-950 border-b border-zinc-800">
          <div className="flex w-full justify-around">
            <RightNavButton icon="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" active title="Chat Message Log" />
            <RightNavButton icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" title="Combat Tracker" />
            <RightNavButton icon="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" title="Scenes Directory" />
            <RightNavButton icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" title="Actors Directory" />
            <RightNavButton icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" title="Items Directory" />
            <RightNavButton icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" title="Settings" />
          </div>
        </nav>

        {/* Chat Log Area */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
          
          <div className="text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest my-2 border-b border-zinc-800 pb-2">Session Started</div>
          
          {/* Card: Item Description (Like Death Armor in screenshot) */}
          <div className="bg-[#e9e6e0] border border-zinc-700 rounded shadow-md overflow-hidden text-zinc-900">
            <div className="px-2 py-1 border-b border-zinc-300 flex items-center gap-2 bg-white">
               <div className="w-6 h-6 bg-indigo-900 rounded border border-zinc-400"></div>
               <div>
                 <h4 className="font-bold text-sm leading-tight">Manto da Morte</h4>
                 <span className="text-[10px] text-zinc-500">2nd Level Necromancy</span>
               </div>
            </div>
            <div className="p-2 text-xs">
              <p className="mb-2 text-justify">For the duration, an inky aura surrounds one creature you touch. The target has <strong className="bg-zinc-200 px-1 rounded">Advantage on Death Saving Throws</strong>, and once per turn when a creature hits it with a melee attack...</p>
              
              <div className="border border-zinc-300 rounded overflow-hidden mt-2">
                <button className="w-full bg-zinc-100 hover:bg-zinc-200 py-1 font-bold text-[10px] border-b border-zinc-300">⚔️ ROLAR ATAQUE</button>
                <div className="p-1 flex gap-1">
                  <div className="flex-1 text-center bg-zinc-200/50 py-0.5 rounded text-[10px]">
                    <span className="font-bold block">ALVO</span>
                    <span>1 Creature</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Chat Image (Like Elmo in screenshot) */}
          <div className="bg-[#1a1a1a] border border-zinc-700/50 rounded shadow-md overflow-hidden mt-2">
            <div className="bg-zinc-800 px-2 py-1 flex justify-between items-center">
              <span className="font-bold text-orange-500 text-xs">Mestre (Vitor)</span>
              <span className="text-[9px] text-zinc-500">19:42</span>
            </div>
            <div className="p-2">
              <img src="https://i.pinimg.com/originals/a6/5c/49/a65c490a6eefae02a28114f05ab1c57c.gif" alt="Caos" className="w-full rounded border border-zinc-800" />
            </div>
          </div>

          {/* Card: Roll Result */}
          <div className="bg-[#1a1a1a] border border-zinc-700/50 rounded shadow-md overflow-hidden mt-2">
            <div className="bg-zinc-800 px-2 py-1 flex justify-between items-center">
              <span className="font-bold text-blue-400 text-xs">Guerreiro (Lucas)</span>
              <span className="text-[9px] text-zinc-500">19:45</span>
            </div>
            <div className="p-2">
              <span className="text-xs font-bold text-zinc-400 block mb-1">Ataque (Espada Longa)</span>
              <div className="bg-zinc-950 border border-zinc-800 p-2 rounded flex justify-between items-center">
                <span className="font-mono text-zinc-500 text-[10px]">d20 (14) + 5</span>
                <span className="text-lg font-black text-green-500">19</span>
              </div>
            </div>
          </div>

        </div>

        {/* Chat Input & Tools (Foundry Style) */}
        <div className="p-2 bg-[#121214] border-t border-zinc-800 flex flex-col gap-2">
          
          {/* Quick Macro Bar above input */}
          <div className="flex gap-1">
             <button className="flex-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 text-xs py-1 rounded">D20</button>
             <button className="flex-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 text-xs py-1 rounded">D8</button>
             <button className="flex-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 text-xs py-1 rounded">D6</button>
             <button className="bg-orange-900/40 border border-orange-800 text-orange-500 hover:bg-orange-900/60 font-bold px-3 py-1 rounded text-xs flex items-center gap-1">
               🎲 Roll
             </button>
          </div>

          <textarea 
            placeholder="Enter message" 
            className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-zinc-200 focus:outline-none focus:border-orange-500 resize-none h-14 placeholder-zinc-700"
          ></textarea>
        </div>
      </aside>

      {/* TOKENS */}
      <div className="absolute cursor-pointer hover:z-20 group" style={{ left: 400, top: 400 }}>
        {/* Selection Glow (if active) */}
        <div className="absolute -inset-2 bg-orange-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="w-[90px] h-[90px] rounded-full border-[3px] border-indigo-400 shadow-[0_10px_20px_rgba(0,0,0,0.8)] relative overflow-hidden bg-zinc-800 flex items-center justify-center transition-transform group-hover:scale-105">
           <img src="https://i.pinimg.com/736x/8a/a5/d8/8aa5d8b2e3e5bc14d693f1bc44b1c70e.jpg" alt="token" className="w-full h-full object-cover" />
           <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] pointer-events-none"></div>
        </div>
        
        {/* Token Tools (Target/Config) appearing on hover */}
        <div className="absolute top-0 -right-6 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button className="w-6 h-6 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-orange-500 hover:bg-zinc-700"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg></button>
           <button className="w-6 h-6 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-red-500 hover:bg-zinc-700"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></button>
        </div>

        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-zinc-700 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-lg whitespace-nowrap backdrop-blur">Lucas</div>
        
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[70px] h-1.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-green-600" style={{ width: '100%' }}></div>
        </div>
      </div>

    </div>
  );
}

// Logic to position the sub-menu correctly relative to the main toolbar
function getSubMenuTop(activeTool: string): number {
  switch(activeTool) {
    case 'token': return 56; // 14 (top) + 0 * 40
    case 'measure': return 96; 
    case 'draw': return 136;
    case 'walls': return 176;
    default: return 56;
  }
}

// Main Toolbar Button
const ToolButton = ({ id, icon, active = false, onClick }: { id: string, icon: string, active?: boolean, onClick: (id: string) => void }) => (
  <button 
    onClick={() => onClick(id)}
    className={`w-10 h-10 flex items-center justify-center transition-colors relative mx-auto my-0.5 rounded-sm
      ${active ? 'bg-zinc-700/80 text-orange-500 shadow-[inset_3px_0_0_#f97316]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'}`}
  >
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}></path></svg>
  </button>
);

// Sub Toolbar Button
const SubToolButton = ({ icon, active = false, tooltip }: { icon: string, active?: boolean, tooltip?: string }) => (
  <div className="relative group">
    <button className={`w-10 h-10 flex items-center justify-center transition-colors
      ${active ? 'bg-zinc-700/80 text-orange-500' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}></path></svg>
    </button>
    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
      {tooltip}
    </div>
  </div>
);

// Right Navigation Tabs
const RightNavButton = ({ icon, active = false, title }: { icon: string, active?: boolean, title: string }) => (
  <button title={title} className={`p-2 transition-colors flex-1 flex justify-center ${active ? 'text-orange-500 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-300 border-b-2 border-transparent'}`}>
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}></path></svg>
  </button>
);
