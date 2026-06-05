import { useMemo, useState } from 'react';

type Tab = 'actions' | 'spells' | 'inventory' | 'skills';

type Action = {
  id: string;
  name: string;
  category: string;
  detail: string;
  hit: string;
  damage: string;
  tone: 'attack' | 'spell' | 'support';
};

type Spell = {
  id: string;
  name: string;
  level: 0 | 1 | 2 | 3;
  school: string;
  range: string;
  description: string;
  effect: string;
};

type Item = {
  id: string;
  name: string;
  quantity: number;
  detail: string;
  equipped?: boolean;
};

type Skill = {
  name: string;
  ability: string;
  value: number;
  proficient?: boolean;
};

type LogEntry = {
  id: number;
  title: string;
  detail: string;
};

type RollBreakdown = {
  total: number;
  rolls: number[];
  modifier: number;
};

const maxHp = 45;
const dice = [4, 6, 8, 10, 12, 20, 100];

const actions: Action[] = [
  {
    id: 'fire-bolt',
    name: 'Raio de Fogo',
    category: 'Truque de ataque',
    detail: 'Alcance 36m',
    hit: '+6',
    damage: '2d10',
    tone: 'attack',
  },
  {
    id: 'fireball',
    name: 'Bola de Fogo',
    category: 'Magia de 3o circulo',
    detail: 'CD 14 DES',
    hit: 'CD 14',
    damage: '8d6',
    tone: 'spell',
  },
  {
    id: 'dagger',
    name: 'Adaga',
    category: 'Arma leve',
    detail: 'Corpo a corpo',
    hit: '+4',
    damage: '1d4+2',
    tone: 'attack',
  },
];

const spells: Spell[] = [
  {
    id: 'shield',
    name: 'Escudo Arcano',
    level: 1,
    school: 'Abjuracao',
    range: 'Reacao',
    description: '+5 na CA ate o inicio do proximo turno.',
    effect: 'Defesa rapida',
  },
  {
    id: 'misty-step',
    name: 'Passo Nebuloso',
    level: 2,
    school: 'Conjuracao',
    range: '9m',
    description: 'Teleporte curto para escapar ou reposicionar.',
    effect: 'Mobilidade',
  },
  {
    id: 'fireball',
    name: 'Bola de Fogo',
    level: 3,
    school: 'Evocacao',
    range: '45m',
    description: 'Explosao em area com teste de Destreza.',
    effect: '8d6 fogo',
  },
  {
    id: 'minor-illusion',
    name: 'Ilusao Menor',
    level: 0,
    school: 'Ilusao',
    range: '9m',
    description: 'Cria som ou imagem pequena para distrair.',
    effect: 'Truque',
  },
];

const inventory: Item[] = [
  {
    id: 'staff',
    name: 'Cajado Arcano',
    quantity: 1,
    detail: 'Foco arcano equipado',
    equipped: true,
  },
  {
    id: 'potion',
    name: 'Pocao de Cura',
    quantity: 2,
    detail: 'Recupera 2d4+2 PV',
  },
  {
    id: 'scroll',
    name: 'Pergaminho de Sono',
    quantity: 1,
    detail: 'Uso unico, magia de 1o circulo',
  },
  {
    id: 'rations',
    name: 'Racoes',
    quantity: 5,
    detail: 'Suprimentos de viagem',
  },
];

const skills: Skill[] = [
  { name: 'Arcanismo', ability: 'INT', value: 6, proficient: true },
  { name: 'Historia', ability: 'INT', value: 6, proficient: true },
  { name: 'Investigacao', ability: 'INT', value: 3 },
  { name: 'Percepcao', ability: 'SAB', value: 1 },
  { name: 'Persuasao', ability: 'CAR', value: 2 },
  { name: 'Furtividade', ability: 'DES', value: 2 },
];

