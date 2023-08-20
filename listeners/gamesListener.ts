import { wss } from ".."
import { gameMap } from "../types/types"
import { WINNING_PATTERN, TICTACTOE } from "../lib/data"

export default function gamesListener(payload: Record<string,any>, users: Map<string,any>, games: gameMap) {
    const { gameId, playerId, nextTurn, gameData } = payload
      const yourWS = users.get(playerId)
      const opponentWs = users.get(nextTurn)

      wss.clients.forEach(client => {
        
        if (client === yourWS || client === opponentWs) {
          const gameData = games.get(gameId)
          const gameResponse = { type: 'game', payload: gameData}
          client.send(JSON.stringify(gameResponse))
        }

      })
      // winner checker or draw checker
      const myGame = games.get(gameId)
      if (myGame) {      

        const hostWinner = WINNING_PATTERN.some((pattern) => {
          return pattern.every((number) => {
            return myGame.game[number] === 'x'
          })
        })
        const guestWinner = WINNING_PATTERN.some((pattern) => {
          return pattern.every((number) => {
            return myGame.game[number] === 'o'
          })
        })     
        // draw
        const allBoxFull = myGame.game.every((box) => box !== '')
        const { score } = myGame
        if (hostWinner) {
          score.host++
        }
        if (guestWinner) {
          score.guest++
        }
        if (hostWinner||guestWinner||allBoxFull) {
          games.set(gameId, {
            ...myGame,
            game: TICTACTOE
          })
          const newGame = games.get(gameId)
          wss.clients.forEach(client => {
            const yourWS = users.get(playerId)
            const opponentWs = users.get(nextTurn)
            
            if (client === yourWS || client === opponentWs) {
              const gameResponse = { type: 'game', payload: newGame}
              client.send(JSON.stringify(gameResponse))
            }
          })
        }
      }
}