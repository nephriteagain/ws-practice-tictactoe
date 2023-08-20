import { wss } from "..";
import { gameMap } from "../types/types";

export default function startGame(payload: Record<string,any>, users: Map<string,any>, games: gameMap) {
    const { id, lobbyId } = payload

      wss.clients.forEach(client => { 
        const yourWS = users.get(id)
        const opponentWs = users.get(lobbyId)


        if (client == yourWS || opponentWs == client) {
          const gameData = games.get(lobbyId)
          const gameStartResponse = {type: 'start', payload: gameData}
          client.send(JSON.stringify(gameStartResponse))
        }
      });
}