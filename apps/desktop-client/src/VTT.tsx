import React, { useState } from 'react';

export default function VTT({ onExit }: { onExit: () => void }) {
  const [activeTool, setActiveTool] = useState<string>('token');

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-zinc-900 font-sans text-sm selection:bg-orange-500/30">
      
      {/* MAP BACKGROUND (Fixed Image URL to reliable source) */}
      <div 
        className="absolute inset-0 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=2000&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.6) contrast(1.2)'
        }}
      >
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '100px 100px' }}
        ></div>
      </div>

      {/* LEFT TOOLBAR (Foundry Exact Style: Grey, Square buttons, slightly transparent) */}
      <aside className="absolute left-2 top-20 bg-[rgba(100,100,105,0.85)] border border-zinc-600 rounded-sm shadow-xl backdrop-blur-sm flex flex-col z-20 w-12 py-1 gap-1">
        
        <ToolButton id="token" icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" active={activeTool === 'token'} onClick={setActiveTool} />
        <ToolButton id="measure" icon="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" active={activeTool === 'measure'} onClick={setActiveTool} />
        <ToolButton id="draw" icon="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" active={activeTool === 'draw'} onClick={setActiveTool} />
        <ToolButton id="walls" icon="M4 6h16M4 10h16M4 14h16M4 18h16" active={activeTool === 'walls'} onClick={setActiveTool} />
        <ToolButton id="light" icon="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" active={activeTool === 'light'} onClick={setActiveTool} />
        <ToolButton id="sounds" icon="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" active={activeTool === 'sounds'} onClick={setActiveTool} />
        <ToolButton id="notes" icon="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" active={activeTool === 'notes'} onClick={setActiveTool} />
        
        <div className="w-[80%] mx-auto h-px bg-zinc-500 my-1"></div>
        
        <button onClick={onExit} className="w-10 h-10 mx-auto flex items-center justify-center transition-colors text-zinc-300 hover:text-white hover:bg-zinc-600 rounded-sm" title="Retornar ao Launcher">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
        </button>
      </aside>

      {/* SUB-TOOLBAR (Grey like the main one, precise positioning) */}
      <div className="absolute left-16 bg-[rgba(100,100,105,0.85)] border border-zinc-600 rounded-sm shadow-xl backdrop-blur-sm flex flex-col gap-1 py-1 z-10 transition-all" style={{ top: getSubMenuTop(activeTool) }}>
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
          </>
        )}
      </div>

      {/* RIGHT SIDEBAR (Foundry Exact Style: White chat cards, grey background) */}
      <aside className="absolute right-0 top-0 bottom-0 w-[300px] bg-[#1a1a1c] border-l border-[#000] shadow-2xl flex flex-col z-20 font-sans">
        
        {/* Top Tabs */}
        <nav className="flex items-center justify-between px-1 py-1 bg-[#111] border-b border-black">
          <div className="flex w-full justify-around text-zinc-400">
            <RightNavButton icon="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" active title="Chat Message Log" />
            <RightNavButton icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" title="Combat Tracker" />
            <RightNavButton icon="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" title="Scenes" />
            <RightNavButton icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" title="Actors" />
          </div>
        </nav>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')]">
          
          {/* Card: White Item Description */}
          <div className="bg-[#f0f0ee] border border-[#a8a8a8] rounded shadow-sm text-black relative">
            <div className="px-2 py-1.5 border-b border-[#ccc] flex items-center gap-2 bg-[#e6e6e6]">
               <div className="w-8 h-8 bg-[url('https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=100&auto=format&fit=crop')] bg-cover border border-[#999] rounded-sm"></div>
               <div className="leading-tight">
                 <h4 className="font-bold text-sm m-0">Death Armor</h4>
                 <span className="text-[10px] text-zinc-600 block">2nd Level Necromancy</span>
               </div>
               <span className="absolute top-2 right-2 text-[10px] text-zinc-500">5d 17h ago</span>
            </div>
            <div className="p-2 text-xs">
              <p className="mb-2">For the duration, an inky aura surrounds one creature you touch. The target has <strong className="underline">Advantage on Death Saving Throws</strong>, and once per turn...</p>
              
              <div className="border border-[#ccc] rounded bg-white overflow-hidden mt-1">
                <button className="w-full hover:bg-zinc-100 py-1 font-bold text-[10px] border-b border-[#ccc] flex items-center justify-center gap-1">
                  ⟲ REFUND RESOURCE
                </button>
                <div className="bg-[#f5f5f5] py-1 text-center font-bold text-[10px] text-zinc-600 border-b border-[#ccc]">◎ TARGETS ◎</div>
              </div>
            </div>
          </div>

          {/* Card: Roll Result */}
          <div className="bg-[#f0f0ee] border border-[#a8a8a8] rounded shadow-sm text-black relative">
             <div className="px-2 py-1.5 border-b border-[#ccc] flex items-center gap-2 bg-[#e6e6e6]">
               <div className="w-6 h-6 bg-[url('https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=100&auto=format&fit=crop')] bg-cover border border-[#999] rounded-sm"></div>
               <div className="leading-tight">
                 <h4 className="font-bold text-sm m-0 text-indigo-900">Gaedrion</h4>
                 <span className="text-[10px] text-zinc-600 block">Real</span>
               </div>
               <span className="absolute top-2 right-2 text-[10px] text-zinc-500">5d 17h ago</span>
            </div>
            <div className="p-2 text-center">
              <span className="text-xs text-zinc-500 block mb-1">1d20 + 6 + 4</span>
              <div className="bg-white border border-[#ccc] p-1 rounded font-black text-2xl text-black">
                27
              </div>
            </div>
          </div>

          {/* Card: Chat Image */}
          <div className="bg-[#f0f0ee] border border-[#a8a8a8] rounded shadow-sm text-black">
            <div className="px-2 py-1 flex items-center gap-2 bg-[#e6e6e6] border-b border-[#ccc]">
               <div className="w-6 h-6 bg-red-800 rounded-sm"></div>
               <h4 className="font-bold text-sm m-0">Teseu</h4>
            </div>
            <div className="p-1">
              <img src="https://media1.tenor.com/m/Z-w2zH5s-w4AAAAd/elmo.gif" alt="Caos" className="w-full border border-zinc-400" />
            </div>
          </div>

        </div>

        {/* Chat Input */}
        <div className="p-2 bg-[#111] border-t border-black">
          <textarea 
            placeholder="Enter message" 
            className="w-full bg-[#111] border border-zinc-700 p-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 resize-none h-16 rounded-sm placeholder-zinc-700 italic"
          ></textarea>
        </div>
      </aside>

      {/* BOTTOM MACRO BAR (Grey, center bottom) */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center bg-[rgba(50,50,50,0.9)] border border-black shadow-2xl z-10 px-0.5 rounded-sm">
        {[1,2,3,4,5,6,7,8,9,0].map((num) => (
          <div key={num} className="w-10 h-10 border-r border-black/50 flex items-center justify-center hover:bg-zinc-600 cursor-pointer relative transition-colors">
            <span className="text-[10px] font-bold text-zinc-400 absolute top-0.5 left-1">{num}</span>
            {num === 1 && <span className="text-lg">🗡️</span>}
          </div>
        ))}
        <div className="w-10 h-10 flex items-center justify-center hover:bg-zinc-600 cursor-pointer text-zinc-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {/* SCENE HEADER & PLAYERS */}
      <div className="absolute top-2 left-64 flex gap-2 z-10">
        <div className="bg-[#111] border border-black rounded shadow px-3 py-1.5 flex items-center gap-3">
           <span className="font-bold text-zinc-300 text-xs tracking-wider">ta1naDaT</span>
           <button className="text-zinc-600 hover:text-white"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>
      </div>

    </div>
  );
}

