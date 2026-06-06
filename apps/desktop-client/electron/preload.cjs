const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('vttLite', {
  runtime: 'desktop',
  getConfig: () => ipcRenderer.invoke('store:getConfig'),
  companion: {
    getStatus: () => ipcRenderer.invoke('companion:getStatus'),
    createSession: (worldId, actorId, payload) => ipcRenderer.invoke('companion:createSession', worldId, actorId, payload),
    onEvent: callback => {
      const handler = (_event, payload) => callback(payload)
      ipcRenderer.on('companion:event', handler)
      return () => ipcRenderer.removeListener('companion:event', handler)
    },
  },
  storage: {
    getSystems: () => ipcRenderer.invoke('store:getSystems'),
    createSystem: payload => ipcRenderer.invoke('store:createSystem', payload),
    patchSystem: (systemId, patch) => ipcRenderer.invoke('store:patchSystem', systemId, patch),
    deleteSystem: systemId => ipcRenderer.invoke('store:deleteSystem', systemId),
    openSystemFolder: systemId => ipcRenderer.invoke('store:openSystemFolder', systemId),
    getWorlds: () => ipcRenderer.invoke('store:getWorlds'),
    createWorld: payload => ipcRenderer.invoke('store:createWorld', payload),
    patchWorld: (worldId, patch) => ipcRenderer.invoke('store:patchWorld', worldId, patch),
    deleteWorld: worldId => ipcRenderer.invoke('store:deleteWorld', worldId),
    getWorldSnapshot: worldId => ipcRenderer.invoke('store:getWorldSnapshot', worldId),
    createSceneFolder: (worldId, payload) => ipcRenderer.invoke('store:createSceneFolder', worldId, payload),
    deleteSceneFolder: folderId => ipcRenderer.invoke('store:deleteSceneFolder', folderId),
    createScene: (worldId, payload) => ipcRenderer.invoke('store:createScene', worldId, payload),
    duplicateScene: sceneId => ipcRenderer.invoke('store:duplicateScene', sceneId),
    deleteScene: sceneId => ipcRenderer.invoke('store:deleteScene', sceneId),
    patchScene: (sceneId, patch) => ipcRenderer.invoke('store:patchScene', sceneId, patch),
    createMessage: (worldId, payload) => ipcRenderer.invoke('store:createMessage', worldId, payload),
    deleteMessage: messageId => ipcRenderer.invoke('store:deleteMessage', messageId),
    createToken: (sceneId, payload) => ipcRenderer.invoke('store:createToken', sceneId, payload),
    patchToken: (tokenId, patch) => ipcRenderer.invoke('store:patchToken', tokenId, patch),
    deleteToken: tokenId => ipcRenderer.invoke('store:deleteToken', tokenId),
    createActor: (worldId, payload) => ipcRenderer.invoke('store:createActor', worldId, payload),
    patchActor: (actorId, patch) => ipcRenderer.invoke('store:patchActor', actorId, patch),
    deleteActor: actorId => ipcRenderer.invoke('store:deleteActor', actorId),
    uploadAsset: payload => ipcRenderer.invoke('store:uploadAsset', payload),
    deleteAsset: assetId => ipcRenderer.invoke('store:deleteAsset', assetId),
  },
})
