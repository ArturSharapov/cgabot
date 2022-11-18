import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule, registerAs } from '@nestjs/config'
import { BoardDrawerModule } from '../board-drawer/board-drawer.module'
import { ChesscomModule } from '../chesscom/chesscom.module'
import { RealtimeDatabaseModule } from '../database/realtime/realtime-database.module'
import { ImageHostingModule } from '../image-hosting/image-hosting.module'
import { ForumBotService } from './forum-bot.service'
import { OpenTestingModule } from './open-testing/open-testing.module'
import { PostEditsService } from './post-edits/post-edits.service'
import { PostsModule } from './posts/posts.module'
import { ForumTasksService } from './tasks/forum-tasks.service'
import { PostEvaluationService } from './tasks/post-evaluation.service'

const forumBotEnvs = registerAs('ForumBot', () => ({
  clubLink: 'https://www.chess.com/club/' + process.env.CLUB_NAME,
}))

@Module({
  imports: [
    ChesscomModule,
    BoardDrawerModule,
    ImageHostingModule,
    HttpModule,
    RealtimeDatabaseModule,
    PostsModule,
    OpenTestingModule,
    ConfigModule.forFeature(forumBotEnvs),
  ],
  providers: [ForumBotService, ForumTasksService, PostEditsService, PostEvaluationService],
  exports: [ForumBotService],
})
export class ForumBotModule {}
