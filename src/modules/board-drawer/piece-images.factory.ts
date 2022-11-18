import { generatePieceImages } from './piece-images'

export const PieceImagesFactory = Symbol('PIECES_IMAGES')

export const pieceImagesFactory = {
  provide: PieceImagesFactory,
  useFactory: async () => {
    const pieces = await generatePieceImages()
    return pieces
  },
}
