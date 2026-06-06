const crypto = require('node:crypto')
const fs = require('node:fs/promises')
const http = require('node:http')
const net = require('node:net')
const os = require('node:os')
const path = require('node:path')
const { WebSocketServer } = require('ws')

const DEFAULT_PORT = 5188
const MAX_PORT_ATTEMPTS = 20
const MAX_EVENT_BODY_BYTES = 64 * 1024
const DEFAULT_PERMISSIONS = Object.freeze({
  view_actor: true,
  adjust_hp: true,
  roll: true,
  patch_actor: false,
  chat: false,
})

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

function json(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function text(res, status, body) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

async function readJsonBody(req) {
  const chunks = []
  let size = 0

  for await (const chunk of req) {
    size += chunk.byteLength
    if (size > MAX_EVENT_BODY_BYTES) {
      throw new Error('Evento mobile grande demais.')
    }
    chunks.push(chunk)
  }

  const textBody = Buffer.concat(chunks).toString('utf-8').trim()
  return textBody ? JSON.parse(textBody) : {}
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1
}

function normalizePermissions(permissions = {}) {
  const normalized = { ...DEFAULT_PERMISSIONS }
  for (const key of Object.keys(DEFAULT_PERMISSIONS)) {
    if (Object.prototype.hasOwnProperty.call(permissions, key)) {
      normalized[key] = Boolean(permissions[key])
    }
  }
  normalized.view_actor = true
  return normalized
}

function normalizeFieldValue(field, value) {
  if (!field) return value
  if (field.type === 'number') {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) throw new Error(`Valor numerico invalido para "${field.label || field.id}".`)
    return parsed
  }
  if (field.type === 'checkbox') {
    if (typeof value === 'string') {
      return ['1', 'true', 'sim', 'yes', 'on'].includes(value.trim().toLowerCase())
    }
    return Boolean(value)
  }
  return String(value ?? '')
}

function savedPermissionForActor(actor, playerName) {
  const normalizedPlayer = String(playerName || '').trim().toLowerCase()
  if (!normalizedPlayer || !Array.isArray(actor?.companion_permissions)) return null
  return actor.companion_permissions.find(entry => String(entry?.player_name || '').trim().toLowerCase() === normalizedPlayer) || null
}

function assertPermission(session, permission) {
  if (session.permissions?.[permission] === false) {
    throw new Error('Esta sessao mobile nao tem permissao para esta acao.')
  }
}

function abilityModifier(value) {
  const score = Number(value)
  if (!Number.isFinite(score)) return 0
  return Math.floor((score - 10) / 2)
}

function actorValue(actor, fieldId, fallback) {
  if (actor?.data && Object.prototype.hasOwnProperty.call(actor.data, fieldId)) {
    return actor.data[fieldId]
  }
  if (actor && Object.prototype.hasOwnProperty.call(actor, fieldId)) {
    return actor[fieldId]
  }
  return fallback
}

function resolveActorReference(actor, reference) {
  const modifierMatch = String(reference).match(/^([a-z0-9_]+)\.mod$/i)
  if (modifierMatch) {
    return abilityModifier(actorValue(actor, modifierMatch[1], 10))
  }

  const value = actorValue(actor, reference, 0)
  if (typeof value === 'boolean') return value ? 1 : 0
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    throw new Error(`Campo "${reference}" nao e numerico para rolagem.`)
  }
  return numericValue
}

function resolveRollFormula(formula, actor) {
  return String(formula || '1d20')
    .trim()
    .replace(/@([a-z0-9_]+(?:\.mod)?)/gi, (_match, reference) => String(resolveActorReference(actor, reference)))
}

