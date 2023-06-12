import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';

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

const TICTACTOE = [
  "","","","","","","","","",
]

const lobby = new Map()
const games = new Map()
const users = new Map()



type message = Record<string,any>

wss.on('connection', (ws: WebSocket) => {
  
  const clientId = generateClientId()
  users.set(clientId, ws)

  ws.on('message', (message: string) => {
    
    const payload : message = JSON.parse(message)

    
    // lobby obj listener
    const lobbyStr = JSON.stringify(lobby)
    wss.clients.forEach(client => {        
            client.send(`open lobbies: ${lobby}`);          
    });    
    
    // game listener
    wss.clients.forEach(client => { 
      // if (client === ws) {
      //   client.send(`you sent:${message}`);          
      // }

    });    

  });
      
      
    ws.send(`your id: ${clientId}`)
});

// start our server

const PORT = 8999

server.listen(process.env.PORT || PORT, () => {
    console.log(`Server started on port ${PORT} :)`);
})