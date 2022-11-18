import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService, registerAs } from '@nestjs/config'
import { ChesscomService } from './chesscom.service'

const chesscomApiEnvs = registerAs('ChesscomApi', () => ({
  url: process.env.CHESSCOM_API_URL,
}))

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule.forFeature(chesscomApiEnvs)],
      useFactory: async (configService: ConfigService) => ({
        baseURL: configService.get('ChesscomApi.url'),
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
