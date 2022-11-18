import { Module } from '@nestjs/common'
import { ClubsBotService } from './clubs-bot.service'

@Module({
  imports: [],
  providers: [ClubsBotService],
})
export class ClubsBotModule {}
