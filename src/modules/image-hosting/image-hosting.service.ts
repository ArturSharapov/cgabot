import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class ImageHostingService {
  private logger = new Logger(ImageHostingService.name)
  constructor(private readonly httpService: HttpService, private readonly configService: ConfigService) {}

  readonly #token = this.configService.get<string>('ImageHosting.token')

  upload(name: string, image: string) {
    return new Promise<string>((resolve) => {
      this.httpService
        .post('', 'image=' + encodeURIComponent(image.split(',')[1]), {
          params: { key: this.#token, name },
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        .subscribe({
          next(value) {
            if (value.data.success) resolve(value.data.data.url)
            else resolve('')
          },
          error: (error) => {
            this.logger.error(`Error ${JSON.stringify(error.response.data)}`)
          },
        })
    })
  }
}
