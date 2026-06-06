import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

type SystemFieldType = 'text' | 'number' | 'textarea' | 'checkbox';

type ActorData = Record<string, string | number | boolean>;

interface ApiWorld {
  id: string;
  name: string;
  description?: string;
  system?: string;
}

interface ApiSystemField {
  id: string;
  label: string;
  type: SystemFieldType;
  section: string;
  default_value: string | number | boolean;
  roll_formula?: string;
}

interface ApiSystemActorType {
  id: string;
  label: string;
  fields: ApiSystemField[];
}

interface ApiGameSystem {
  id: string;
  name: string;
  ruleset?: string;
  version?: string;
  actor_types?: ApiSystemActorType[];
  grid?: {
    distance: number;
    units: string;
  };
}

interface ApiActor {
  id: string;
  world_id: string;
  system_id?: string;
  name: string;
  type: string;
  data?: ActorData;
  level?: number;
  ancestry?: string;
  class_name?: string;
  hp?: number;
  max_hp?: number;
  ac?: number;
  notes?: string;
  portrait_asset_id?: string;
}

interface ApiAsset {
  id: string;
  name: string;
  kind: 'map' | 'token' | 'portrait';
  content_type: string;
  companion_url?: string;
}

interface CompanionSession {
  world: ApiWorld;
  system: ApiGameSystem | null;
  actor: ApiActor;
  actor_type: ApiSystemActorType | null;
  assets: ApiAsset[];
  player?: {
    name: string;
  };
  permissions?: CompanionPermissions;
  connected_at: string;
}

interface CompanionPermissions {
  view_actor: boolean;
  adjust_hp: boolean;
  roll: boolean;
  patch_actor: boolean;
  chat: boolean;
}

interface CompanionEventResponse {
  ok: boolean;
  session: CompanionSession;
  error?: string;
}

const statusFieldIds = ['hp', 'max_hp', 'ac', 'level', 'class_name', 'ancestry'];
const quickDice = [4, 6, 8, 10, 12, 20, 100];
const defaultPermissions: CompanionPermissions = {
  view_actor: true,
  adjust_hp: true,
  roll: true,
  patch_actor: false,
  chat: false,
};

function getInitialToken() {
  return new URLSearchParams(window.location.search).get('token')?.trim() || '';
}

function getApiBase() {
  const query = new URLSearchParams(window.location.search);
  return query.get('apiBase') || query.get('apiBaseUrl') || window.location.origin;
}

function valueFor(actor: ApiActor, field: ApiSystemField | { id: string; default_value?: string | number | boolean }) {
  if (actor.data && Object.prototype.hasOwnProperty.call(actor.data, field.id)) {
    return actor.data[field.id];
  }

  const legacy = actor as unknown as Record<string, string | number | boolean | undefined>;
  if (legacy[field.id] !== undefined) return legacy[field.id];

  return field.default_value ?? '';
}

function numberValue(actor: ApiActor, fieldId: string, fallback: number) {
  const value = valueFor(actor, { id: fieldId, default_value: fallback });
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringValue(actor: ApiActor, fieldId: string, fallback = '') {
  const value = valueFor(actor, { id: fieldId, default_value: fallback });
  return String(value || fallback);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.slice(0, 1).toUpperCase())
    .join('') || '?';
}

function fieldDisplayValue(actor: ApiActor, field: ApiSystemField) {
  const value = valueFor(actor, field);
  if (field.type === 'checkbox') return value ? 'Sim' : 'Nao';
  if (String(value).trim() === '') return '-';
  return String(value);
}

function groupFields(fields: ApiSystemField[]) {
  const sections = new Map<string, ApiSystemField[]>();
  for (const field of fields) {
    const section = field.section || 'Ficha';
    sections.set(section, [...(sections.get(section) || []), field]);
  }
  return Array.from(sections.entries()).map(([section, sectionFields]) => ({
    section,
    fields: sectionFields,
  }));
}

function normalizePermissions(permissions?: Partial<CompanionPermissions>) {
  return {
    ...defaultPermissions,
    ...(permissions || {}),
    view_actor: true,
  };
}

