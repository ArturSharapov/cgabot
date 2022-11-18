import { IOpenTesting } from '../open-testing/open-testing.interface'

export interface IPost {
  dateCreated: number
  dateUpdated: number
  contentHash: number
  requirements?: IRequirements
  message: string // can be changed
  status: PostStatus // can be changed
  author: string
  link: string
  type: PostType // can be changed
  title: string // can be changed
  screenshot?: string //  ↪ auto from games.last
  locked: boolean // can be changed
  responseId: string
  deleted?: true
  editing?: true
  openTesting?: IOpenTesting
  notes?: string
  primaryReviewer?: string
  assistantReviewers?: string
}

export enum PostType {
  NCV,
  WoF,
  Other,
}

export enum PostStatus {
  Accepted,
  Declined,
  Pending,
  RNM,
  UR,
  Unknown,
}
export const STATUS_ICONS = ['✓', '✗', '◷', '⠶', '☉', ''] as const
export const STATUS_TEXT = ['Accepted', 'Declined', 'Pending Reply', 'Requirements Not Met', 'Under Review', 'Other'] as const

export interface IRequirements {
  details: IRequirementsDetails
  result: IRequirementsResult
  games?: IRequirementsGame[]
  position: IRequirementsPosition
}

export interface IRequirementsDetails {
  valid: number
  games: number
  final: number
  players: number
  timespan: number
}

export interface IRequirementsResult {
  valid: boolean
  games: boolean
  final: boolean
  players: boolean
  timespan: boolean
}

export interface IRequirementsGame {
  violations?: GameViolation[]
  final: boolean
  gameNr: number
}

export interface IRequirementsPosition {
  fen: string
  gamerules: string
  promotion: string
  timeControl: string
  other: string
}

export type GameData = {
  players: string[]
  startDate: string
  endDate: string
  fen: string
  timeControl: string
  pieceAlts: O<string>
  gamerules: Partial<{
    play4mate: true
    dkw: true
    enPassant: true
    koth: true
    captureTheKing: true
    takeover: true
    giveaway: true
    deadWall: true
    blindfold: true
    ghostBoard: true
    anonymous: true
    spectatorChat: true
    diplomacy: true
    torpedo: true
    anyCapture: true
    sideways: true
    pointsForMate: number
    nCheck: number
    promotionRank: number
    promoteTo: string
    noDkw: true
    noEnPassant: true
    allowPassing: true
    atomic: true
    barePieceLoses: true
    fatalCapture: true
    fogOfWar: true
    oppositeSideCastling: true
    paradigmChess30: true
    racingKings: true
    selfCheck: true
    selfPartner: true
    stalemate: 'loss' | 'win'
    usePiecePerspective: true
    teammate: 1 | 2 | 3
  }>
  type: 'FFA' | 'Solo' | 'Teams'
  aborted: boolean
  hasBot: boolean
  openTestingData: O<any>
}

export interface IGameResultData {
  gamerules: string
  promotion: string
  timeControl: string
  fen: string
  players: string[]
  date: number
  aborted: boolean
  hasBot: boolean
  openTestingData: O<any>
}

export enum GameViolation {
  NoAuthor,
  NotSimilar,
  HasBot,
  Aborted,
}
