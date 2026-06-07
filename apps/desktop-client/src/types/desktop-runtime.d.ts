interface Window {
  vttLite?: {
    runtime?: 'desktop'
    apiBaseUrl?: string
    getConfig?: () => Promise<{
      savesDir: string
      runtime: 'desktop'
    }>
    companion?: {
      getStatus: () => Promise<import('../services/vttApi').ApiCompanionStatus>
      createSession: (
        worldId: string,
        actorId: string,
        payload?: import('../services/vttApi').CreateCompanionSessionPayload
      ) => Promise<import('../services/vttApi').ApiCompanionSessionLink>
      broadcastEvent: (event: import('../services/vttApi').ApiCompanionEvent) => Promise<{ ok: boolean }>
      onEvent: (callback: (event: import('../services/vttApi').ApiCompanionEvent) => void) => () => void
    }
    storage?: {
      getSystems: () => Promise<import('../services/vttApi').ApiGameSystem[]>
      createSystem: (payload: import('../services/vttApi').CreateSystemPayload) => Promise<import('../services/vttApi').ApiGameSystem>
      patchSystem: (systemId: string, patch: Partial<import('../services/vttApi').CreateSystemPayload>) => Promise<import('../services/vttApi').ApiGameSystem>
      deleteSystem: (systemId: string) => Promise<{ deleted_id: string }>
      openSystemFolder: (systemId: string) => Promise<{ path: string }>
      getWorlds: () => Promise<import('../services/vttApi').ApiWorld[]>
      createWorld: (payload: import('../services/vttApi').CreateWorldPayload) => Promise<import('../services/vttApi').ApiWorld>
      patchWorld: (worldId: string, patch: Partial<import('../services/vttApi').ApiWorld>) => Promise<import('../services/vttApi').ApiWorld>
      deleteWorld: (worldId: string) => Promise<{ deleted_id: string }>
      getWorldSnapshot: (worldId: string) => Promise<import('../services/vttApi').ApiWorldSnapshot>
      createSceneFolder: (worldId: string, payload: { name: string }) => Promise<import('../services/vttApi').ApiSceneFolder>
      deleteSceneFolder: (folderId: string) => Promise<{ deleted_id: string }>
      createScene: (worldId: string, payload: Partial<import('../services/vttApi').ApiScene> & { name: string }) => Promise<import('../services/vttApi').ApiScene>
      duplicateScene: (sceneId: string) => Promise<import('../services/vttApi').ApiScene>
      deleteScene: (sceneId: string) => Promise<{ deleted_id: string; active_scene_id: string }>
      patchScene: (sceneId: string, patch: Partial<import('../services/vttApi').ApiScene>) => Promise<import('../services/vttApi').ApiScene>
      createMessage: (worldId: string, payload: Omit<import('../services/vttApi').ApiChatMessage, 'id' | 'world_id' | 'created_at'>) => Promise<import('../services/vttApi').ApiChatMessage>
      deleteMessage: (messageId: string) => Promise<{ deleted_id: string }>
      createToken: (sceneId: string, payload: import('../services/vttApi').CreateTokenPayload) => Promise<import('../services/vttApi').ApiToken>
      patchToken: (tokenId: string, patch: Partial<import('../services/vttApi').ApiToken>) => Promise<import('../services/vttApi').ApiToken>
      deleteToken: (tokenId: string) => Promise<{ deleted_id: string }>
      createActor: (worldId: string, payload: import('../services/vttApi').CreateActorPayload) => Promise<import('../services/vttApi').ApiActor>
      patchActor: (actorId: string, patch: Partial<import('../services/vttApi').ApiActor>) => Promise<import('../services/vttApi').ApiActor>
      deleteActor: (actorId: string) => Promise<{ deleted_id: string }>
      createItem: (worldId: string, payload: import('../services/vttApi').CreateItemPayload) => Promise<import('../services/vttApi').ApiItem>
      patchItem: (itemId: string, patch: Partial<import('../services/vttApi').ApiItem>) => Promise<import('../services/vttApi').ApiItem>
      deleteItem: (itemId: string) => Promise<{ deleted_id: string }>
      uploadAsset: (payload: {
        bytes: ArrayBuffer
        filename: string
        contentType: string
        kind: import('../services/vttApi').ApiAsset['kind']
        worldId?: string
        sceneId?: string
        name?: string
      }) => Promise<import('../services/vttApi').ApiAsset>
      deleteAsset: (assetId: string) => Promise<{ deleted_id: string }>
    }
  }
}
