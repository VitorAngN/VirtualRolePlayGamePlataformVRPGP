import React, { useState } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('combat');
  const [hp, setHp] = useState(45);
  const maxHp = 45;

  return (
    <div className="w-full h-screen flex flex-col max-w-md mx-auto overflow-hidden relative" style={{ backgroundColor: '#0a0a0a' }}>
      
      {/* Texture Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/black-paper.png')" }}></div>

      {/* Header - Character Identity (Dark Fantasy Card) */}
      <header className="px-5 pt-10 pb-6 bg-[#171717] border-b border-[#262626] shadow-2xl z-10 relative">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {/* Avatar Hexagon or Circle */}
            <div className="w-14 h-14 rounded-full border-2 border-[#b91c1c] overflow-hidden relative shadow-[0_0_15px_rgba(185,28,28,0.3)]">
               <img src="https://i.pinimg.com/736x/8a/a5/d8/8aa5d8b2e3e5bc14d693f1bc44b1c70e.jpg" alt="Mago" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#d4af37] mb-0" style={{ fontFamily: 'Georgia, serif' }}>Lucas</h1>
              <span className="text-xs text-neutral-400 font-sans tracking-widest uppercase">Mago • Nvl 5</span>
            </div>
          </div>
        </div>

        {/* Health Bar (Gritty style) */}
        <div className="bg-[#0f0f0f] rounded p-4 border border-[#262626] shadow-inner relative">
          <div className="flex justify-between items-end mb-2 font-sans">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Pontos de Vida</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-black ${hp <= 15 ? 'text-red-600' : 'text-green-600'}`}>{hp}</span>
              <span className="text-sm font-bold text-neutral-600">/{maxHp}</span>
            </div>
          </div>
          
          <div className="h-4 w-full bg-black rounded-sm border border-[#262626] overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-300 ${hp <= 15 ? 'bg-red-700' : 'bg-green-700'}`}
              style={{ width: `${(hp / maxHp) * 100}%` }}
            >
               {/* Inner texture for health bar */}
               <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')" }}></div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 font-sans">
            <button onClick={() => setHp(Math.max(0, hp - 5))} className="flex-1 bg-[#262626] hover:bg-[#333] text-red-500 py-2 rounded-sm font-bold text-sm border border-[#404040] active:bg-[#111]">-5</button>
            <button onClick={() => setHp(Math.max(0, hp - 1))} className="flex-1 bg-[#262626] hover:bg-[#333] text-red-500 py-2 rounded-sm font-bold text-sm border border-[#404040] active:bg-[#111]">-1</button>
            <button onClick={() => setHp(Math.min(maxHp, hp + 1))} className="flex-1 bg-[#262626] hover:bg-[#333] text-green-500 py-2 rounded-sm font-bold text-sm border border-[#404040] active:bg-[#111]">+1</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-5 pb-28 z-0 font-sans">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatBox label="CA" value="12" />
          <StatBox label="Desloc" value="9m" />
          <StatBox label="Profic" value="+3" />
        </div>

        <h2 className="text-[11px] font-bold text-[#d4af37] uppercase tracking-widest mb-3 border-b border-[#262626] pb-1">Ações de Combate</h2>
        
        <div className="flex flex-col gap-3">
          <ActionCard title="Raio de Fogo" type="Truque (Ação)" hit="+6" damage="2d10" dmgType="Fogo" />
          <ActionCard title="Bola de Fogo" type="Magia 3º Círculo" hit="CD 14" damage="8d6" dmgType="Fogo" />
          <ActionCard title="Adaga" type="Arma Corpo-a-corpo" hit="+4" damage="1d4+2" dmgType="Perfurante" />
        </div>
      </main>

      {/* Floating Dice Button (Gritty) */}
      <button className="absolute bottom-24 right-5 w-14 h-14 bg-[#b91c1c] rounded border-2 border-[#7f1d1d] shadow-[0_4px_20px_rgba(185,28,28,0.4)] flex items-center justify-center text-2xl hover:bg-red-600 active:scale-95 transition-all z-30">
        🎲
      </button>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full h-16 bg-[#111] border-t border-[#262626] flex items-center justify-around px-2 pb-2 z-40 font-sans">
        <NavButton icon="⚔️" label="Ações" active={activeTab === 'combat'} onClick={() => setActiveTab('combat')} />
        <NavButton icon="✨" label="Magias" active={activeTab === 'spells'} onClick={() => setActiveTab('spells')} />
        <NavButton icon="🎒" label="Inventário" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
        <NavButton icon="📜" label="Perícias" active={activeTab === 'skills'} onClick={() => setActiveTab('skills')} />
      </nav>
    </div>
  );
}

// Dark Fantasy Subcomponents
const StatBox = ({ label, value }: { label: string, value: string }) => (
  <div className="bg-[#1a1a1a] border border-[#333] rounded p-3 flex flex-col items-center justify-center gap-1 shadow-inner relative">
    <div className="absolute top-0 left-0 w-full h-0.5 bg-[#d4af37]/30"></div>
    <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>{value}</span>
    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">{label}</span>
  </div>
);

const ActionCard = ({ title, type, hit, damage, dmgType }: any) => (
  <div className="bg-[#1a1a1a] border border-[#333] rounded-sm p-4 relative active:bg-[#222] transition-colors cursor-pointer">
    <div className="flex justify-between items-start mb-3">
      <div>
        <h3 className="text-base font-bold text-[#e5e5e5]" style={{ fontFamily: 'Georgia, serif' }}>{title}</h3>
        <p className="text-[10px] text-neutral-500 uppercase tracking-wide mt-0.5">{type}</p>
      </div>
      <div className="bg-black px-2 py-1 border border-[#333] rounded-sm flex items-center gap-1">
        <span className="text-[9px] text-neutral-500 uppercase">Acerto</span>
        <span className="text-xs font-bold text-white">{hit}</span>
      </div>
    </div>
    
    <div className="flex items-center justify-between border-t border-[#262626] pt-3">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-[#d4af37]">{damage}</span>
        <span className="text-[10px] text-neutral-400 uppercase">{dmgType}</span>
      </div>
      <button className="bg-[#b91c1c] text-white text-[10px] font-bold py-1.5 px-4 rounded-sm border border-[#7f1d1d] active:bg-[#991b1b]">
        ROLAR
      </button>
    </div>
  </div>
);

const NavButton = ({ icon, label, active, onClick }: { icon: string, label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 w-16 transition-colors ${active ? 'text-[#d4af37]' : 'text-neutral-600'}`}>
    <span className="text-xl opacity-90">{icon}</span>
    <span className={`text-[9px] font-bold tracking-widest uppercase ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
  </button>
);

export default App;