function rollFormula(formula, actor = null) {
  const resolvedFormula = actor ? resolveRollFormula(formula, actor) : String(formula || '1d20').trim()
  const compactFormula = resolvedFormula.replace(/\s+/g, '')
  if (!compactFormula) throw new Error('Formula de dado invalida.')

  const terms = compactFormula.match(/[+-]?[^+-]+/g) || []
  if (terms.join('') !== compactFormula) throw new Error('Formula de dado invalida.')

  const rolls = []
  let modifier = 0

  for (const rawTerm of terms) {
    const sign = rawTerm.startsWith('-') ? -1 : 1
    const term = rawTerm.replace(/^[+-]/, '')
    const diceMatch = term.match(/^(\d*)d(\d+)$/i)

    if (diceMatch) {
      const amount = Number(diceMatch[1] || 1)
      const sides = Number(diceMatch[2])
      if (!Number.isInteger(amount) || !Number.isInteger(sides) || amount < 1 || amount > 100 || sides < 2 || sides > 1000) {
        throw new Error('Formula de dado fora do limite permitido.')
      }

      for (let index = 0; index < amount; index += 1) {
        rolls.push(sign * rollDie(sides))
      }
      continue
    }

    const numberValue = Number(term)
    if (!Number.isFinite(numberValue)) {
      throw new Error('Formula de dado invalida.')
    }
    modifier += sign * numberValue
  }

  return {
    formula: compactFormula,
    rolls,
    modifier,
    total: rolls.reduce((sum, value) => sum + value, 0) + modifier,
  }
}

function isPortBusy(port) {
  return new Promise(resolve => {
    const tester = net.createServer()
    tester.once('error', () => resolve(true))
    tester.once('listening', () => {
      tester.close(() => resolve(false))
    })
    tester.listen(port, '0.0.0.0')
  })
}

async function findPort(preferredPort = DEFAULT_PORT) {
  for (let offset = 0; offset < MAX_PORT_ATTEMPTS; offset += 1) {
    const port = preferredPort + offset
    if (!(await isPortBusy(port))) return port
  }
  throw new Error('Nenhuma porta livre encontrada para o companion mobile.')
}

function getLanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter(Boolean)
    .filter(address => address.family === 'IPv4' && !address.internal)
    .map(address => address.address)
}

function urlForAsset(asset) {
  const match = String(asset?.url || '').match(/^vttlocal:\/\/asset\/([^/]+)\/([^/]+)\/(.+)$/)
  if (!match) return ''
  return `/api/companion/assets/${encodeURIComponent(match[1])}/${encodeURIComponent(match[2])}/${encodeURIComponent(match[3])}`
}

function serializeSession(snapshot, sessionOrActorId) {
  const actorId = typeof sessionOrActorId === 'string' ? sessionOrActorId : sessionOrActorId.actorId
  const permissions = typeof sessionOrActorId === 'string' ? normalizePermissions() : normalizePermissions(sessionOrActorId.permissions)
  const actor = snapshot.actors.find(item => item.id === actorId)
  if (!actor) throw new Error('Ficha nao encontrada para a sessao mobile.')

  const actorType = snapshot.system?.actor_types?.find(type => type.id === actor.type)
    ?? snapshot.system?.actor_types?.[0]
    ?? null
  const assets = (snapshot.assets || []).map(asset => ({
    ...asset,
    companion_url: urlForAsset(asset),
  }))

  return {
    world: snapshot.world,
    system: snapshot.system,
    actor,
    actor_type: actorType,
    assets,
    messages: snapshot.messages || [],
    player: {
      name: typeof sessionOrActorId === 'string'
        ? actor.name
        : String(sessionOrActorId.playerName || actor.name),
    },
    permissions,
    connected_at: new Date().toISOString(),
  }
}

function safeStaticPath(root, pathname) {
  const decoded = decodeURIComponent(pathname)
  const relative = decoded === '/' ? '/index.html' : decoded
  const target = path.resolve(root, `.${relative}`)
  const normalizedRoot = path.resolve(root)
  const normalizedRootWithSep = normalizedRoot.endsWith(path.sep) ? normalizedRoot : `${normalizedRoot}${path.sep}`
  if (target !== normalizedRoot && !target.startsWith(normalizedRootWithSep)) {
    return null
  }
  return target
}

