import { Controller, Get, Query } from '@nestjs/common'
import { RealtimeDatabaseService } from 'src/modules/database/realtime/realtime-database.service'
import { DEFAULT_POST } from 'src/modules/forum-bot/posts/post.constants'
import { ForumTasksService } from 'src/modules/forum-bot/tasks/forum-tasks.service'

@Controller()
export class AppController {
  constructor(
    private readonly realtimeDatabaseService: RealtimeDatabaseService,
    private readonly forumTasksService: ForumTasksService
  ) { }

  @Get()
  async default(@Query('register') link: string): Promise<any> {
    if (link) {
      try {
        if (!link.startsWith('https://www.chess.com/clubs/forum/view')) throw new TypeError('Invalid url')
        const timestamp = Date.now()
        const postId = await this.realtimeDatabaseService.addNewPost({ ...DEFAULT_POST, dateCreated: timestamp, dateUpdated: timestamp, link })
        this.forumTasksService.checkSpecificPost(postId!)
        return { success: true, message: `Successfully registered new post: ${link}` }
      } catch (e) {
        if (e instanceof Error) {
          return { success: false, message: `Failed to register post: ${link}`, errorMessage: e.message }
        }
        throw e
      }
    }
    return { statusCode: 200, message: 'OK' }
  }

  // @Get()
  // async default(@Query('fen') fen: string): Promise<any> {
  //   if (!fen) return
  //   return `<img src="${this.boardDrawerService.draw(fen, true, false, true)}"></img>`
  // }
}
