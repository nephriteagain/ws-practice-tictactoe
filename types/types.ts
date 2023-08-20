export interface lobbyValue {
    host: string
    guest: string
  }
  export type lobbyMap = Map<string,lobbyValue>
  export type lobbyObj = Record<string,lobbyValue>
  
  export type tictacbox = 'x'|'o'|''
  export interface players {
    host: string
    guest: string
  }
  export interface score {
    host: number
    guest: number
  }
  
  export interface gameValue {
    players: players
    turn: string,
    game: tictacbox[],
    score: score
  }
  export type gameMap = Map<string,gameValue>

export type message = Record<string,any>