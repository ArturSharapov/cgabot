import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ImageHostingService } from './image-hosting.service'

@Module({
  imports: [HttpModule.register({ baseURL: 'https://api.imgbb.com/1/upload' }), ConfigModule],
  providers: [ImageHostingService],
  exports: [ImageHostingService],
})
export class ImageHostingModule {}
