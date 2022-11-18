import { Inject, Injectable } from '@nestjs/common'
import { CanvasBoard } from './canvas-board'
import { PieceImages } from './piece-images'
import { PieceImagesFactory } from './piece-images.factory'
import { piecesLabels } from './pieces-svg'

@Injectable()
export class BoardDrawerService {
  constructor(@Inject(PieceImagesFactory) private readonly pieceImages: PieceImages) {}

  draw(fen: string, koth: boolean, deadWall: boolean, racingKings: boolean) {
    const splittedFen = fen.split('-')
    const dead: boolean[] = JSON.parse(splittedFen[2])
    const options: Partial<{
      lives: number[]
      royal: string[]
      resigned: boolean[]
      zombieType: string[]
      zombieImmune: boolean[]
      dim: string
    }> = JSON.parse(splittedFen[7] ?? splittedFen[6])
    const royals: { x: number; y: number }[] = options.royal
      ? options.royal.map((r: string) => ({ x: r.charCodeAt(0) - 97, y: 14 - +(r[1] + (r[2] ?? '')) }))
      : []
    const dim = (options.dim ? options.dim.split('x').map(Number) : [14, 14]) as [number, number]

    const data = splittedFen[0].split('/').map((row, y) => {
      const newRow: { piece: string; color?: number }[] = []
      row.split(',').forEach((item) => {
        if (isNaN(+item)) {
          if (item[0] === 'd') newRow.push({ piece: item[2] ?? item[1], color: 0 })
          else if (item[1]) {
            const color = +item[0]
            if (!options.royal && !isNaN(color) && !royals[color] && item[1] === 'K') {
              royals[color] = { x: newRow.length, y }
            }
            newRow.push({ piece: item[1], color: isNaN(color) ? 0 : color + 1 })
          } else newRow.push({ piece: item[0] })
        } else {
          newRow.push(...new Array(+item))
        }
      })
      return newRow
    })

    const board = new CanvasBoard(523)

    for (const Y in data) {
      for (const X in data[Y]) {
        const [x, y, item] = [+X, +Y, data[Y][X]]
        // if ((x > 10 || x < 3) && (y > 10 || y < 3)) board.createImage(this.pieceImages.plain.x, x + 1, y + 1)
        if (!item) continue
        if (item.color === undefined) board.createImage(this.pieceImages.plain[item.piece as keyof typeof this.pieceImages.plain], x + 1, y + 1)
        else {
          if (!piecesLabels.includes(item.piece as any)) item.piece = 'P'
          const zombieType = options.resigned && options.resigned[item.color - 1] && ((options.zombieType && options.zombieType[item.color - 1]) || 'rando')
          const isRoyal = item.color && royals[item.color - 1] && royals[item.color - 1].x === x && royals[item.color - 1].y === y
          const isImmune = options.zombieImmune && options.zombieImmune[item.color - 1]
          const color = item.color + +(item.color && dead[item.color - 1]) * 4
          if (zombieType)
            if (isImmune) board.indicateZombieImmune(zombieType, x + 1, y + 1)
            else board.indicateZombie(zombieType, x + 1, y + 1)
          //   else if (!isRoyal) board.indicateZombie(zombieType, x + 1, y + 1)
          // if ((options.royal || (zombieType && !isImmune)) && isRoyal)
          //   if (zombieType) board.indicateRoyalZombie(x + 1, y + 1, zombieType)
          //   else board.indicateRoyalOld(x + 1, y + 1, color)
          const multicolorPiece = this.pieceImages.multicolor[color]
          if (deadWall && color === 0) board.createImage(this.pieceImages.plain.x, x + 1, y + 1)
          board.createImage(multicolorPiece[item.piece as keyof typeof multicolorPiece], x + 1, y + 1)
          if (options.lives && isRoyal && !dead[item.color - 1]) board.indicateNCheck(options.lives[item.color - 1], x + 1, y + 1)
          if ((options.royal || (zombieType && !isImmune)) && isRoyal) board.indicateRoyal(this.pieceImages.plain.royal, x + 1, y + 1)
        }
      }
    }

    if (koth) board.createKOTH()
    if (racingKings) board.createRacing(dim)

    return board.generateDataURL()
  }
}
