import React, { useState } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('combat');
  const [hp, setHp] = useState(45);
  const maxHp = 45;

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col font-sans max-w-md mx-auto overflow-hidden relative">
      {/* Dynamic Background Glow - Subtle elegant gradients */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-100 to-transparent pointer-events-none opacity-60"></div>
      <div className="absolute top-10 -right-20 w-64 h-64 bg-emerald-200/30 blur-[60px] rounded-full pointer-events-none"></div>

      {/* Header - Character Identity (Clean White Card) */}
      <header className="px-6 pt-12 pb-8 bg-white border-b border-slate-100 rounded-b-[40px] shadow-soft z-10 relative">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800 mb-0.5">Guerreiro</h1>
            <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">
              Lvl 5 • Humano Fighter
            </span>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white border-2 border-indigo-100 flex items-center justify-center relative overflow-hidden shadow-md">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-500 opacity-10"></div>
             <span className="text-3xl relative z-10">⚔️</span>
          </div>
        </div>

        {/* Big Health Bar (Apple Health style) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-end mb-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Pontos de Vida</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-black tracking-tighter ${hp <= 15 ? 'text-rose-500' : 'text-emerald-500'}`}>{hp}</span>
              <span className="text-sm font-bold text-slate-400">/{maxHp}</span>
            </div>
          </div>
          
          <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
            <div 
              className={`h-full transition-all duration-500 ease-out rounded-full relative ${hp <= 15 ? 'bg-gradient-to-r from-rose-400 to-rose-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
              style={{ width: `${(hp / maxHp) * 100}%` }}
            >
              {/* Gloss highlight */}
              <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/30 rounded-t-full"></div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-5">
            <button 
              onClick={() => setHp(Math.max(0, hp - 5))}
              className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 py-3 rounded-2xl font-black text-lg border border-rose-100 active:scale-95 transition-all shadow-sm"
            >-5</button>
            <button 
              onClick={() => setHp(Math.max(0, hp - 1))}
              className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 py-3 rounded-2xl font-black text-lg border border-rose-100 active:scale-95 transition-all shadow-sm"
            >-1</button>
            <button 
              onClick={() => setHp(Math.min(maxHp, hp + 1))}
              className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 py-3 rounded-2xl font-black text-lg border border-emerald-100 active:scale-95 transition-all shadow-sm"
            >+1</button>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto p-6 pb-28 z-0">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatBox label="CA" value="18" icon="🛡️" color="text-indigo-600" />
          <StatBox label="Desloc" value="9m" icon="👢" color="text-amber-500" />
          <StatBox label="Profic" value="+3" icon="✨" color="text-violet-500" />
        </div>

        {/* Weapons & Actions */}
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          Ações Rápidas
        </h2>
        
        <div className="flex flex-col gap-4">
          <ActionCard 
            title="Espada Longa" 
            type="Arma Corpo a Corpo" 
            hit="+6" 
            damage="1d8 + 4" 
            dmgType="Cortante" 
            emoji="🗡️"
          />
          <ActionCard 
            title="Besta Leve" 
            type="Arma à Distância (24m)" 
            hit="+4" 
            damage="1d8 + 2" 
            dmgType="Perfurante" 
            emoji="🏹"
          />
          <ActionCard 
            title="Retomar Fôlego" 
            type="Ação Bônus" 
            hit="Auto" 
            damage="1d10 + 5" 
            dmgType="Cura"
            emoji="❤️"
            isHeal
          />
        </div>
      </main>

      {/* Floating Dice Roller Button (Vibrant & Beautiful) */}
      <button className="absolute bottom-24 right-6 w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl shadow-[0_8px_30px_rgba(99,102,241,0.5)] flex items-center justify-center text-3xl hover:scale-105 active:scale-95 active:rotate-12 transition-all border border-indigo-400/50 z-30">
        🎲
      </button>

      {/* Bottom Navigation (Modern iOS App Style) */}
      <nav className="absolute bottom-0 w-full h-20 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 flex items-center justify-around px-4 pb-5 pt-3 z-40">
        <NavButton icon="⚔️" label="Combate" active={activeTab === 'combat'} onClick={() => setActiveTab('combat')} />
        <NavButton icon="📜" label="Perícias" active={activeTab === 'skills'} onClick={() => setActiveTab('skills')} />
        <NavButton icon="🎒" label="Inventário" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
        <NavButton icon="📖" label="Magias" active={activeTab === 'spells'} onClick={() => setActiveTab('spells')} />
      </nav>
    </div>
  );
}

// Modern Clean Subcomponents
const StatBox = ({ label, value, icon, color }: { label: string, value: string, icon: string, color: string }) => (
  <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-sm relative overflow-hidden group">
    <div className={`text-xl mb-1 ${color} opacity-80 group-hover:scale-110 transition-transform`}>{icon}</div>
    <span className="text-2xl font-black text-slate-800">{value}</span>
    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);

const ActionCard = ({ title, type, hit, damage, dmgType, emoji, isHeal = false }: any) => (
  <div className={`rounded-3xl p-5 border bg-white shadow-soft relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer ${isHeal ? 'border-emerald-100 hover:border-emerald-300' : 'border-slate-100 hover:border-indigo-200'}`}>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isHeal ? 'bg-emerald-50' : 'bg-slate-50'}`}>
          {emoji}
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-800 leading-tight">{title}</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">{type}</p>
        </div>
      </div>
      <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex flex-col items-center shadow-inner">
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Acerto</span>
        <span className="text-sm font-black text-slate-700">{hit}</span>
      </div>
    </div>
    
    <div className="flex items-center justify-between relative z-10 pl-13">
      <div className="flex items-center gap-2">
        <span className={`text-xl font-black ${isHeal ? 'text-emerald-500' : 'text-indigo-600'}`}>{damage}</span>
        <span className="text-xs text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-md">{dmgType}</span>
      </div>
      <button className={`text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-colors shadow-md active:scale-95 ${isHeal ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'}`}>
        ROLAR
      </button>
    </div>
  </div>
);

const NavButton = ({ icon, label, active, onClick }: { icon: string, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 p-2 w-16 rounded-xl transition-all relative ${active ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
  >
    <span className="text-2xl filter drop-shadow-sm">{icon}</span>
    <span className={`text-[10px] font-bold tracking-wide transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
    {active && <div className="absolute -top-3 w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.8)]"></div>}
  </button>
);

export default App;
