import { Module } from '@nestjs/common'
import { BoardDrawerModule } from 'src/modules/board-drawer/board-drawer.module'
import { ChesscomModule } from 'src/modules/chesscom/chesscom.module'
import { RealtimeDatabaseModule } from 'src/modules/database/realtime/realtime-database.module'
import { ImageHostingModule } from 'src/modules/image-hosting/image-hosting.module'
import { PostsService } from './posts.service'

@Module({
  imports: [RealtimeDatabaseModule, ChesscomModule, BoardDrawerModule, ImageHostingModule],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
