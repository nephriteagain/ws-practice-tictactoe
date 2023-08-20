import { gameMap } from "../types/types";

export default function moveAtGame(payload: Record<string,any>, games: gameMap) {
    const { gameId, playerId, nextTurn, gameData } = payload
      const myGame = games.get(gameId)
      if (myGame) {
        games.set(gameId, {
          ...myGame,
          game: gameData,
          turn: nextTurn
        })
      }
}