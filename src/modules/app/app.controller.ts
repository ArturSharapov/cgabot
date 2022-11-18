import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  // constructor() {}

  @Get()
  async default(): Promise<any> {
    return { statusCode: 200, message: 'OK' }
  }

  // @Get()
  // async default(@Query('fen') fen: string): Promise<any> {
  //   if (!fen) return
  //   return `<img src="${this.boardDrawerService.draw(fen, true, false, true)}"></img>`
  // }
}
