import { Module } from '@nestjs/common'
import { BoardDrawerService } from './board-drawer.service'
import { pieceImagesFactory } from './piece-images.factory'

@Module({
  imports: [],
  providers: [BoardDrawerService, pieceImagesFactory],
  exports: [BoardDrawerService],
})
export class BoardDrawerModule {}
