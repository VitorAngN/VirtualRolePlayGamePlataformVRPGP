/** Tipos compartilhados entre os componentes de Scenes */
export interface Scene {
  id: string
  name: string
  dims?: string
  active?: boolean
  folder?: boolean
  folderId?: string
  backgroundAssetId?: string
  foregroundAssetId?: string
  thumbnailAssetId?: string
  showNavigation?: boolean
  permission?: string
  navigationName?: string
  backgroundColor?: string
  preserveAspectRatio?: boolean
  scenePadding?: number
  backgroundElevation?: number
  foregroundElevation?: number
  initialX?: number
  initialY?: number
  initialZoom?: number
  lockView?: boolean
  gridType?: string
  gridSize?: number
  gridOffsetX?: number
  gridOffsetY?: number
  gridColor?: string
  gridOpacity?: number
  gridDistance?: number
  gridUnits?: string
  darkness?: number
  globalLight?: boolean
  globalLightThreshold?: number
  playlist?: string
  description?: string
  fogExploration?: boolean
  resetFogOnActivation?: boolean
  fogOverlayAssetId?: string
  width?: number
  height?: number
}

export type SceneConfigTab = 'basics' | 'grid' | 'lighting' | 'ambience' | 'mapexplorer'
