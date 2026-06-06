const { app, BrowserWindow, ipcMain, protocol, shell } = require('electron')
const fs = require('node:fs/promises')
const syncFs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { createLocalStore } = require('./local-store.cjs')
const { createCompanionServer } = require('./companion-server.cjs')

let store = null
let companionServer = null
let startupLogPath = null
let mainWindow = null

function appendStartupLog(message, error) {
  try {
    const line = `[${new Date().toISOString()}] ${message}${error ? `\n${error.stack || error.message || String(error)}` : ''}\n`
    if (!startupLogPath) {
      const fallbackDir = path.join(app.getPath('userData'), 'logs')
      syncFs.mkdirSync(fallbackDir, { recursive: true })
      startupLogPath = path.join(fallbackDir, 'startup.log')
    }
    syncFs.mkdirSync(path.dirname(startupLogPath), { recursive: true })
    syncFs.appendFileSync(startupLogPath, line, 'utf-8')
  } catch {
    // Logging must never prevent the app from opening.
  }
}

function projectRoot() {
  return process.env.VTT_DESKTOP_PROJECT_ROOT || path.resolve(__dirname, '../../..')
}

function resolveSavesDir() {
  if (process.env.VTT_SAVES_DIR) return process.env.VTT_SAVES_DIR

  if (app.isPackaged) {
    return path.join(path.dirname(process.execPath), 'saves')
  }

  return path.join(projectRoot(), 'saves')
}

function registerIpc() {
  ipcMain.handle('store:getConfig', async () => ({
    savesDir: store.root,
    runtime: 'desktop',
  }))
  ipcMain.handle('store:getSystems', async () => store.listSystems())
  ipcMain.handle('store:createSystem', async (_event, payload) => store.createSystem(payload))
  ipcMain.handle('store:patchSystem', async (_event, systemId, patch) => store.patchSystem(systemId, patch))
  ipcMain.handle('store:deleteSystem', async (_event, systemId) => store.deleteSystem(systemId))
  ipcMain.handle('store:openSystemFolder', async (_event, systemId) => {
    const folderPath = await store.getSystemPackagePath(systemId)
    await shell.openPath(folderPath)
    return { path: folderPath }
  })
  ipcMain.handle('store:getWorlds', async () => store.listWorlds())
  ipcMain.handle('store:createWorld', async (_event, payload) => store.createWorld(payload))
  ipcMain.handle('store:patchWorld', async (_event, worldId, patch) => store.patchWorld(worldId, patch))
  ipcMain.handle('store:deleteWorld', async (_event, worldId) => store.deleteWorld(worldId))
  ipcMain.handle('store:getWorldSnapshot', async (_event, worldId) => store.getWorldSnapshot(worldId))
  ipcMain.handle('store:createSceneFolder', async (_event, worldId, payload) => store.createSceneFolder(worldId, payload))
  ipcMain.handle('store:deleteSceneFolder', async (_event, folderId) => store.deleteSceneFolder(folderId))
  ipcMain.handle('store:createScene', async (_event, worldId, payload) => store.createScene(worldId, payload))
  ipcMain.handle('store:duplicateScene', async (_event, sceneId) => store.duplicateScene(sceneId))
  ipcMain.handle('store:deleteScene', async (_event, sceneId) => store.deleteScene(sceneId))
  ipcMain.handle('store:patchScene', async (_event, sceneId, patch) => store.patchScene(sceneId, patch))
  ipcMain.handle('store:createMessage', async (_event, worldId, payload) => store.createMessage(worldId, payload))
  ipcMain.handle('store:deleteMessage', async (_event, messageId) => store.deleteMessage(messageId))
  ipcMain.handle('store:createToken', async (_event, sceneId, payload) => store.createToken(sceneId, payload))
  ipcMain.handle('store:patchToken', async (_event, tokenId, patch) => store.patchToken(tokenId, patch))
  ipcMain.handle('store:deleteToken', async (_event, tokenId) => store.deleteToken(tokenId))
  ipcMain.handle('store:createActor', async (_event, worldId, payload) => store.createActor(worldId, payload))
  ipcMain.handle('store:patchActor', async (_event, actorId, patch) => store.patchActor(actorId, patch))
  ipcMain.handle('store:deleteActor', async (_event, actorId) => store.deleteActor(actorId))
  ipcMain.handle('store:uploadAsset', async (_event, payload) => store.uploadAsset(payload))
  ipcMain.handle('store:deleteAsset', async (_event, assetId) => store.deleteAsset(assetId))
  ipcMain.handle('companion:getStatus', async () => companionServer.getStatus())
  ipcMain.handle('companion:createSession', async (_event, worldId, actorId, payload) => companionServer.createSession(worldId, actorId, payload))
}

function registerAssetProtocol() {
  protocol.handle('vttlocal', async request => {
    const filePath = store.resolveAssetPath(request.url)
    const data = await fs.readFile(filePath)
    return new Response(data)
  })
}

async function createWindow() {
  appendStartupLog('Creating browser window.')
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 980,
    minHeight: 620,
    show: false,
    center: true,
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0a',
    title: 'VTT Lite',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })
  mainWindow = win

  win.once('ready-to-show', () => {
    appendStartupLog('Browser window ready to show.')
    win.show()
    win.restore()
    win.focus()
    win.moveTop()
    win.setAlwaysOnTop(true)
    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.setAlwaysOnTop(false)
      }
    }, 1200)
  })

  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null
    }
  })

  if (process.env.VTT_DESKTOP_DEV_SERVER_URL) {
    appendStartupLog(`Loading dev URL: ${process.env.VTT_DESKTOP_DEV_SERVER_URL}`)
    await win.loadURL(process.env.VTT_DESKTOP_DEV_SERVER_URL)
    return
  }

  const indexPath = path.join(__dirname, '..', 'dist', 'index.html')
  appendStartupLog(`Loading packaged file: ${indexPath}`)
  await win.loadURL(pathToFileURL(indexPath).toString())
  appendStartupLog('Browser window loaded.')
}

const hasSingleInstanceLock = app.requestSingleInstanceLock()

if (!hasSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    appendStartupLog('Second instance requested; focusing main window.')
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
    mainWindow.moveTop()
  })

  app.whenReady().then(async () => {
    const savesDir = resolveSavesDir()
    startupLogPath = path.join(savesDir, 'startup.log')
    appendStartupLog(`App ready. packaged=${app.isPackaged}; execPath=${process.execPath}; appPath=${app.getAppPath()}; savesDir=${savesDir}`)
    store = createLocalStore(savesDir)
    companionServer = createCompanionServer({
      store,
      mobileDistDir: app.isPackaged
        ? path.join(app.getAppPath(), 'mobile')
        : path.join(projectRoot(), 'apps', 'mobile-companion', 'dist'),
      onEvent: event => {
        if (!mainWindow || mainWindow.isDestroyed()) return
        mainWindow.webContents.send('companion:event', event)
      },
    })
    registerAssetProtocol()
    registerIpc()
    await createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  }).catch(error => {
    appendStartupLog('Fatal startup error.', error)
    app.quit()
  })
}

process.on('uncaughtException', error => {
  appendStartupLog('Uncaught exception.', error)
})

process.on('unhandledRejection', error => {
  appendStartupLog('Unhandled rejection.', error)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  companionServer?.close()
})