function createCompanionServer({ store, mobileDistDir, preferredPort = DEFAULT_PORT, onEvent = () => {} }) {
  const sessions = new Map()
  const socketsByToken = new Map()
  let server = null
  let port = null
  let websocketServer = null

  function externalUrl(publicBaseUrl, token) {
    const rawUrl = String(publicBaseUrl || '').trim()
    if (!rawUrl) return ''

    try {
      const url = new URL(rawUrl)
      url.searchParams.set('token', token)
      return url.toString()
    } catch {
      return ''
    }
  }

  function baseUrls(token, publicBaseUrl = '') {
    const query = token ? `?token=${encodeURIComponent(token)}` : ''
    const lanUrls = getLanAddresses().map(address => `http://${address}:${port}/${query}`)
    const publicUrl = token ? externalUrl(publicBaseUrl, token) : ''
    const urls = publicUrl ? [publicUrl, ...lanUrls, `http://127.0.0.1:${port}/${query}`] : [...lanUrls, `http://127.0.0.1:${port}/${query}`]
    return {
      loopback: `http://127.0.0.1:${port}/${query}`,
      public: publicUrl,
      urls,
    }
  }

  function sendSocket(socket, payload) {
    if (socket.readyState !== socket.OPEN) return
    socket.send(JSON.stringify(payload))
  }

  async function sendSessionToSocket(socket, session) {
    const snapshot = await store.getWorldSnapshot(session.worldId)
    sendSocket(socket, { type: 'session', session: serializeSession(snapshot, session) })
  }

  function broadcastToSessionToken(token, payload) {
    const sockets = socketsByToken.get(token)
    if (!sockets) return
    for (const socket of sockets) {
      sendSocket(socket, payload)
    }
  }

  function broadcastToWorld(worldId, event) {
    for (const [token, session] of sessions) {
      if (session.worldId !== worldId) continue
      broadcastToSessionToken(token, { type: 'event', event })
    }
  }

  function publishEvent(event) {
    onEvent(event)
    broadcastToWorld(event.world_id, event)
  }

  async function handleApi(req, res, url) {
    if (req.method === 'OPTIONS') {
      json(res, 204, {})
      return true
    }

    if (url.pathname === '/api/health') {
      json(res, 200, { ok: true, running: Boolean(server), port })
      return true
    }

    const eventMatch = url.pathname.match(/^\/api\/companion\/session\/([^/]+)\/events$/)
    if (eventMatch) {
      if (req.method !== 'POST') {
        json(res, 405, { error: 'Metodo nao permitido.' })
        return true
      }

      const token = decodeURIComponent(eventMatch[1])
      const session = sessions.get(token)
      if (!session) {
        json(res, 404, { error: 'Sessao mobile nao encontrada ou expirada.' })
        return true
      }

      try {
        const body = await readJsonBody(req)
        const result = await handleCompanionEvent(session, body)
        json(res, 200, result)
      } catch (error) {
        json(res, 400, { error: error.message || 'Evento mobile invalido.' })
      }
      return true
    }

    const sessionMatch = url.pathname.match(/^\/api\/companion\/session\/([^/]+)$/)
    if (sessionMatch) {
      const token = decodeURIComponent(sessionMatch[1])
      const session = sessions.get(token)
      if (!session) {
        json(res, 404, { error: 'Sessao mobile nao encontrada ou expirada.' })
        return true
      }

      try {
        const snapshot = await store.getWorldSnapshot(session.worldId)
        json(res, 200, serializeSession(snapshot, session))
      } catch (error) {
        json(res, 404, { error: error.message || 'Falha ao carregar ficha.' })
      }
      return true
    }

    const assetMatch = url.pathname.match(/^\/api\/companion\/assets\/([^/]+)\/([^/]+)\/(.+)$/)
    if (assetMatch) {
      try {
        const worldId = decodeURIComponent(assetMatch[1])
        const assetId = decodeURIComponent(assetMatch[2])
        const filename = decodeURIComponent(assetMatch[3])
        const assetUrl = `vttlocal://asset/${worldId}/${assetId}/${filename}`
        const filePath = store.resolveAssetPath(assetUrl)
        const data = await fs.readFile(filePath)
        const type = CONTENT_TYPES[path.extname(filename).toLowerCase()] || 'application/octet-stream'
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': type,
          'Content-Length': data.byteLength,
        })
        res.end(data)
      } catch {
        text(res, 404, 'Asset nao encontrado.')
      }
      return true
    }

    return false
  }

  async function handleCompanionEvent(session, body) {
    const type = String(body?.type || '')
    const payload = body?.payload || {}

    if (type === 'actor.hp.adjust') {
      assertPermission(session, 'adjust_hp')
      const delta = Number(payload.delta)
      if (!Number.isFinite(delta)) throw new Error('Delta de PV invalido.')

      const snapshot = await store.getWorldSnapshot(session.worldId)
      const currentActor = snapshot.actors.find(item => item.id === session.actorId)
      if (!currentActor) throw new Error('Ficha nao encontrada.')

      const maxHp = Math.max(1, Number(actorValue(currentActor, 'max_hp', 1)) || 1)
      const currentHp = Number(actorValue(currentActor, 'hp', maxHp)) || 0
      const hp = clamp(currentHp + delta, 0, maxHp)
      const actor = await store.patchActor(session.actorId, {
        hp,
        data: {
          ...(currentActor.data || {}),
          hp,
        },
      })
      const nextSnapshot = await store.getWorldSnapshot(session.worldId)
      const event = {
        type: 'actor.updated',
        world_id: session.worldId,
        actor_id: session.actorId,
        actor,
      }
      publishEvent(event)
      return { ok: true, event, session: serializeSession(nextSnapshot, session) }
    }

    if (type === 'actor.patch') {
      assertPermission(session, 'patch_actor')
      const snapshot = await store.getWorldSnapshot(session.worldId)
      const currentActor = snapshot.actors.find(item => item.id === session.actorId)
      if (!currentActor) throw new Error('Ficha nao encontrada.')
      const actorType = snapshot.system?.actor_types?.find(item => item.id === currentActor.type)
        ?? snapshot.system?.actor_types?.[0]
        ?? null
      const fieldId = String(payload.field_id || payload.fieldId || '').trim()
      const field = actorType?.fields?.find(item => item.id === fieldId)
      if (!field) throw new Error('Campo da ficha nao encontrado neste sistema.')

      const actor = await store.patchActor(session.actorId, {
        data: {
          ...(currentActor.data || {}),
          [field.id]: normalizeFieldValue(field, payload.value),
        },
      })
      const nextSnapshot = await store.getWorldSnapshot(session.worldId)
      const event = {
        type: 'actor.updated',
        world_id: session.worldId,
        actor_id: session.actorId,
        actor,
      }
      publishEvent(event)
      return { ok: true, event, session: serializeSession(nextSnapshot, session) }
    }

    if (type === 'actor.roll') {
      assertPermission(session, 'roll')
      const label = String(payload.label || 'Rolagem')
      const snapshot = await store.getWorldSnapshot(session.worldId)
      const actor = snapshot.actors.find(item => item.id === session.actorId)
      if (!actor) throw new Error('Ficha nao encontrada.')
      const roll = rollFormula(payload.formula || '1d20', actor)

      const message = await store.createMessage(session.worldId, {
        speaker: actor.name,
        type: 'roll',
        text: label,
        formula: roll.formula,
        result: roll.total,
        rolls: roll.rolls,
      })
      const nextSnapshot = await store.getWorldSnapshot(session.worldId)
      const event = {
        type: 'chat.message.created',
        world_id: session.worldId,
        actor_id: session.actorId,
        message,
      }
      publishEvent(event)
      return { ok: true, event, session: serializeSession(nextSnapshot, session) }
    }

    if (type === 'chat.message.create') {
      assertPermission(session, 'chat')
      const textBody = String(payload.text || '').trim()
      if (!textBody) throw new Error('Mensagem vazia.')

      const snapshot = await store.getWorldSnapshot(session.worldId)
      const actor = snapshot.actors.find(item => item.id === session.actorId)
      if (!actor) throw new Error('Ficha nao encontrada.')

      const message = await store.createMessage(session.worldId, {
        speaker: session.playerName || actor.name,
        type: 'text',
        text: textBody,
        formula: '',
        rolls: [],
      })
      const nextSnapshot = await store.getWorldSnapshot(session.worldId)
      const event = {
        type: 'chat.message.created',
        world_id: session.worldId,
        actor_id: session.actorId,
        message,
      }
      publishEvent(event)
      return { ok: true, event, session: serializeSession(nextSnapshot, session) }
    }

    throw new Error('Tipo de evento mobile nao suportado.')
  }

  async function handleStatic(_req, res, url) {
    const rootExists = await fs.access(mobileDistDir).then(() => true).catch(() => false)
    if (!rootExists) {
      text(res, 503, 'Build do companion mobile nao encontrado. Rode npm run build --workspace=mobile-companion.')
      return
    }

    const target = safeStaticPath(mobileDistDir, url.pathname)
    if (!target) {
      text(res, 403, 'Caminho invalido.')
      return
    }

    try {
      const stat = await fs.stat(target)
      if (!stat.isFile()) throw new Error('not-file')
      const data = await fs.readFile(target)
      const type = CONTENT_TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream'
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': data.byteLength })
      res.end(data)
    } catch {
      const indexPath = path.join(mobileDistDir, 'index.html')
      const data = await fs.readFile(indexPath)
      res.writeHead(200, { 'Content-Type': CONTENT_TYPES['.html'], 'Content-Length': data.byteLength })
      res.end(data)
    }
  }

  async function ensureStarted() {
    if (server && port) return getStatus()
    port = await findPort(preferredPort)

    server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url || '/', `http://${req.headers.host || `127.0.0.1:${port}`}`)
        if (await handleApi(req, res, url)) return
        await handleStatic(req, res, url)
      } catch (error) {
        json(res, 500, { error: error.message || 'Erro no servidor companion.' })
      }
    })
    websocketServer = new WebSocketServer({ noServer: true })
    server.on('upgrade', (req, socket, head) => {
      const url = new URL(req.url || '/', `http://${req.headers.host || `127.0.0.1:${port}`}`)
      const socketMatch = url.pathname.match(/^\/api\/companion\/session\/([^/]+)\/ws$/)
      if (!socketMatch) {
        socket.destroy()
        return
      }

      const token = decodeURIComponent(socketMatch[1])
      const session = sessions.get(token)
      if (!session || !websocketServer) {
        socket.destroy()
        return
      }

      websocketServer.handleUpgrade(req, socket, head, ws => {
        const sockets = socketsByToken.get(token) || new Set()
        sockets.add(ws)
        socketsByToken.set(token, sockets)

        ws.on('close', () => {
          sockets.delete(ws)
          if (sockets.size === 0) {
            socketsByToken.delete(token)
          }
        })

        ws.on('message', rawMessage => {
          try {
            const body = JSON.parse(String(rawMessage))
            if (body?.type === 'ping') {
              sendSocket(ws, { type: 'pong', at: new Date().toISOString() })
            }
          } catch {
            sendSocket(ws, { type: 'error', error: 'Mensagem WebSocket invalida.' })
          }
        })

        sendSessionToSocket(ws, session).catch(error => {
          sendSocket(ws, { type: 'error', error: error.message || 'Falha ao carregar sessao.' })
        })
      })
    })

    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(port, '0.0.0.0', () => resolve())
    })

    return getStatus()
  }

  function getStatus() {
    if (!server || !port) {
      return { running: false, port: null, urls: [] }
    }
    return { running: true, port, urls: baseUrls('').urls.map(url => url.replace('/?', '/')) }
  }

  async function createSession(worldId, actorId, options = {}) {
    await ensureStarted()
    const snapshot = await store.getWorldSnapshot(worldId)
    const actor = snapshot.actors.find(item => item.id === actorId)
    if (!actor) throw new Error('Ficha nao encontrada.')

    const token = crypto.randomBytes(18).toString('base64url')
    const playerName = String(options?.player_name || options?.playerName || actor.name).trim() || actor.name
    const savedGrant = savedPermissionForActor(actor, playerName)
    const permissions = normalizePermissions(options?.permissions || savedGrant?.permissions)
    let sessionActor = actor

    if (options?.remember_permissions !== false && typeof store.saveActorCompanionPermission === 'function') {
      sessionActor = await store.saveActorCompanionPermission(actorId, {
        player_name: playerName,
        permissions,
      }) || actor
    }

    sessions.set(token, {
      actorId,
      worldId,
      playerName,
      permissions,
      createdAt: new Date().toISOString(),
    })

    const urls = baseUrls(token, options?.public_base_url || options?.publicBaseUrl)
    return {
      token,
      actor_id: actorId,
      actor_name: sessionActor.name,
      world_id: worldId,
      world_name: snapshot.world.name,
      player_name: playerName,
      permissions,
      loopback_url: urls.loopback,
      public_url: urls.public,
      urls: urls.urls,
    }
  }

  function broadcastWorldEvent(event) {
    if (!event?.world_id) return { ok: false }
    broadcastToWorld(event.world_id, event)
    return { ok: true }
  }

  function close() {
    if (!server) return
    for (const sockets of socketsByToken.values()) {
      for (const socket of sockets) {
        socket.close()
      }
    }
    websocketServer?.close()
    server.close()
    server = null
    port = null
    websocketServer = null
    sessions.clear()
    socketsByToken.clear()
  }

  return {
    ensureStarted,
    getStatus,
    createSession,
    broadcastWorldEvent,
    close,
  }
}

module.exports = {
  createCompanionServer,
}
