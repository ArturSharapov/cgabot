export enum OpenTestingStatus {
  On,
  Off,
  Finished,
}
export enum OpenTestingVote {
  Neutral,
  Positive,
  Negative,
}

export interface IOpenTesting {
  dateStarted: number
  status: OpenTestingStatus
  durations: { [gameNr: number]: number }
  players: IOpenTestingPlayers
}

export interface IOpenTestingPlayers {
  [playerId: number]: {
    timestamp: number
    vote: OpenTestingVote
  }
}

export interface IOpenTestingGame {
  dateStarted: number
  gameNr: number
  postId: string
  key: string
}

export type QueueData = {
  players: {
    playerId: number
  }[]
  seats: number[]
}

export type GameData = {
  plies: number
  startDate: string
  endDate: string
  players: number[]
  chat: { playerId: number; message: string; timestamp: number }[]
  aborted: boolean
}
