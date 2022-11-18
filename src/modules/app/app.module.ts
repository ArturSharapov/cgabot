import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ForumBotModule } from '../forum-bot/forum-bot.module'
import { AppController } from './app.controller'

@Module({
  imports: [
    // Comment modules to disable
    ConfigModule.forRoot({ envFilePath: `.env` }),
    ForumBotModule,
    // ClubsBotModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
