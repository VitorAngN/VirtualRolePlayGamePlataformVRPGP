const { spawn } = require('node:child_process')
const http = require('node:http')
const path = require('node:path')

const electronPath = require('electron')

const projectRoot = path.resolve(__dirname, '../../..')
const devServerUrl = process.env.VTT_DESKTOP_DEV_SERVER_URL || 'http://127.0.0.1:5179'
const vitePort = new URL(devServerUrl).port || '5179'

let viteProcess = null
let electronProcess = null

function canConnect(url) {
  return new Promise(resolve => {
    const req = http.get(url, response => {
      response.resume()
      resolve(response.statusCode && response.statusCode < 500)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(700, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function waitForVite() {
  for (let i = 0; i < 50; i += 1) {
    if (await canConnect(devServerUrl)) return
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  throw new Error(`Vite nao respondeu em ${devServerUrl}`)
}

async function main() {
  const alreadyRunning = await canConnect(devServerUrl)

  if (!alreadyRunning) {
    viteProcess = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', [
      'run',
      'dev',
      '--workspace=desktop-client',
      '--',
      '--host',
      '127.0.0.1',
      '--port',
      vitePort,
    ], {
      cwd: projectRoot,
      stdio: 'inherit',
      windowsHide: true,
    })

    await waitForVite()
  }

  electronProcess = spawn(electronPath, [path.join(__dirname, 'main.cjs')], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      VTT_DESKTOP_PROJECT_ROOT: projectRoot,
      VTT_DESKTOP_DEV_SERVER_URL: devServerUrl,
      VTT_SAVES_DIR: process.env.VTT_SAVES_DIR || path.join(projectRoot, 'saves'),
    },
    windowsHide: true,
  })

  electronProcess.on('exit', code => {
    if (viteProcess && !viteProcess.killed) viteProcess.kill()
    process.exit(code ?? 0)
  })
}

process.on('SIGINT', () => {
  if (electronProcess && !electronProcess.killed) electronProcess.kill()
  if (viteProcess && !viteProcess.killed) viteProcess.kill()
  process.exit(0)
})

main().catch(error => {
  console.error(error)
  if (viteProcess && !viteProcess.killed) viteProcess.kill()
  process.exit(1)
})