// Logic to position the sub-menu correctly relative to the main toolbar
function getSubMenuTop(activeTool: string): number {
  switch(activeTool) {
    case 'token': return 80; // 20 (top) + 0 * 44 + offsets
    case 'measure': return 124; 
    case 'draw': return 168;
    case 'walls': return 212;
    default: return 80;
  }
}

// Main Toolbar Button
const ToolButton = ({ id, icon, active = false, onClick }: { id: string, icon: string, active?: boolean, onClick: (id: string) => void }) => (
  <button 
    onClick={() => onClick(id)}
    className={`w-10 h-10 mx-auto flex items-center justify-center transition-colors rounded-sm
      ${active ? 'border-2 border-orange-500 bg-[rgba(50,50,50,0.9)] text-orange-500' : 'border-2 border-transparent text-zinc-300 hover:text-white hover:bg-zinc-600'}`}
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}></path></svg>
  </button>
);

// Sub Toolbar Button
const SubToolButton = ({ icon, active = false, tooltip }: { icon: string, active?: boolean, tooltip?: string }) => (
  <div className="relative group mx-auto">
    <button className={`w-10 h-10 flex items-center justify-center transition-colors rounded-sm
      ${active ? 'border-2 border-orange-500 bg-[rgba(50,50,50,0.9)] text-orange-500' : 'border-2 border-transparent text-zinc-300 hover:text-white hover:bg-zinc-600'}`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}></path></svg>
    </button>
    <div className="absolute top-2 left-full ml-2 bg-black border border-zinc-700 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
      {tooltip}
    </div>
  </div>
);

// Right Navigation Tabs
const RightNavButton = ({ icon, active = false, title }: { icon: string, active?: boolean, title: string }) => (
  <button title={title} className={`p-2 transition-colors flex-1 flex justify-center ${active ? 'text-white border-b border-orange-500 shadow-[inset_0_-2px_0_#f97316]' : 'text-zinc-500 hover:text-white border-b border-transparent'}`}>
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}></path></svg>
  </button>
);
