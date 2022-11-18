import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ChesscomService } from './chesscom.service'

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        baseURL: configService.get('CHESSCOM_API_URL'),
        timeout: 10_000,
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  providers: [ChesscomService],
  exports: [ChesscomService],
})
export class ChesscomModule {}
