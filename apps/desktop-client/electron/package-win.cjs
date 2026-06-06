const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')

const appRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(appRoot, '../..')
const mobileRoot = path.join(repoRoot, 'apps', 'mobile-companion')
const electronDist = path.join(repoRoot, 'node_modules', 'electron', 'dist')
const defaultOutputDir = path.join(repoRoot, 'release', 'VTT Lite-win32-x64')
const preservedSavesDir = path.join(os.tmpdir(), 'vtt-lite-package-preserved-saves')
let outputDir = defaultOutputDir
let resourcesAppDir = path.join(outputDir, 'resources', 'app')

async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function copyDir(source, target) {
  await fs.mkdir(target, { recursive: true })
  const entries = await fs.readdir(source, { withFileTypes: true })

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name)
    const targetPath = path.join(target, entry.name)

    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath)
      continue
    }

    if (entry.isFile()) {
      await fs.copyFile(sourcePath, targetPath)
    }
  }
}

async function copyFile(source, target) {
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.copyFile(source, target)
}

async function copyNodePackage(packageName) {
  const candidates = [
    path.join(appRoot, 'node_modules', packageName),
    path.join(repoRoot, 'node_modules', packageName),
  ]

  for (const source of candidates) {
    if (await exists(source)) {
      await copyDir(source, path.join(resourcesAppDir, 'node_modules', packageName))
      return
    }
  }

  throw new Error(`Pacote ${packageName} nao encontrado em node_modules.`)
}

async function prepareOutputDir() {
  try {
    await fs.rm(defaultOutputDir, { recursive: true, force: true })
    outputDir = defaultOutputDir
  } catch (error) {
    if (!['EBUSY', 'EPERM', 'ENOTEMPTY'].includes(error?.code)) throw error

    outputDir = path.join(repoRoot, 'release', 'VTT Lite-win32-x64-next')
    console.warn(`Pasta padrao em uso. Gerando pacote alternativo em: ${outputDir}`)
    await fs.rm(outputDir, { recursive: true, force: true })
  }

  resourcesAppDir = path.join(outputDir, 'resources', 'app')
}

async function normalizeSavesIndex(savesDir) {
  const indexPath = path.join(savesDir, 'index.json')
  let index = { worlds: [], systems: [] }

  if (await exists(indexPath)) {
    try {
      index = JSON.parse(await fs.readFile(indexPath, 'utf-8'))
    } catch {
      index = { worlds: [], systems: [] }
    }
  }

  await fs.mkdir(savesDir, { recursive: true })
  await fs.writeFile(
    indexPath,
    `${JSON.stringify({
      ...index,
      worlds: Array.isArray(index.worlds) ? index.worlds : [],
      systems: Array.isArray(index.systems) ? index.systems : [],
    }, null, 2)}\n`,
    'utf-8',
  )
}

async function main() {
  if (!(await exists(path.join(appRoot, 'dist', 'index.html')))) {
    throw new Error('Build do frontend nao encontrado. Rode npm run build antes de empacotar.')
  }

  if (!(await exists(path.join(mobileRoot, 'dist', 'index.html')))) {
    throw new Error('Build do companion mobile nao encontrado. Rode npm run build --workspace=mobile-companion antes de empacotar.')
  }

  if (!(await exists(path.join(electronDist, 'electron.exe')))) {
    throw new Error('Runtime do Electron nao encontrado em node_modules/electron/dist.')
  }

  const currentSavesDir = path.join(defaultOutputDir, 'saves')
  const hadExistingSaves = await exists(currentSavesDir)
  await fs.rm(preservedSavesDir, { recursive: true, force: true })
  if (hadExistingSaves) {
    await copyDir(currentSavesDir, preservedSavesDir)
  }

  await prepareOutputDir()
  await copyDir(electronDist, outputDir)

  const electronExe = path.join(outputDir, 'electron.exe')
  const appExe = path.join(outputDir, 'VTT Lite.exe')
  await fs.rename(electronExe, appExe)

  await fs.rm(path.join(outputDir, 'resources', 'default_app.asar'), { force: true })
  await fs.mkdir(resourcesAppDir, { recursive: true })

  await copyDir(path.join(appRoot, 'dist'), path.join(resourcesAppDir, 'dist'))
  await fs.mkdir(path.join(resourcesAppDir, 'electron'), { recursive: true })
  await copyFile(path.join(appRoot, 'electron', 'main.cjs'), path.join(resourcesAppDir, 'electron', 'main.cjs'))
  await copyFile(path.join(appRoot, 'electron', 'preload.cjs'), path.join(resourcesAppDir, 'electron', 'preload.cjs'))
  await copyFile(path.join(appRoot, 'electron', 'local-store.cjs'), path.join(resourcesAppDir, 'electron', 'local-store.cjs'))
  await copyFile(path.join(appRoot, 'electron', 'companion-server.cjs'), path.join(resourcesAppDir, 'electron', 'companion-server.cjs'))
  await copyDir(path.join(mobileRoot, 'dist'), path.join(resourcesAppDir, 'mobile'))
  await copyNodePackage('ws')

  await fs.writeFile(
    path.join(resourcesAppDir, 'package.json'),
    `${JSON.stringify({
      name: 'vtt-lite-desktop',
      version: '0.1.0',
      main: 'electron/main.cjs',
    }, null, 2)}\n`,
    'utf-8',
  )

  const packagedSavesDir = path.join(outputDir, 'saves')
  if (hadExistingSaves) {
    await copyDir(preservedSavesDir, packagedSavesDir)
    await fs.rm(preservedSavesDir, { recursive: true, force: true })
  } else {
    await fs.mkdir(packagedSavesDir, { recursive: true })
  }
  await normalizeSavesIndex(packagedSavesDir)

  console.log(`Programa gerado em: ${appExe}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
