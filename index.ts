import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import {
  lobbyMap, lobbyObj, gameMap, message
} from './types/types'

import createLobby from './listeners/createLobby';
import joinGame from './listeners/joinGame';
import moveAtGame from './listeners/moveAtGame';
import startGame from './listeners/startGame';
import gamesListener from './listeners/gamesListener';
import quitGame from './listeners/quitGame';
import closedConnection from './listeners/closedConnection';


const { generateClientId } = require('./lib/helper')

const app = express();


//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
export const wss = new WebSocket.Server({ server });


const lobby : lobbyMap = new Map()
const games : gameMap = new Map()
const users = new Map()



wss.on('connection', (ws: WebSocket) => {
  const clientId = generateClientId()
  users.set(clientId, ws)

  // this are the message thrown my the clients
  ws.on('message', (message: string) => {
    
    const payload : message = JSON.parse(message)
    console.log(payload.type)
  
    if (payload.type === 'create') {
      createLobby(payload, lobby)
    }

    if (payload.type === 'delete') {
      const id = payload.id
      lobby.delete(id)        
    }    

    if (payload.type === 'leave') {
      const { lobbyId } = payload
      lobby.set(lobbyId, {host:lobbyId, guest: ''})
    }

    // when a player joins a lobby,
    // the game will start immediatly
    if (payload.type === 'join') {
      joinGame(payload, lobby, games)
    }

    // when a player made a move on an ongoing game
    if (payload.type === 'game') {
      moveAtGame(payload, games)
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
      startGame(payload, users, games)
    }

    // ongoing game listener
    if (payload.type === 'game') {
      gamesListener(payload, users, games)
    }
   
    // when user click the leave button on the client
    if (payload.type === 'quit') {
      quitGame(payload, games, users)
    }

  });  

  
  ws.on('close', (code, reason) => {
    console.log(code, reason)
    // @ts-ignore
    closedConnection(ws, users, lobby, games)
  })

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

    // 
    let userCount = 0
    for (let [key] of users) {
      // console.log(key)
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