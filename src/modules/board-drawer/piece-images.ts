import { Image } from 'canvas'
import { pieceColors } from './canvas-board'
import { getPiecesSVG, piecesLabels, royalIconSVG, wallPieceSVG } from './pieces-svg'

export type PieceImages = {
  multicolor: { [label in typeof piecesLabels[number]]: Image }[]
  plain: { X: Image; x: Image; royal: Image }
}

export const generatePieceImages = async () => {
  const multicolor = await Promise.all(
    pieceColors.map(async (color) => {
      const singlePieceImages = {} as { [label in typeof piecesLabels[number]]: Image }
      await Promise.all(
        piecesLabels.map(async (pieceLabel: typeof piecesLabels[number]) => {
          singlePieceImages[pieceLabel] = await loadImage(getPiecesSVG(color)[pieceLabel])
        }),
      )
      return singlePieceImages
    }),
  )
  const plain = {
    // X: await loadImage(`https://i.ibb.co/DRXV1b0/wall.png`),
    x: await loadImage(wallPieceSVG),
    X: await loadImage(wallPieceSVG),
    royal: await loadImage(royalIconSVG),
  }
  return { multicolor, plain }
}

const loadImage = (src: string) => {
  return new Promise<Image>((resolve) => {
    const base = src.trimStart().startsWith('<svg') ? `data:image/svg+xml;base64,${btoa(src)}` : src
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => {
      throw e
    }
    img.src = base
  })
}
