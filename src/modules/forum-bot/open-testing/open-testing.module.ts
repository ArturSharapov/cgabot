import { Module } from '@nestjs/common'
import { ChesscomModule } from 'src/modules/chesscom/chesscom.module'
import { RealtimeDatabaseModule } from 'src/modules/database/realtime/realtime-database.module'
import { PostsModule } from '../posts/posts.module'
import { OpenTestingGamesService } from './open-testing-games.service'
import { OpenTestingService } from './open-testing.service'

@Module({
  imports: [PostsModule, RealtimeDatabaseModule, ChesscomModule],
  providers: [OpenTestingService, OpenTestingGamesService],
})
export class OpenTestingModule {}
