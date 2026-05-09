import React, { useState } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('combat');
  const [hp, setHp] = useState(45);
  const maxHp = 45;

  return (
    <div className="w-full h-screen bg-background flex flex-col font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-accent/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header - Character Identity */}
      <header className="px-6 pt-10 pb-6 bg-card border-b border-white/5 rounded-b-3xl shadow-xl z-10 relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-1">Guerreiro</h1>
            <p className="text-sm font-medium text-accent">Nível 5 • Humano Fighter</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center relative overflow-hidden shadow-inner">
             {/* Character Avatar Mock */}
             <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-black"></div>
             <span className="text-2xl relative z-10">⚔️</span>
          </div>
        </div>

        {/* Big Health Bar */}
        <div className="bg-black/50 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pontos de Vida</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-black ${hp <= 15 ? 'text-red-500' : 'text-health'}`}>{hp}</span>
              <span className="text-sm font-bold text-gray-500">/{maxHp}</span>
            </div>
          </div>
          <div className="h-4 w-full bg-black rounded-full overflow-hidden border border-white/5 relative">
            <div 
              className={`h-full transition-all duration-500 ease-out ${hp <= 15 ? 'bg-red-500' : 'bg-health'}`}
              style={{ width: `${(hp / maxHp) * 100}%` }}
            ></div>
            {/* Glossy highlight */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10"></div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => setHp(Math.max(0, hp - 5))}
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-xl font-bold text-lg border border-red-500/20 active:scale-95 transition-all"
            >-5</button>
            <button 
              onClick={() => setHp(Math.max(0, hp - 1))}
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-xl font-bold text-lg border border-red-500/20 active:scale-95 transition-all"
            >-1</button>
            <button 
              onClick={() => setHp(Math.min(maxHp, hp + 1))}
              className="flex-1 bg-health/10 hover:bg-health/20 text-health py-3 rounded-xl font-bold text-lg border border-health/20 active:scale-95 transition-all"
            >+1</button>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto p-6 pb-24 z-0">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatBox label="CA" value="18" icon="🛡️" />
          <StatBox label="Desloc." value="9m" icon="👢" />
          <StatBox label="Profic." value="+3" icon="✨" />
        </div>

        {/* Weapons & Actions */}
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Ações de Combate</h2>
        
        <div className="flex flex-col gap-4">
          <ActionCard 
            title="Espada Longa" 
            type="Melee Weapon" 
            hit="+6" 
            damage="1d8 + 4" 
            dmgType="Cortante" 
            color="border-accent/30 bg-accent/5"
            glow="shadow-accent/10"
          />
          <ActionCard 
            title="Besta Leve" 
            type="Ranged Weapon (24m)" 
            hit="+4" 
            damage="1d8 + 2" 
            dmgType="Perfurante" 
          />
          <ActionCard 
            title="Retomar Fôlego" 
            type="Bonus Action" 
            hit="Auto" 
            damage="1d10 + 5" 
            dmgType="Cura"
            color="border-health/30 bg-health/5"
            glow="shadow-health/10"
          />
        </div>
      </main>

      {/* Floating Dice Roller Button */}
      <button className="absolute bottom-24 right-6 w-16 h-16 bg-gradient-to-br from-accent to-red-700 rounded-full shadow-[0_0_30px_rgba(200,35,51,0.4)] flex items-center justify-center text-3xl hover:scale-105 active:scale-95 transition-all border border-red-400/30">
        🎲
      </button>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full h-20 bg-card border-t border-white/5 flex items-center justify-around px-2 pb-4 pt-2 z-20">
        <NavButton icon="⚔️" label="Combate" active={activeTab === 'combat'} onClick={() => setActiveTab('combat')} />
        <NavButton icon="📜" label="Perícias" active={activeTab === 'skills'} onClick={() => setActiveTab('skills')} />
        <NavButton icon="🎒" label="Inventário" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
        <NavButton icon="📖" label="Magias" active={activeTab === 'spells'} onClick={() => setActiveTab('spells')} />
      </nav>
    </div>
  );
}

// Subcomponents
const StatBox = ({ label, value, icon }: { label: string, value: string, icon: string }) => (
  <div className="bg-card border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg relative overflow-hidden">
    <span className="text-xl mb-1">{icon}</span>
    <span className="text-2xl font-black text-white">{value}</span>
    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
  </div>
);

const ActionCard = ({ title, type, hit, damage, dmgType, color = "border-white/5 bg-card", glow = "shadow-black" }: any) => (
  <div className={`rounded-2xl p-5 border ${color} shadow-lg ${glow} relative overflow-hidden group active:scale-[0.98] transition-transform`}>
    {/* Ripple Effect base */}
    <div className="absolute inset-0 bg-white/0 group-active:bg-white/5 transition-colors duration-75"></div>
    
    <div className="flex justify-between items-start mb-3 relative z-10">
      <div>
        <h3 className="text-lg font-bold text-white mb-0.5">{title}</h3>
        <p className="text-xs text-gray-500 font-medium">{type}</p>
      </div>
      <div className="bg-black/50 px-3 py-1 rounded-full border border-white/5 flex flex-col items-center">
        <span className="text-[10px] text-gray-500 font-bold uppercase">To Hit</span>
        <span className="text-sm font-black text-white">{hit}</span>
      </div>
    </div>
    
    <div className="flex items-center justify-between relative z-10">
      <div className="flex items-center gap-2">
        <span className="text-xl font-black text-accent">{damage}</span>
        <span className="text-xs text-gray-400 font-medium">{dmgType}</span>
      </div>
      <button className="bg-white/10 hover:bg-white/20 text-white text-sm font-bold py-2 px-6 rounded-xl transition-colors shadow-inner backdrop-blur-md">
        Rolar
      </button>
    </div>
  </div>
);

const NavButton = ({ icon, label, active, onClick }: { icon: string, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 w-20 rounded-xl transition-all ${active ? 'text-white scale-105' : 'text-gray-500 hover:text-gray-300'}`}
  >
    <span className="text-2xl filter drop-shadow-md">{icon}</span>
    <span className={`text-[10px] font-bold tracking-wide ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
    {active && <div className="w-1 h-1 bg-accent rounded-full mt-0.5 absolute bottom-1"></div>}
  </button>
);

export default App;
