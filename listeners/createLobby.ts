import { lobbyMap, lobbyObj } from "../types/types";

import { wss } from "..";

export default function createLobby(payload: Record<string,any>, lobby: lobbyMap) {
    const id = payload.id      
      lobby.set(id, {host:id, guest: ''})

      // removes dead lobbies, auto deletes the lobbies in 3 minutes
      const timeout = setTimeout(() => {
        lobby.delete(id)
        wss.clients.forEach(client => {      
          let lobbyObj : lobbyObj = {}
          for (let [key, value] of lobby) {
            lobbyObj[key] = value
          }
          const lobbiesResponse =  { type: 'lobby', payload: lobbyObj}
          client.send(JSON.stringify(lobbiesResponse))
    
        });
        clearTimeout(timeout)
      }, 180_000)
}