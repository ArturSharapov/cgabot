import { timeWithUnit } from 'src/functions'

export const QUEUE_LIFETIME = timeWithUnit([30, 'minute'])

export const CHECK_GAME_INTERVAL = timeWithUnit([30, 'second'])

export const CHECK_GAME_DURATION: [number, moment.unitOfTime.DurationConstructor] = [6, 'hour']

export const OPEN_TESTING_DURATION: [number, moment.unitOfTime.DurationConstructor] = [24, 'hour']

export const SELF_ID = 93584906
export const SELF_USERNAME = 'cgabot'
export const SELF_AVATAR = 'https://i.ibb.co/9373mr0/cgabot.gif'

export const OPEN_TESTING_TITLE = 'Open Testing'

// export const QUEUE_DATA = {
//   gameId: 50645954, // SELF_ID
//   title: 'Open Testing', // OPEN_TESTING_TITLE
//   info: '', // ''
//   gameType: 'singles', // customData.gameType
//   ratingMode: 'std', // 'std'
//   casual: true, // true
//   timeControlInitial: 0.1, // customData.timeControlInitial
//   increment: 0, // customData.increment
//   isDelay: false, // customData.isDelay
//   players: [
//     {
//       playerId: 50645954, // SELF_ID
//       username: 'cgabot', // SELF_USERNAME
//       avatarUrl: 'https://images.chesscomfiles.com/uploads/v1/user/50645954.5bb641be.50x50o.19df64fc0efd.png', // SELF_AVATAR
//       seat: -1, // -1
//     },
//     // ADD OLD PLAYERS
//   ],
//   ruleVariants: {
//     play4mate: true,
//     promotionRank: 11,
//     promoteTo: 'AEHO',
//     anonymous: false,
//     enPassant: true,
//     dkw: true,
//     koth: false,
//     nCheck: false,
//     deadWall: false,
//     antichess: false,
//     captureTheKing: false,
//     showObserverChat: false,
//     diplomacy: false,
//     ghostBoard: false,
//     blindfold: false,
//     custSP: true,
//     noEnPassant: false,
//     torpedo: false,
//     anyCapture: false,
//     sideways: false,
//     teammate: 2,
//   }, // customData.ruleVariants
//   inviterUsername: 'cgabot', // SELF_USERNAME
//   startFen: '', // customData.startFen
//   minRating: 0, // 0
//   maxRating: 3500, // 3500
//   ratingRange: '', // ''
//   numRequired: 2, // customData.numRequired
//   numZombies: 0, // customData.numZombies
//   existingSeats: [1, 3], // customData.numZombies
//   fairyPiecesExist: true, // customData.fairyPiecesExist
//   type: 'ffa', // customData.type
//   typeName: 'FFA', // customData.typeName
//   timeControl: '⅒|0', // customData.timeControl
//   timeControlType: 'news', // customData.timeControlType ?? 'news'
//   ratingType: 'all.all.none', // 'all.all.none'
//   ratingCategory: 'variants', // 'variants'
//   isVariant: true, // true
//   description: '', // generateDescription()
//   transparentWalls: true, // false
//   lastChecked: 1643235689600, // Date.now()
//   inviterAvatarUrl: 'https://i.ibb.co/9373mr0/cgabot.gif', // SELF_AVATAR
//   isPublic: false, // true
//   manualStart: true, // true
//   excludeMe: true, // true
//   disablePlayAgain: true, // true
// }