const conditions = ['Concentrando', 'Inspirado', 'Protegido'];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('actions');
  const [hp, setHp] = useState(maxHp);
  const [tempHp, setTempHp] = useState(0);
  const [slotState, setSlotState] = useState<Record<number, number>>({ 1: 4, 2: 3, 3: 2 });
  const [activeConditions, setActiveConditions] = useState<string[]>(['Concentrando']);
  const [diceOpen, setDiceOpen] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([
    { id: 1, title: 'Sessao conectada', detail: 'Lucas entrou na mesa Ruinas de Eldoria.' },
    { id: 2, title: 'Concentracao ativa', detail: 'Magia mantida enquanto nao falhar no teste.' },
  ]);

  const hpPercent = useMemo(() => Math.round((hp / maxHp) * 100), [hp]);

  function addLog(title: string, detail: string) {
    setLog((current) => [{ id: Date.now(), title, detail }, ...current].slice(0, 5));
  }

  function changeHp(amount: number) {
    const next = clamp(hp + amount, 0, maxHp);

    setHp(next);
    if (amount < 0) addLog('Dano aplicado', `${Math.abs(amount)} PV removidos. Total atual: ${next}/${maxHp}.`);
    if (amount > 0) addLog('Cura aplicada', `${amount} PV recuperados. Total atual: ${next}/${maxHp}.`);
  }

  function toggleCondition(condition: string) {
    const enabled = activeConditions.includes(condition);
    const next = enabled ? activeConditions.filter((item) => item !== condition) : [...activeConditions, condition];

    setActiveConditions(next);
    addLog(enabled ? 'Condicao removida' : 'Condicao ativa', condition);
  }

  function rollAction(action: Action) {
    const attackBonus = Number(action.hit.replace('+', ''));
    const attack = Number.isFinite(attackBonus) ? rollFormula(`1d20+${attackBonus}`) : null;
    const damage = rollFormula(action.damage);
    const attackText = attack ? `Acerto ${attack.total} (${formatRoll(attack)})` : action.hit;

    addLog(action.name, `${attackText}. Dano ${damage.total} (${formatRoll(damage)}).`);
  }

  function rollSimpleDie(sides: number) {
    const result = rollDie(sides);
    addLog(`d${sides}`, `Resultado: ${result}`);
  }

  function useSpell(spell: Spell) {
    if (spell.level === 0) {
      addLog(spell.name, 'Truque conjurado sem gastar espaco de magia.');
      return;
    }

    const remaining = slotState[spell.level] ?? 0;

    if (remaining <= 0) {
      addLog(spell.name, `Sem espacos de ${spell.level}o circulo disponiveis.`);
      return;
    }

    setSlotState({ ...slotState, [spell.level]: remaining - 1 });
    addLog(spell.name, `Magia conjurada. Restam ${remaining - 1} espacos de ${spell.level}o circulo.`);
  }

  function restoreSlot(level: number) {
    const maxByLevel: Record<number, number> = { 1: 4, 2: 3, 3: 2 };
    setSlotState({
      ...slotState,
      [level]: clamp((slotState[level] ?? 0) + 1, 0, maxByLevel[level]),
    });
  }

  function useItem(item: Item) {
    const healing = item.id === 'potion' ? rollFormula('2d4+2') : null;

    if (healing) {
      setHp(clamp(hp + healing.total, 0, maxHp));
      addLog(item.name, `Cura ${healing.total} PV (${formatRoll(healing)}).`);
      return;
    }

    addLog(item.name, item.equipped ? 'Item ja esta equipado.' : 'Item marcado para uso.');
  }

  function rollSkill(skill: Skill) {
    const result = rollFormula(`1d20+${skill.value}`);
    addLog(skill.name, `Teste ${result.total} (${formatRoll(result)}).`);
  }

  return (
    <div className="min-h-dvh bg-[#050607] text-slate-100">
      <div className="relative mx-auto flex min-h-dvh w-screen min-w-0 max-w-none flex-col overflow-hidden bg-[#0b0d10] shadow-2xl shadow-black/50 sm:max-w-[390px]">
        <header className="relative min-w-0 border-b border-white/10 bg-[#11151a] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+14px)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#d7a84f] via-[#a94736] to-[#4f8f80]" />

          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-[#d7a84f]/60 bg-[#201a12] text-xl font-black text-[#f3d98b] shadow-inner">
                LA
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#89b8ad]">Sala A7K2 online</p>
                <h1 className="truncate text-2xl font-black leading-tight text-[#f6e7c0]">Lucas Ardent</h1>
                <p className="truncate text-xs font-semibold text-slate-400">Mago humano - nivel 5</p>
              </div>
            </div>

            <div className="shrink-0 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-200">
              ON
            </div>
          </div>

          <section className="rounded-xl border border-white/10 bg-black/28 p-3 shadow-inner">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Pontos de vida</p>
                <p className="text-xs text-slate-400">Temp {tempHp} PV</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={hp <= 12 ? 'text-4xl font-black text-[#ff7066]' : 'text-4xl font-black text-[#84d493]'}>
                  {hp}
                </span>
                <span className="text-sm font-bold text-slate-500">/{maxHp}</span>
              </div>
            </div>

            <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-black">
              <div
                className={hp <= 12 ? 'h-full rounded-full bg-[#c84c44] transition-all' : 'h-full rounded-full bg-[#4ea861] transition-all'}
                style={{ width: `${hpPercent}%` }}
              />
            </div>

            <div className="mt-3 grid grid-cols-5 gap-2">
              <HpButton label="-5" onClick={() => changeHp(-5)} tone="danger" />
              <HpButton label="-1" onClick={() => changeHp(-1)} tone="danger" />
              <HpButton label="+1" onClick={() => changeHp(1)} tone="heal" />
              <HpButton label="+5" onClick={() => changeHp(5)} tone="heal" />
              <HpButton label="+T" onClick={() => setTempHp((current) => clamp(current + 3, 0, 20))} tone="temp" />
            </div>
          </section>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+104px)] pt-4">
          <div className="mb-4 grid min-w-0 grid-cols-4 gap-2">
            <StatBox label="CA" value="15" />
            <StatBox label="INIC" value="+2" />
            <StatBox label="DESL" value="9m" />
            <StatBox label="PROF" value="+3" />
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {conditions.map((condition) => (
              <button
                className={`shrink-0 rounded-full border px-3 py-2 text-xs font-bold transition ${
                  activeConditions.includes(condition)
                    ? 'border-[#d7a84f] bg-[#d7a84f]/18 text-[#f7d887]'
                    : 'border-white/10 bg-white/[0.04] text-slate-400'
                }`}
                key={condition}
                onClick={() => toggleCondition(condition)}
                type="button"
              >
                {condition}
              </button>
            ))}
          </div>

          {activeTab === 'actions' && <ActionsView actions={actions} onRoll={rollAction} />}
          {activeTab === 'spells' && (
            <SpellsView
              onRestoreSlot={restoreSlot}
              onUseSpell={useSpell}
              slotState={slotState}
              spells={spells}
            />
          )}
          {activeTab === 'inventory' && <InventoryView items={inventory} onUseItem={useItem} />}
          {activeTab === 'skills' && <SkillsView onRollSkill={rollSkill} skills={skills} />}

          <section className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.22em] text-[#d7a84f]">Historico</h2>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Mesa ao vivo</span>
            </div>
            <div className="space-y-2">
              {log.map((entry) => (
                <article className="rounded-lg border border-white/10 bg-black/25 p-3" key={entry.id}>
                  <h3 className="text-sm font-bold text-slate-100">{entry.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{entry.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </main>

        <button
          aria-label="Abrir rolagem de dados"
          className="absolute bottom-[calc(env(safe-area-inset-bottom)+78px)] right-4 z-30 grid h-14 w-14 place-items-center rounded-2xl border border-[#f0c46a]/50 bg-[#bd493d] text-sm font-black text-white shadow-xl shadow-black/40 active:scale-95"
          onClick={() => setDiceOpen(true)}
          type="button"
        >
          d20
        </button>

        <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto grid w-screen max-w-none grid-cols-4 border-t border-white/10 bg-[#101318]/95 px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 backdrop-blur sm:max-w-[390px]">
          <NavButton active={activeTab === 'actions'} label="Acoes" onClick={() => setActiveTab('actions')} symbol="ATK" />
          <NavButton active={activeTab === 'spells'} label="Magias" onClick={() => setActiveTab('spells')} symbol="MAG" />
          <NavButton active={activeTab === 'inventory'} label="Bolsa" onClick={() => setActiveTab('inventory')} symbol="INV" />
          <NavButton active={activeTab === 'skills'} label="Pericias" onClick={() => setActiveTab('skills')} symbol="PER" />
        </nav>

        {diceOpen && (
          <DiceSheet
            onClose={() => setDiceOpen(false)}
            onRoll={(sides) => {
              rollSimpleDie(sides);
            }}
          />
        )}
      </div>
    </div>
  );
}

function ActionsView({ actions: actionList, onRoll }: { actions: Action[]; onRoll: (action: Action) => void }) {
  return (
    <section>
      <SectionTitle eyebrow="Turno atual" title="Acoes rapidas" />
      <div className="space-y-3">
        {actionList.map((action) => (
          <ActionCard action={action} key={action.id} onRoll={() => onRoll(action)} />
        ))}
      </div>
    </section>
  );
}

function SpellsView({
  onRestoreSlot,
  onUseSpell,
  slotState,
  spells,
}: {
  onRestoreSlot: (level: number) => void;
  onUseSpell: (spell: Spell) => void;
  slotState: Record<number, number>;
  spells: Spell[];
}) {
  return (
    <section>
      <SectionTitle eyebrow="Livro preparado" title="Magias" />
      <div className="mb-4 grid grid-cols-3 gap-2">
        {[1, 2, 3].map((level) => (
          <button
            className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left active:bg-white/10"
            key={level}
            onClick={() => onRestoreSlot(level)}
            type="button"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{level}o circulo</p>
            <p className="mt-1 text-2xl font-black text-[#8fd1c4]">{slotState[level] ?? 0}</p>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {spells.map((spell) => (
          <article className="rounded-xl border border-white/10 bg-[#151a1f] p-4" key={spell.id}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d7a84f]">
                  {spell.level === 0 ? 'Truque' : `${spell.level}o circulo`} - {spell.school}
                </p>
                <h3 className="mt-1 text-base font-black text-slate-100">{spell.name}</h3>
              </div>
              <span className="shrink-0 rounded-md border border-white/10 bg-black/25 px-2 py-1 text-xs font-bold text-slate-300">
                {spell.range}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">{spell.description}</p>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{spell.effect}</span>
              <button className="rounded-lg bg-[#d7a84f] px-4 py-2 text-xs font-black text-[#1b1306] active:scale-95" onClick={() => onUseSpell(spell)} type="button">
                Conjurar
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function InventoryView({ items, onUseItem }: { items: Item[]; onUseItem: (item: Item) => void }) {
  return (
    <section>
      <SectionTitle eyebrow="Carga leve" title="Inventario" />
      <div className="space-y-3">
        {items.map((item) => (
          <article className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#151a1f] p-3" key={item.id}>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-white/10 bg-black/30 text-sm font-black text-[#d7a84f]">
              x{item.quantity}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-black text-slate-100">{item.name}</h3>
              <p className="truncate text-xs text-slate-400">{item.detail}</p>
            </div>
            <button className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-black text-slate-200 active:bg-white/10" onClick={() => onUseItem(item)} type="button">
              Usar
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function SkillsView({ onRollSkill, skills }: { onRollSkill: (skill: Skill) => void; skills: Skill[] }) {
  return (
    <section>
      <SectionTitle eyebrow="Testes" title="Pericias" />
      <div className="grid grid-cols-2 gap-3">
        {skills.map((skill) => (
          <button className="rounded-xl border border-white/10 bg-[#151a1f] p-3 text-left active:bg-white/10" key={skill.name} onClick={() => onRollSkill(skill)} type="button">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-100">{skill.name}</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{skill.ability}</p>
              </div>
              {skill.proficient && <span className="rounded-full bg-[#d7a84f]/18 px-2 py-1 text-[10px] font-black text-[#f7d887]">PROF</span>}
            </div>
            <p className="text-2xl font-black text-[#8fd1c4]">{formatModifier(skill.value)}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function DiceSheet({ onClose, onRoll }: { onClose: () => void; onRoll: (sides: number) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 px-3 pb-3 backdrop-blur-sm" onClick={onClose}>
      <section className="w-full max-w-[436px] rounded-2xl border border-white/10 bg-[#11151a] p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d7a84f]">Rolagem livre</p>
            <h2 className="text-lg font-black text-slate-100">Escolha o dado</h2>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-sm font-black text-slate-300" onClick={onClose} type="button">
            X
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {dice.map((sides) => (
            <button
              className="h-14 rounded-xl border border-white/10 bg-black/28 text-sm font-black text-[#f6e7c0] active:scale-95"
              key={sides}
              onClick={() => onRoll(sides)}
              type="button"
            >
              d{sides}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function ActionCard({ action, onRoll }: { action: Action; onRoll: () => void }) {
  const toneClass = {
    attack: 'from-[#332018] to-[#17191d] border-[#804735]/45',
    spell: 'from-[#182635] to-[#17191d] border-[#49738a]/45',
    support: 'from-[#1d2b25] to-[#17191d] border-[#4d8069]/45',
  }[action.tone];

  return (
    <article className={`overflow-hidden rounded-xl border bg-gradient-to-br ${toneClass} p-4 shadow-lg shadow-black/20`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d7a84f]">{action.category}</p>
          <h3 className="mt-1 text-lg font-black text-slate-100">{action.name}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">{action.detail}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Acerto</p>
          <p className="text-sm font-black text-white">{action.hit}</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Dano</p>
          <p className="text-xl font-black text-[#f2c76f]">{action.damage}</p>
        </div>
        <button className="shrink-0 rounded-lg bg-[#bd493d] px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-black/20 active:scale-95" onClick={onRoll} type="button">
          Rolar
        </button>
      </div>
    </article>
  );
}

function HpButton({ label, onClick, tone }: { label: string; onClick: () => void; tone: 'danger' | 'heal' | 'temp' }) {
  const toneClass = {
    danger: 'text-[#ff8b83]',
    heal: 'text-[#8ee0a0]',
    temp: 'text-[#8fd1c4]',
  }[tone];

  return (
    <button className={`h-10 rounded-lg border border-white/10 bg-white/[0.05] text-sm font-black ${toneClass} active:bg-white/10`} onClick={onClick} type="button">
      {label}
    </button>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
      <p className="text-lg font-black text-slate-100">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8fd1c4]">{eyebrow}</p>
      <h2 className="text-xl font-black text-[#f6e7c0]">{title}</h2>
    </div>
  );
}

function NavButton({ active, label, onClick, symbol }: { active: boolean; label: string; onClick: () => void; symbol: string }) {
  return (
    <button className={`rounded-xl px-2 py-2 transition ${active ? 'bg-[#d7a84f]/16 text-[#f7d887]' : 'text-slate-500'}`} onClick={onClick} type="button">
      <span className="mx-auto grid h-6 w-8 place-items-center rounded-md text-[10px] font-black">{symbol}</span>
      <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.12em]">{label}</span>
    </button>
  );
}

function rollDie(sides: number) {
  return Math.floor(Math.random() * sides) + 1;
}

function rollFormula(formula: string): RollBreakdown {
  const match = formula.trim().match(/^(\d+)d(\d+)([+-]\d+)?$/);

  if (!match) {
    return { total: 0, rolls: [], modifier: 0 };
  }

  const amount = Number(match[1]);
  const sides = Number(match[2]);
  const modifier = Number(match[3] ?? 0);
  const rolls = Array.from({ length: amount }, () => rollDie(sides));
  const total = rolls.reduce((sum, value) => sum + value, 0) + modifier;

  return { total, rolls, modifier };
}

function formatRoll(roll: RollBreakdown) {
  const base = roll.rolls.join('+');
  if (roll.modifier === 0) return base;
  return `${base}${roll.modifier > 0 ? '+' : ''}${roll.modifier}`;
}

function formatModifier(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default App;