function App() {
  const [token, setToken] = useState(getInitialToken);
  const [tokenInput, setTokenInput] = useState(getInitialToken);
  const [session, setSession] = useState<CompanionSession | null>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [apiBase] = useState(getApiBase);
  const loadState = !token ? 'idle' : error ? 'error' : session ? 'ready' : 'loading';

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    fetch(`${apiBase}/api/companion/session/${encodeURIComponent(token)}`, {
      signal: controller.signal,
    })
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.error || `Falha HTTP ${response.status}`);
        }
        return body as CompanionSession;
      })
      .then(data => {
        setSession(data);
      })
      .catch(fetchError => {
        if (controller.signal.aborted) return;
        setSession(null);
        setError(fetchError instanceof Error ? fetchError.message : 'Falha ao carregar sessao.');
      });

    return () => controller.abort();
  }, [apiBase, token]);

  function handleConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextToken = tokenInput.trim();
    setSession(null);
    setError('');
    setActionError('');
    setToken(nextToken);
    const url = new URL(window.location.href);
    if (nextToken) {
      url.searchParams.set('token', nextToken);
    } else {
      url.searchParams.delete('token');
    }
    window.history.replaceState(null, '', url.toString());
  }

  async function sendCompanionEvent(type: string, payload: Record<string, string | number | boolean>) {
    if (!token) return;

    setPendingAction(type);
    setActionError('');

    try {
      const response = await fetch(`${apiBase}/api/companion/session/${encodeURIComponent(token)}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload }),
      });
      const body = await response.json().catch(() => ({})) as Partial<CompanionEventResponse>;
      if (!response.ok || !body.session) {
        throw new Error(body.error || `Falha HTTP ${response.status}`);
      }
      setSession(body.session);
    } catch (eventError) {
      setActionError(eventError instanceof Error ? eventError.message : 'Falha ao enviar acao para o desktop.');
    } finally {
      setPendingAction('');
    }
  }

  if (!token) {
    return (
      <Shell>
        <section className="grid min-h-dvh place-items-center px-5 py-8">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101114] p-5 shadow-2xl shadow-black/40">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#d99a3d]">VTT Lite</span>
            <h1 className="mt-3 text-3xl font-black leading-none text-[#f8ead0]">Companion mobile</h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Abra o link gerado na ficha pelo desktop ou cole o token da sessao.
            </p>

            <form className="mt-5 grid gap-3" onSubmit={handleConnect}>
              <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                Token
                <input
                  className="min-h-12 rounded-lg border border-white/10 bg-black/35 px-3 text-sm normal-case tracking-normal text-zinc-100 outline-none focus:border-[#d99a3d]"
                  onChange={event => setTokenInput(event.target.value)}
                  placeholder="Cole o token aqui"
                  value={tokenInput}
                />
              </label>
              <button className="min-h-12 rounded-lg bg-[#d99a3d] px-4 text-sm font-black text-black active:scale-[0.99]" type="submit">
                Conectar
              </button>
            </form>
          </div>
        </section>
      </Shell>
    );
  }

  if (loadState === 'loading') {
    return (
      <Shell>
        <CenteredStatus title="Carregando ficha" detail="Buscando a sessao no desktop..." />
      </Shell>
    );
  }

  if (loadState === 'error' || !session) {
    return (
      <Shell>
        <section className="grid min-h-dvh place-items-center px-5 py-8">
          <div className="w-full max-w-md rounded-2xl border border-[#ff786d]/30 bg-[#171010] p-5 shadow-2xl shadow-black/40">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ff8d7b]">Sem conexao</span>
            <h1 className="mt-3 text-2xl font-black text-[#ffe2dc]">Nao deu para abrir a ficha</h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{error || 'Token invalido ou desktop offline.'}</p>
            <form className="mt-5 grid gap-3" onSubmit={handleConnect}>
              <input
                className="min-h-12 rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-zinc-100 outline-none focus:border-[#d99a3d]"
                onChange={event => setTokenInput(event.target.value)}
                value={tokenInput}
              />
              <button className="min-h-12 rounded-lg bg-[#d99a3d] px-4 text-sm font-black text-black active:scale-[0.99]" type="submit">
                Tentar novamente
              </button>
            </form>
          </div>
        </section>
      </Shell>
    );
  }

  return (
    <ConnectedSheet
      actionError={actionError}
      onAdjustHp={delta => sendCompanionEvent('actor.hp.adjust', { delta })}
      onRollDie={sides => sendCompanionEvent('actor.roll', { label: `d${sides}`, formula: `1d${sides}` })}
      onRollField={field => sendCompanionEvent('actor.roll', { label: field.label, formula: field.roll_formula || '1d20' })}
      pendingAction={pendingAction}
      session={session}
    />
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh overflow-hidden bg-[#050607] text-zinc-100">
      {children}
    </div>
  );
}

function CenteredStatus({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="grid min-h-dvh place-items-center px-5">
      <div className="text-center">
        <div className="mx-auto mb-5 h-12 w-12 rounded-xl border border-[#d99a3d]/60 bg-[#241708] shadow-[0_0_32px_rgba(217,154,61,0.18)]" />
        <h1 className="text-xl font-black text-[#f8ead0]">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{detail}</p>
      </div>
    </section>
  );
}

function ConnectedSheet({
  actionError,
  onAdjustHp,
  onRollDie,
  onRollField,
  pendingAction,
  session,
}: {
  actionError: string;
  onAdjustHp: (delta: number) => void;
  onRollDie: (sides: number) => void;
  onRollField: (field: ApiSystemField) => void;
  pendingAction: string;
  session: CompanionSession;
}) {
  const actor = session.actor;
  const actorType = session.actor_type;
  const fields = actorType?.fields || [];
  const sections = groupFields(fields);
  const portrait = actor.portrait_asset_id
    ? session.assets.find(asset => asset.id === actor.portrait_asset_id && asset.companion_url)
    : undefined;
  const hp = numberValue(actor, 'hp', 0);
  const maxHp = numberValue(actor, 'max_hp', hp || 1);
  const ac = numberValue(actor, 'ac', 10);
  const level = numberValue(actor, 'level', 1);
  const hpPercent = Math.max(0, Math.min(100, Math.round((hp / Math.max(maxHp, 1)) * 100)));
  const className = stringValue(actor, 'class_name', actorType?.label || actor.type);
  const ancestry = stringValue(actor, 'ancestry', '');
  const isBusy = Boolean(pendingAction);
  const permissions = normalizePermissions(session.permissions);

  return (
    <Shell>
      <div className="mx-auto flex h-dvh w-full max-w-[440px] flex-col bg-[#0b0c0f] shadow-2xl shadow-black/50">
        <header className="relative border-b border-white/10 bg-[#121217] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+16px)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#d99a3d] via-[#8d4634] to-[#518c82]" />

          <div className="flex items-start gap-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#d99a3d]/45 bg-black/35">
              {portrait?.companion_url ? (
                <img className="h-full w-full object-cover" src={portrait.companion_url} alt="" />
              ) : (
                <div className="grid h-full w-full place-items-center text-xl font-black text-[#d99a3d]">
                  {initials(actor.name)}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7fb9ad]">{session.world.name}</p>
              <h1 className="mt-1 truncate text-3xl font-black leading-none text-[#f8ead0]">{actor.name}</h1>
              <p className="mt-2 truncate text-xs font-semibold text-zinc-400">
                {className}{ancestry ? ` - ${ancestry}` : ''} - nivel {level}
              </p>
              {session.player?.name && (
                <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600">
                  Sessao: {session.player.name}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">
              ON
            </div>
          </div>

          <section className="mt-4 rounded-xl border border-white/10 bg-black/28 p-3">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Pontos de vida</p>
                <p className="text-xs text-zinc-500">{session.system?.name || 'Sistema local'}</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={hp <= Math.ceil(maxHp * 0.25) ? 'text-4xl font-black text-[#ff756b]' : 'text-4xl font-black text-[#8ddc9e]'}>
                  {hp}
                </span>
                <span className="text-sm font-bold text-zinc-500">/{maxHp}</span>
              </div>
            </div>

            <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-black">
              <div
                className={hp <= Math.ceil(maxHp * 0.25) ? 'h-full rounded-full bg-[#c84c44]' : 'h-full rounded-full bg-[#4ea861]'}
                style={{ width: `${hpPercent}%` }}
              />
            </div>

            {permissions.adjust_hp ? (
              <div className="mt-3 grid grid-cols-4 gap-2">
                <QuickButton disabled={isBusy} label="-5" tone="danger" onClick={() => onAdjustHp(-5)} />
                <QuickButton disabled={isBusy} label="-1" tone="danger" onClick={() => onAdjustHp(-1)} />
                <QuickButton disabled={isBusy} label="+1" tone="heal" onClick={() => onAdjustHp(1)} />
                <QuickButton disabled={isBusy} label="+5" tone="heal" onClick={() => onAdjustHp(5)} />
              </div>
            ) : (
              <p className="mt-3 rounded-lg border border-white/10 bg-black/24 p-3 text-xs font-semibold text-zinc-500">
                Esta sessao pode visualizar PV, mas nao pode alterar.
              </p>
            )}
          </section>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4">
          <div className="mb-4 grid grid-cols-3 gap-2">
            <StatBox label="CA" value={ac} />
            <StatBox label="Nivel" value={level} />
            <StatBox label="Grid" value={`${session.system?.grid?.distance ?? 5}${session.system?.grid?.units ?? 'ft'}`} />
          </div>

          {actionError && (
            <p className="mb-4 rounded-lg border border-[#ff786d]/25 bg-[#311512] p-3 text-sm text-[#ffb0a6]">{actionError}</p>
          )}

          {permissions.roll && (
            <section className="mb-4 rounded-xl border border-white/10 bg-white/[0.035] p-3">
              <h2 className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#7fb9ad]">Rolagem rapida</h2>
              <div className="grid grid-cols-7 gap-2">
                {quickDice.map(sides => (
                  <button
                    className="min-h-11 rounded-lg border border-white/10 bg-black/28 text-xs font-black text-[#f8ead0] disabled:cursor-wait disabled:opacity-45"
                    disabled={isBusy}
                    key={sides}
                    onClick={() => onRollDie(sides)}
                    type="button"
                  >
                    d{sides}
                  </button>
                ))}
              </div>
            </section>
          )}

          {sections.length === 0 && (
            <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <h2 className="text-sm font-black text-[#f8ead0]">Ficha sem campos</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                O sistema deste mundo ainda nao define campos para este tipo de ator.
              </p>
            </section>
          )}

          <div className="grid gap-4">
            {sections.map(section => (
              <section className="rounded-xl border border-white/10 bg-white/[0.035] p-3" key={section.section}>
                <h2 className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#d99a3d]">{section.section}</h2>
                <div className="grid gap-2">
                  {section.fields.map(field => (
                    <FieldRow
                      actor={actor}
                      canRoll={permissions.roll && Boolean(field.roll_formula)}
                      field={field}
                      key={field.id}
                      onRollField={() => onRollField(field)}
                      pending={isBusy}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </Shell>
  );
}

function FieldRow({
  actor,
  canRoll,
  field,
  onRollField,
  pending,
}: {
  actor: ApiActor;
  canRoll: boolean;
  field: ApiSystemField;
  onRollField: () => void;
  pending: boolean;
}) {
  const isStatus = statusFieldIds.includes(field.id);
  const value = fieldDisplayValue(actor, field);

  return (
    <article className={isStatus ? 'rounded-lg border border-[#d99a3d]/18 bg-[#d99a3d]/[0.08] p-3' : 'rounded-lg border border-white/10 bg-black/24 p-3'}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-black text-zinc-100">{field.label}</h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600">{field.id}</p>
        </div>
        {canRoll ? (
          <button
            className="shrink-0 rounded-md border border-[#d99a3d]/35 bg-[#d99a3d]/[0.12] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#f8d99b] disabled:cursor-wait disabled:opacity-45"
            disabled={pending}
            onClick={onRollField}
            type="button"
          >
            Rolar
          </button>
        ) : (
          <span className="shrink-0 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
            {field.type}
          </span>
        )}
      </div>
      <p className={field.type === 'textarea' ? 'mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300' : 'mt-3 text-xl font-black text-[#f8ead0]'}>
        {value}
      </p>
      {canRoll && field.roll_formula && (
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#d99a3d]/75">{field.roll_formula}</p>
      )}
    </article>
  );
}

function QuickButton({
  disabled,
  label,
  onClick,
  tone,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
  tone: 'danger' | 'heal';
}) {
  const toneClass = tone === 'danger' ? 'text-[#ff8b83]' : 'text-[#8ee0a0]';

  return (
    <button
      className={`min-h-10 rounded-lg border border-white/10 bg-white/[0.05] text-sm font-black ${toneClass} disabled:cursor-wait disabled:opacity-45`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
      <p className="truncate text-lg font-black text-zinc-100">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500">{label}</p>
    </div>
  );
}

export default App;
