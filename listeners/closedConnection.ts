import { wss } from "..";
import { gameMap, lobbyMap, lobbyObj } from "../types/types";

export default function closedConnection(ws: WebSocket, users: Map<string,any>, lobby: lobbyMap, games: gameMap) {
    let wsId;
    let userCount = 0
    for (let [key,value] of users) {
      userCount++
      if (value == ws) {
        wsId = key

        users.delete(key)        
        lobby.delete(key)
        // remove the lobby made by the disconnected user
        wss.clients.forEach(client => {      
          let lobbyObj : lobbyObj = {}
          for (let [key, value] of lobby) {
            lobbyObj[key] = value
          }
          const lobbiesResponse =  { type: 'lobby', payload: lobbyObj}
          client.send(JSON.stringify(lobbiesResponse))    
        })
      }
    }
    
    // remove game if oppenent is disconnected
    let gameId;
    let host;
    let guest
    for (let [key,value] of games) {
      if (value.players.host === wsId || value.players.guest === wsId) {
        gameId = key
        games.delete(gameId)
        host = value.players.host
        guest = value.players.guest
      }
    }
    const hostWs = users.get(host as string)
    const guestWs = users.get(guest as string)
    wss.clients.forEach(client => {
      if (client == hostWs || client == guestWs) {
        const gameResponse = { type: 'disconnect', payload: {message: 'a player has disconnected'}}
        client.send(JSON.stringify(gameResponse))
      }
    })

    console.log(`total User: ${userCount}`)
}