import { wss } from ".."
import { gameMap } from "../types/types"

export default function quitGame(payload: Record<string,any>, games: gameMap, users: Map<string,any>) {
    const { gameId, players } = payload
      games.delete(gameId)
      const hostWs = users.get(players.host)
      const guestWs = users.get(players.guest)

      wss.clients.forEach(client => {
        if (client === hostWs || client === guestWs) {
          const gameResponse = { type: 'quit', payload: {message: 'a player has left the game'}}
          client.send(JSON.stringify(gameResponse))
        }
      })
}