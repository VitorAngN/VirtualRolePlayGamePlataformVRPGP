/** Tipos compartilhados entre os componentes de Scenes */
export interface Scene {
  id: number
  name: string
  dims?: string
  active?: boolean
  folder?: boolean
}

export type SceneConfigTab = 'basics' | 'grid' | 'lighting' | 'ambience' | 'mapexplorer'
