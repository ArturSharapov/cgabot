import { GameData } from '../posts/post.interface'
import { GAMERULES_NAMES, PIECES_NAMES } from './post-evaluation.constants'

export const generateGamerules = (gameData: GameData) => {
  let gamerules = ''
  for (const rule in GAMERULES_NAMES) {
    if ((gameData.gamerules as O)[rule]) {
      if (gamerules) gamerules += ', '
      if (rule === 'nCheck') {
        const matches = gameData.fen && /"lives":\[(\d*(,\d*){3})\]/.exec(gameData.fen)
        const nCheck =
          matches && matches[1]
            ? matches[1]
                .split(',')
                .filter((x, i, a) => a.indexOf(x) === i)
                .join('-')
            : gameData.gamerules[rule]
        gamerules += nCheck + GAMERULES_NAMES[rule]
      } else if (rule === 'stalemate') {
        gamerules += GAMERULES_NAMES[rule] + (gameData.gamerules[rule] === 'win' ? ' Wins' : ' Loses')
      } else if (rule === 'teammate') {
        if (gameData.type === 'Teams')
          gamerules += (gameData.gamerules[rule] === 1 ? 'RB ' : gameData.gamerules[rule] === 3 ? 'RG ' : '') + GAMERULES_NAMES[rule]
      } else if (rule === 'pointsForMate') gamerules += gameData.gamerules[rule] + GAMERULES_NAMES[rule]
      else gamerules += (GAMERULES_NAMES as O)[rule]
    }
  }
  return gamerules
}

const getPromotionPiece = (gameData: GameData, nth: number) => {
  if (!gameData.gamerules.promoteTo) return ''
  const piece = (gameData.pieceAlts && gameData.pieceAlts[gameData.gamerules.promoteTo[nth]]) ?? gameData.gamerules.promoteTo[nth]
  return (PIECES_NAMES as O<string>)[piece]
}

export const generatePromotion = (gameData: GameData) => {
  let promotion = ''
  if (!gameData.gamerules.promotionRank) gameData.gamerules.promotionRank = gameData.type === 'Teams' ? 11 : 8
  if (!gameData.gamerules.promoteTo) gameData.gamerules.promoteTo = gameData.gamerules.giveaway ? 'QBRNK' : 'QBRN'
  if (gameData.gamerules.promotionRank === 99) promotion = 'Off'
  else {
    promotion += getPromotionPiece(gameData, 0)
    for (let i = 1; i < gameData.gamerules.promoteTo.length; i++) promotion += ', ' + getPromotionPiece(gameData, i)
    promotion += ' on the ' + gameData.gamerules.promotionRank + (['st', 'nd', 'rd'][gameData.gamerules.promotionRank - 1] ?? 'th') + ' rank'
  }
  return promotion
}

export const generateRowFen = (fen: string) =>
  fen
    .section('', '-')
    ?.split(/[,/]/)
    .map((x) => (isNaN(+x) ? (x.length === 1 ? x + x : x) : new Array(+x).fill('__').join('')))
    .join('') ?? ''
