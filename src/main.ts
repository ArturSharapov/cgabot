import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/app/app.module'
import './functions'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(process.env.PORT || 3002)
}
bootstrap()
