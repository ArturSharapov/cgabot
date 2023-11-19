import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { RealtimeDatabaseModule } from 'src/modules/database/realtime/realtime-database.module'
import { ForumBotModule } from '../forum-bot/forum-bot.module'
import { AppController } from './app.controller'

@Module({
  imports: [
    // Comment modules to disable
    ConfigModule.forRoot({ envFilePath: `.env` }),
    ForumBotModule,
    RealtimeDatabaseModule,
    // ClubsBotModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
