import { lobbyMap, gameMap } from "../types/types";
import { TICTACTOE } from "../lib/data";

export default function joinGame(payload: Record<string,any>, lobby: lobbyMap, games: gameMap) {
    const { id, lobbyId } = payload
      lobby.set(lobbyId, {host:lobbyId, guest: id})
      const gameId = lobbyId // reused for game id
      games.set(gameId, {
        players: {
          host: lobbyId,
          guest: id
        },
        turn: lobbyId,
        game: TICTACTOE,
        score: {
          host: 0,
          guest: 0
        }
      })
      lobby.delete(lobbyId)
}