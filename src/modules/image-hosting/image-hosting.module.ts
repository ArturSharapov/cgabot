import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule, registerAs } from '@nestjs/config'
import { ImageHostingService } from './image-hosting.service'

const imageHostingEnvs = registerAs('ForumBot', () => ({
  token: process.env.IMGBB_TOKEN,
}))

@Module({
  imports: [HttpModule.register({ baseURL: 'https://api.imgbb.com/1/upload' }), ConfigModule.forFeature(imageHostingEnvs)],
  providers: [ImageHostingService],
  exports: [ImageHostingService],
})
export class ImageHostingModule {}
