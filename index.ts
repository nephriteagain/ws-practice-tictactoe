import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';


interface lobbyValue {
  host: string
  guest: string
}
type lobbyMap = Map<string,lobbyValue>
type lobbyObj = Record<string,lobbyValue>

type tictacbox = 'x'|'o'|''
interface players {
  host: string
  guest: string
}
interface score {
  host: number
  guest: number
}

interface gameValue {
  players: players
  turn: string,
  game: tictacbox[],
  score: score
}
type gameMap = Map<string,gameValue>
type gameObj = Record<string,gameValue>

const app = express();

const { generateClientId } = require('./lib/helper')

// TODO: create a join lobby,
// broadcast to lobby names,
// if someones joins game should start

// depends on what the server sends the states in
// the front end should follow

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

const TICTACTOE : tictacbox[] = [
  "","","","","","","","","",
]

const WINNING_PATTERN : number[][] = [
  [0,1,2],
  [3,4,5],
  [6,7,8],
  [0,3,6],
  [1,4,7],
  [2,5,8],
  [0,4,8],
  [2,4,6]
]

const lobby : lobbyMap = new Map()
const games : gameMap = new Map()
const users = new Map()



type message = Record<string,any>

wss.on('connection', (ws: WebSocket) => {
  
  const clientId = generateClientId()
  users.set(clientId, ws)

  ws.on('message', (message: string) => {
    
    const payload : message = JSON.parse(message)
    console.log(payload)
    if (payload.type === 'create') {
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

    if (payload.type === 'delete') {
      const id = payload.id
      lobby.delete(id)        
    }    

    if (payload.type === 'leave') {
      const { lobbyId } = payload
      lobby.set(lobbyId, {host:lobbyId, guest: ''})
    }

    if (payload.type === 'join') {
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

    if (payload.type === 'game') {
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

    let lobbyObj : lobbyObj = {}
    for (let [key, value] of lobby) {
      lobbyObj[key] = value
    }
    

    // lobby map listener
    wss.clients.forEach(client => {      
      const lobbiesResponse =  { type: 'lobby', payload: lobbyObj}
      client.send(JSON.stringify(lobbiesResponse))

    });
    
    // start game listener
    if (payload.type === 'join') {
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

    // ongoing game listener
    if (payload.type === 'game') {
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
   
    if (payload.type === 'quit') {
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


  });  


    // initial response
    const connectResponse = { type: 'connect', payload: { clientId } };
    ws.send(JSON.stringify(connectResponse));
    // lobby response
    const lobbyObj : lobbyObj = {}
    for (let [key,value] of lobby) {
      lobbyObj[key] = value
    }
    const lobbiesResponse = { type: 'lobby', payload: lobbyObj };
    ws.send(JSON.stringify(lobbiesResponse));

    let userCount = 0
    console.log('users')
    for (let [key] of users) {
      console.log(key)
      userCount++
    }
    console.log(`total users: ${userCount}`)
    // 
});

// start our server

const PORT = 8999

server.listen(process.env.PORT || PORT, () => {
    console.log(`Server started on port ${PORT} :)`);
})